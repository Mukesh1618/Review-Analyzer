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
# Using Groq for the LLM. Temperature set to 0.0 for deterministic extraction and math.
llm = ChatGroq(model_name="qwen/qwen3-32b", temperature=0.0) 

# Using HuggingFace for free, local embeddings to use with FAISS
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

# --- 3. Mock FAISS Database Setup ---
# Adjusted mock data to test aspect scoring (multiple mentions of battery and camera)
sample_reviews = [
    Document(page_content="The battery life is incredible, lasts two full days. But the camera is terrible in low light.", metadata={"rating": 3}), # Battery: Pos, Camera: Neg
    Document(page_content="Amazing performance, super fast charging. Highly recommend it for gaming. Battery is solid.", metadata={"rating": 5}), # Perf: Pos, Battery: Pos
    Document(page_content="Overpriced for what it offers. The screen is nice, but it gets too hot when watching videos. Camera is okay.", metadata={"rating": 2}), # Price: Neg, Screen: Pos, Camera: Neutral
    Document(page_content="Decent phone, battery is okay, camera is okay. Nothing special.", metadata={"rating": 3}), # Battery: Neutral, Camera: Neutral
    Document(page_content="Absolutely terrible. The battery drains so fast and customer service was no help.", metadata={"rating": 1}) # Battery: Neg, CS: Neg
]
vector_db = FAISS.from_documents(sample_reviews, embeddings)

# --- 4. Define LangGraph State ---
class AgentState(TypedDict):
    query: str
    retrieved_reviews: List[str]
    aspect_analysis: str

# --- 5. Define Graph Nodes ---
def retrieve_reviews(state: AgentState):
    """Retrieves relevant reviews from FAISS based on the query."""
    print("-> Retrieving reviews from FAISS...")
    query = state["query"]
    docs = vector_db.similarity_search(query, k=5) 
    reviews_text = [f"Review {i+1}: {doc.page_content}" for i, doc in enumerate(docs)]
    return {"retrieved_reviews": reviews_text}

def analyze_aspects(state: AgentState):
    """Extracts aspects and calculates an aspect-specific sentiment score ignoring neutrals."""
    print("-> Performing Aspect-Based Analysis and Scoring...")
    reviews = "\n".join(state["retrieved_reviews"])
    
    aspect_prompt = ChatPromptTemplate.from_messages([
        ("system", """You are an expert product analyst. Read the provided product reviews and perform aspect-based sentiment analysis.

1. EXTRACTION: Identify the specific product features or aspects mentioned across the reviews (e.g., battery, camera, price, screen).
2. SCORING: For EACH identified aspect, calculate a sentiment score out of 10 based on how it was discussed across all reviews.
   - IMPORTANT: Completely disregard 'Neutral' mentions of the aspect.
   - Base the score ONLY on the 'Positive' and 'Negative' mentions of that specific aspect.
   - Use this exact formula: (Count of Positive Mentions / (Count of Positive + Count of Negative Mentions)) * 10.
   - If an aspect only has neutral mentions, label the score as 'N/A'.

Format your output EXACTLY like this:

ASPECTS:
- **[Aspect Name]**: [Score]/10
  - Reasoning: [Show your math based on the counts of Positive and Negative mentions for this aspect]
  - Feedback Summary: [1 sentence summarizing what users said about this aspect]"""),
        ("user", "Here are the reviews to analyze:\n\n{reviews}")
    ])
    
    aspect_chain = aspect_prompt | llm
    aspect_result = aspect_chain.invoke({"reviews": reviews})
    
    return {
        "aspect_analysis": aspect_result.content
    }

# --- 6. Build the LangGraph ---
workflow = StateGraph(AgentState)

# Add nodes
workflow.add_node("retrieve", retrieve_reviews)
workflow.add_node("analyze", analyze_aspects)

# Define edges
workflow.set_entry_point("retrieve")
workflow.add_edge("retrieve", "analyze")
workflow.add_edge("analyze", END)

# Compile graph
aspect_agent = workflow.compile()

# --- 7. Test the Agent ---
if __name__ == "__main__":
    print("Starting Aspect-Based Analysis Agent Test...\n")
    
    test_query = "What specific features do people like or dislike about this phone?"
    
    initial_state = {
        "query": test_query,
        "retrieved_reviews": [],
        "aspect_analysis": ""
    }
    
    # Run the graph
    result = aspect_agent.invoke(initial_state)
    
    print("\n" + "="*50)
    print("🔍 ASPECT-BASED SENTIMENT ANALYSIS:")
    print("="*50)
    print(result["aspect_analysis"])