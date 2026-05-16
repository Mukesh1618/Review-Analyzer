import os
from typing import TypedDict, List
from langchain_groq import ChatGroq
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_core.documents import Document
from langchain_core.prompts import ChatPromptTemplate
from langgraph.graph import StateGraph, END
from dotenv import load_dotenv

# --- 1. Environment Setup ---
load_dotenv()
api_key = os.getenv("GROQ_API_KEY")
os.environ["GROQ_API_KEY"] = api_key


# --- 2. Initialize Models ---
# Using Groq for the LLM
llm = ChatGroq(model_name="qwen/qwen3-32b", temperature=0.2) 

# Using HuggingFace for free, local embeddings to use with FAISS
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

# --- 3. Mock FAISS Database Setup (For independent testing) ---
# Simulating the chunked reviews stored in FAISS as per your spec
sample_reviews = [
    Document(page_content="The battery life is incredible, lasts two full days. But the camera is terrible in low light.", metadata={"rating": 3}),
    Document(page_content="Amazing performance, super fast charging. Highly recommend it for gaming.", metadata={"rating": 5}),
    Document(page_content="Overpriced for what it offers. The screen is nice, but it gets too hot when watching videos.", metadata={"rating": 2}),
    Document(page_content="Decent phone, battery is okay, camera is okay. Nothing special.", metadata={"rating": 3})
]
vector_db = FAISS.from_documents(sample_reviews, embeddings)

# --- 4. Define LangGraph State ---
class AgentState(TypedDict):
    query: str
    retrieved_reviews: List[str]
    short_summary: str
    detailed_summary: str

# --- 5. Define Graph Nodes ---

def retrieve_reviews(state: AgentState):
    """Retrieves relevant reviews from FAISS based on the query."""
    print("-> Retrieving reviews from FAISS...")
    query = state["query"]
    # Retrieve top 4 most relevant chunks
    docs = vector_db.similarity_search(query, k=4) 
    reviews_text = [doc.page_content for doc in docs]
    return {"retrieved_reviews": reviews_text}

def generate_summaries(state: AgentState):
    """Generates both a short and detailed summary using Groq."""
    print("-> Generating summaries...")
    reviews = "\n- ".join(state["retrieved_reviews"])
    
    # Prompt for Short Summary
    short_prompt = ChatPromptTemplate.from_messages([
        ("system", "You are an expert product analyst. Provide a 3 sentence concise summary of the following product reviews."),
        ("user", "Reviews:\n- {reviews}")
    ])
    short_chain = short_prompt | llm
    short_result = short_chain.invoke({"reviews": reviews})
    
    # Prompt for Detailed Summary
    detailed_prompt = ChatPromptTemplate.from_messages([
        ("system", """You are an expert product analyst.
                      Provide a detailed summary of the following product reviews.
                      Highlight the most important things about the product in your summaries as well.
                      Make the summary under 400 words."""),
        ("user", "Reviews:\n- {reviews}")
    ])
    detailed_chain = detailed_prompt | llm
    detailed_result = detailed_chain.invoke({"reviews": reviews})
    
    return {
        "short_summary": short_result.content,
        "detailed_summary": detailed_result.content
    }

# --- 6. Build the LangGraph ---
workflow = StateGraph(AgentState)

# Add nodes
workflow.add_node("retrieve", retrieve_reviews)
workflow.add_node("summarize", generate_summaries)

# Define edges
workflow.set_entry_point("retrieve")
workflow.add_edge("retrieve", "summarize")
workflow.add_edge("summarize", END)

# Compile graph
summary_agent = workflow.compile()

# --- 7. Test the Agent ---
if __name__ == "__main__":
    print("Starting Summary Agent Test...\n")
    
    test_query = "Summarize the overall feedback regarding the phone."
    
    initial_state = {
        "query": test_query,
        "retrieved_reviews": [],
        "short_summary": "",
        "detailed_summary": ""
    }
    
    # Run the graph
    result = summary_agent.invoke(initial_state)
    
    print("\n" + "="*50)
    print("🎯 SHORT SUMMARY:")
    print("="*50)
    print(result["short_summary"])
    
    print("\n" + "="*50)
    print("📊 DETAILED SUMMARY:")
    print("="*50)
    print(result["detailed_summary"])