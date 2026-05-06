import os
import io
import pandas as pd
from typing import TypedDict, List, Dict, Any, Annotated
from fastapi import FastAPI, UploadFile, File, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
import operator

from langchain_groq import ChatGroq
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_core.documents import Document
from langchain_core.messages import HumanMessage, BaseMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="ReviewMind API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global State
FAISS_INDEX_PATH = "faiss_index"
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
llm = ChatGroq(model_name="qwen/qwen3-32b", temperature=0.1)
global_vector_db = None
memory = MemorySaver()

def load_vector_db():
    global global_vector_db
    if os.path.exists(FAISS_INDEX_PATH):
        try:
            global_vector_db = FAISS.load_local(FAISS_INDEX_PATH, embeddings, allow_dangerous_deserialization=True)
            print("Loaded FAISS index from disk.")
        except Exception as e:
            print(f"Error loading FAISS index: {e}")

load_vector_db()

# --- Q&A Agent Implementation ---
class ChatState(TypedDict):
    messages: Annotated[List[Any], operator.add]
    context: str

def retrieve_chat_context(state: ChatState):
    global global_vector_db
    if not global_vector_db:
        return {"context": ""}
    latest_query = state["messages"][-1].content
    docs = global_vector_db.similarity_search(latest_query, k=5)
    context = "\n- ".join([doc.page_content for doc in docs])
    return {"context": context}

SYSTEM_RESTRICTION = "\n\nCRITICAL: Do not include any internal thought process, <think> tags, or 'thinking' blocks in your output. Provide ONLY the requested information."

def generate_chat_answer(state: ChatState):
    qa_prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a helpful product assistant. Answer based ONLY on the provided review context. If the context doesn't have the answer, say so.\n\nContext:\n{context}" + SYSTEM_RESTRICTION),
        MessagesPlaceholder(variable_name="messages")
    ])
    response = (qa_prompt | llm).invoke({"context": state["context"], "messages": state["messages"]})
    return {"messages": [response]}

chat_workflow = StateGraph(ChatState)
chat_workflow.add_node("retrieve", retrieve_chat_context)
chat_workflow.add_node("answer", generate_chat_answer)
chat_workflow.add_edge(START, "retrieve")
chat_workflow.add_edge("retrieve", "answer")
chat_workflow.add_edge("answer", END)
chat_agent = chat_workflow.compile(checkpointer=memory)

class ChatRequest(BaseModel):
    message: str
    thread_id: str

@app.post("/chat")
async def chat_endpoint(req: ChatRequest):
    if not global_vector_db:
        return {"error": "No product selected or uploaded."}
    
    config = {"configurable": {"thread_id": req.thread_id}}
    input_state = {"messages": [HumanMessage(content=req.message)]}
    result = chat_agent.invoke(input_state, config=config)
    reply = result["messages"][-1].content
    return {"reply": clean_llm_output(reply)}

@app.get("/products")
async def get_products():
    name = "Active Product Data"
    if os.path.exists(os.path.join(FAISS_INDEX_PATH, "product_name.txt")):
        with open(os.path.join(FAISS_INDEX_PATH, "product_name.txt"), "r") as f:
            name = f.read().strip()
    if os.path.exists(FAISS_INDEX_PATH):
        return [{"id": "current", "name": name}]
    return []

@app.post("/select_product")
async def select_product(product_id: str):
    load_vector_db()
    return {"message": "Product selected."}

class DashboardState(TypedDict):
    query: str
    retrieved_reviews: List[str]
    total_reviews: int
    
    # Agent Outputs
    product_name: str
    short_summary: str
    detailed_summary: str
    sentiment_analysis: str
    pros: str
    cons: str
    aspect_analysis: str
    keyword_analysis: str
    predicted_rating: str
    timeline_analysis: str
    fake_review_analysis: str

def ingest_node(state: DashboardState):
    global global_vector_db
    if not global_vector_db:
        return {"retrieved_reviews": [], "total_reviews": 0}
    
    docs = global_vector_db.similarity_search(state["query"], k=10)
    reviews = [doc.page_content for doc in docs]
    total = global_vector_db.index.ntotal if hasattr(global_vector_db, 'index') else len(reviews)
    return {"retrieved_reviews": reviews, "total_reviews": total}

def run_product_name_agent(state: DashboardState):
    reviews = "\n- ".join(state["retrieved_reviews"])
    if not reviews: return {"product_name": "Unknown Product"}
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Extract the specific product name from these reviews. Return ONLY the product name, no other text." + SYSTEM_RESTRICTION),
        ("user", "Reviews:\n- {reviews}")
    ])
    out = (prompt | llm).invoke({"reviews": reviews}).content
    name = clean_llm_output(out)
    # Store it for /products endpoint
    if os.path.exists(FAISS_INDEX_PATH):
        with open(os.path.join(FAISS_INDEX_PATH, "product_name.txt"), "w") as f:
            f.write(name)
    return {"product_name": name}

import re

def clean_llm_output(text: str) -> str:
    """Removes <think>...</think> blocks and any unclosed <think> tags."""
    text = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL)
    text = re.sub(r'<think>.*', '', text, flags=re.DOTALL)
    return text.strip()

def run_summary_agent(state: DashboardState):
    reviews = "\n- ".join(state["retrieved_reviews"])
    if not reviews: return {"short_summary": "No data", "detailed_summary": "No data"}
    
    short_prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an expert product analyst. Provide a 1-sentence concise executive summary." + SYSTEM_RESTRICTION),
        ("user", "Reviews:\n- {reviews}")
    ])
    detailed_prompt = ChatPromptTemplate.from_messages([
        ("system", "Provide a detailed summary under 100 words." + SYSTEM_RESTRICTION),
        ("user", "Reviews:\n- {reviews}")
    ])
    
    short_out = (short_prompt | llm).invoke({"reviews": reviews}).content
    detailed_out = (detailed_prompt | llm).invoke({"reviews": reviews}).content
    
    return {
        "short_summary": clean_llm_output(short_out),
        "detailed_summary": clean_llm_output(detailed_out)
    }

def run_sentiment_agent(state: DashboardState):
    reviews = "\n- ".join(state["retrieved_reviews"])
    if not reviews: return {"sentiment_analysis": "No data"}
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Analyze sentiment and provide an overall score (e.g. 4.2/5) and breakdown." + SYSTEM_RESTRICTION),
        ("user", "Reviews:\n- {reviews}")
    ])
    out = (prompt | llm).invoke({"reviews": reviews}).content
    return {"sentiment_analysis": clean_llm_output(out)}

def run_pros_cons_agent(state: DashboardState):
    reviews = "\n- ".join(state["retrieved_reviews"])
    if not reviews: return {"pros": "", "cons": ""}
    prompt_pros = ChatPromptTemplate.from_messages([("system", "List top 3 pros." + SYSTEM_RESTRICTION), ("user", "{reviews}")])
    prompt_cons = ChatPromptTemplate.from_messages([("system", "List top 3 cons." + SYSTEM_RESTRICTION), ("user", "{reviews}")])
    
    pros_out = (prompt_pros | llm).invoke({"reviews": reviews}).content
    cons_out = (prompt_cons | llm).invoke({"reviews": reviews}).content
    
    return {
        "pros": clean_llm_output(pros_out),
        "cons": clean_llm_output(cons_out)
    }

def run_keyword_agent(state: DashboardState):
    reviews = "\n- ".join(state["retrieved_reviews"])
    if not reviews: return {"keyword_analysis": ""}
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Act as a product engineer. Extract the top 3 specific product features or technical attributes mentioned (e.g., 'OLED Display', 'Snapdragon Processor', 'Fast Charging'). Strictly avoid generic sentiment words like 'good', 'bad', or 'product'. Just list the 3 features separated by commas." + SYSTEM_RESTRICTION),
        ("user", "{reviews}")
    ])
    out = (prompt | llm).invoke({"reviews": reviews}).content
    return {"keyword_analysis": clean_llm_output(out)}

def run_aspect_agent(state: DashboardState):
    reviews = "\n- ".join(state["retrieved_reviews"])
    if not reviews: return {"aspect_analysis": ""}
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are an expert product analyst. Read the provided product reviews and perform aspect-based sentiment analysis.
1. EXTRACTION: Identify the specific product features or aspects mentioned across the reviews (e.g., battery, camera, price, screen).
2. SCORING: For EACH identified aspect, calculate a sentiment score out of 10.
   - Use this exact formula: (Count of Positive Mentions / (Count of Positive + Count of Negative Mentions)) * 10.

Format your output EXACTLY like this for each aspect:
- **Aspect Name**: Score/10""" + SYSTEM_RESTRICTION),
        ("user", "Reviews:\n- {reviews}")
    ])
    out = (prompt | llm).invoke({"reviews": reviews}).content
    return {"aspect_analysis": clean_llm_output(out)}

def run_rating_agent(state: DashboardState):
    reviews = "\n- ".join(state["retrieved_reviews"])
    if not reviews: return {"predicted_rating": "N/A"}
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Predict the overall product rating out of 5 based on the sentiment of the reviews." + SYSTEM_RESTRICTION),
        ("user", "Reviews:\n- {reviews}")
    ])
    out = (prompt | llm).invoke({"reviews": reviews}).content
    return {"predicted_rating": clean_llm_output(out)}

def run_timeline_agent(state: DashboardState):
    reviews = "\n- ".join(state["retrieved_reviews"])
    if not reviews: return {"timeline_analysis": "No data"}
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Analyze the reviews to track how the product's rating has changed over time. Identify any turning points or patterns." + SYSTEM_RESTRICTION),
        ("user", "Reviews:\n- {reviews}")
    ])
    out = (prompt | llm).invoke({"reviews": reviews}).content
    return {"timeline_analysis": clean_llm_output(out)}

def run_fake_review_agent(state: DashboardState):
    reviews = "\n- ".join(state["retrieved_reviews"])
    if not reviews: return {"fake_review_analysis": "No data"}
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Identify suspicious or spam reviews and calculate a trust/authenticity score (0-100%)." + SYSTEM_RESTRICTION),
        ("user", "Reviews:\n- {reviews}")
    ])
    out = (prompt | llm).invoke({"reviews": reviews}).content
    return {"fake_review_analysis": clean_llm_output(out)}

def compile_dashboard(state: DashboardState):
    return state

# Build Graph
workflow = StateGraph(DashboardState)
workflow.add_node("ingest", ingest_node)
workflow.add_node("product_name", run_product_name_agent)
workflow.add_node("summary", run_summary_agent)
workflow.add_node("sentiment", run_sentiment_agent)
workflow.add_node("pros_cons", run_pros_cons_agent)
workflow.add_node("keyword", run_keyword_agent)
workflow.add_node("aspect", run_aspect_agent)
workflow.add_node("rating", run_rating_agent)
workflow.add_node("timeline", run_timeline_agent)
workflow.add_node("fake", run_fake_review_agent)
workflow.add_node("compile", compile_dashboard)

workflow.add_edge(START, "ingest")
workflow.add_edge("ingest", "product_name")
workflow.add_edge("ingest", "summary")
workflow.add_edge("ingest", "sentiment")
workflow.add_edge("ingest", "pros_cons")
workflow.add_edge("ingest", "keyword")
workflow.add_edge("ingest", "aspect")
workflow.add_edge("ingest", "rating")
workflow.add_edge("ingest", "timeline")
workflow.add_edge("ingest", "fake")

workflow.add_edge("product_name", "compile")
workflow.add_edge("summary", "compile")
workflow.add_edge("sentiment", "compile")
workflow.add_edge("pros_cons", "compile")
workflow.add_edge("keyword", "compile")
workflow.add_edge("aspect", "compile")
workflow.add_edge("rating", "compile")
workflow.add_edge("timeline", "compile")
workflow.add_edge("fake", "compile")
workflow.add_edge("compile", END)

orchestrator = workflow.compile()

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    global global_vector_db
    content = await file.read()
    
    try:
        df = pd.read_csv(io.BytesIO(content))
        col = next((c for c in df.columns if 'review' in c.lower() or 'text' in c.lower()), df.columns[0])
        reviews = df[col].dropna().astype(str).tolist()
    except Exception:
        text = content.decode('utf-8', errors='ignore')
        reviews = [line.strip() for line in text.split('\n') if line.strip()]

    docs = [Document(page_content=r) for r in reviews[:100]]
    
    if docs:
        global_vector_db = FAISS.from_documents(docs, embeddings)
        global_vector_db.save_local(FAISS_INDEX_PATH)
        return {"message": f"Successfully loaded {len(docs)} reviews and saved to disk."}
    return {"message": "No reviews found."}

@app.get("/analyze")
async def analyze_dashboard():
    if not global_vector_db:
        return {"error": "No data uploaded yet. Please upload a file first."}
    
    initial_state = {
        "query": "general product feedback",
        "retrieved_reviews": [],
        "total_reviews": 0,
        "product_name": "",
        "short_summary": "",
        "detailed_summary": "",
        "sentiment_analysis": "",
        "pros": "",
        "cons": "",
        "aspect_analysis": "",
        "keyword_analysis": "",
        "predicted_rating": "",
        "timeline_analysis": "",
        "fake_review_analysis": ""
    }
    
    result = orchestrator.invoke(initial_state)
    return result

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
