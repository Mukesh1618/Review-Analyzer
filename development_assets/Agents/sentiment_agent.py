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
# Using Groq for the LLM. Temperature set to 0.0 for deterministic classification and math.
llm = ChatGroq(model_name="qwen/qwen3-32b", temperature=0.0) 

# Using HuggingFace for free, local embeddings to use with FAISS
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

# --- 3. Mock FAISS Database Setup ---
sample_reviews = [
    Document(page_content="The battery life is incredible, lasts two full days. But the camera is terrible in low light.", metadata={"rating": 3}), # Mixed, likely neutral
    Document(page_content="Amazing performance, super fast charging. Highly recommend it for gaming.", metadata={"rating": 5}), # Positive
    Document(page_content="Overpriced for what it offers. The screen is nice, but it gets too hot when watching videos.", metadata={"rating": 2}), # Negative
    Document(page_content="Decent phone, battery is okay, camera is okay. Nothing special.", metadata={"rating": 3}), # Neutral
    Document(page_content="Absolutely terrible. It broke within two days and customer service was no help.", metadata={"rating": 1}) # Negative
]
vector_db = FAISS.from_documents(sample_reviews, embeddings)

# --- 4. Define LangGraph State ---
class AgentState(TypedDict):
    query: str
    retrieved_reviews: List[str]
    sentiment_analysis: str

# --- 5. Define Graph Nodes ---
def retrieve_reviews(state: AgentState):
    """Retrieves relevant reviews from FAISS based on the query."""
    print("-> Retrieving reviews from FAISS...")
    query = state["query"]
    docs = vector_db.similarity_search(query, k=5) 
    # Number the reviews so the LLM can reference them clearly
    reviews_text = [f"Review {i+1}: {doc.page_content}" for i, doc in enumerate(docs)]
    return {"retrieved_reviews": reviews_text}

def analyze_sentiment(state: AgentState):
    """Classifies each review and calculates an overall sentiment score ignoring neutrals."""
    print("-> Analyzing Sentiment and Calculating Score...")
    reviews = "\n".join(state["retrieved_reviews"])
    
    # UPDATED PROMPT: Strict instructions to calculate score based only on positive/negative
    sentiment_prompt = ChatPromptTemplate.from_messages([
        ("system", """You are an expert data analyst. Read the provided product reviews and perform two tasks:

1. CLASSIFICATION: Classify every single review strictly as 'Positive', 'Negative', or 'Neutral'. 
2. SCORING: Calculate an overall sentiment score out of 10.
   - IMPORTANT: Completely disregard 'Neutral' reviews when calculating the score.
   - Base the score ONLY on the 'Positive' and 'Negative' reviews.
   - Use this exact formula: (Count of Positive / (Count of Positive + Count of Negative)) * 10.
   - Example: If there are 5 Positive, 3 Negative, and 2 Neutral reviews, the calculation is (5 / 8) * 10 = 6.25. So the score is 6.25/10.

Format your output exactly like this:

CLASSIFICATIONS:
- [Review 1]: [Classification]
- [Review 2]: [Classification]
(continue for all reviews)

OVERALL SCORE: [Score]/10
REASONING: [Show your math and explain the score calculation based on the counts of Positive and Negative reviews]"""),
        ("user", "Here are the reviews to analyze:\n\n{reviews}")
    ])
    
    sentiment_chain = sentiment_prompt | llm
    sentiment_result = sentiment_chain.invoke({"reviews": reviews})
    
    return {
        "sentiment_analysis": sentiment_result.content
    }

# --- 6. Build the LangGraph ---
workflow = StateGraph(AgentState)

# Add nodes
workflow.add_node("retrieve", retrieve_reviews)
workflow.add_node("analyze", analyze_sentiment)

# Define edges
workflow.set_entry_point("retrieve")
workflow.add_edge("retrieve", "analyze")
workflow.add_edge("analyze", END)

# Compile graph
sentiment_agent = workflow.compile()

# --- 7. Test the Agent ---
if __name__ == "__main__":
    print("Starting Sentiment Agent Test...\n")
    
    test_query = "What do users think about this product overall?"
    
    initial_state = {
        "query": test_query,
        "retrieved_reviews": [],
        "sentiment_analysis": ""
    }
    
    # Run the graph
    result = sentiment_agent.invoke(initial_state)
    
    print("\n" + "="*50)
    print("🧠 SENTIMENT ANALYSIS RESULTS:")
    print("="*50)
    print(result["sentiment_analysis"])