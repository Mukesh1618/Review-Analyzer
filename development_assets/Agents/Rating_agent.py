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
# Using Groq for the LLM. Temperature set to 0.0 for consistent, logical predictions.
llm = ChatGroq(model_name="qwen/qwen3-32b", temperature=0.0) 

# Using HuggingFace for free, local embeddings to use with FAISS
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

# --- 3. Mock FAISS Database Setup ---
sample_reviews = [
    Document(page_content="The battery life is incredible, lasts two full days. But the camera is terrible in low light.", metadata={"rating": 3}),
    Document(page_content="Amazing performance, super fast charging. Highly recommend it for gaming. Battery is solid.", metadata={"rating": 5}),
    Document(page_content="Overpriced for what it offers. The screen is nice, but it gets too hot when watching videos. Camera is okay.", metadata={"rating": 2}),
    Document(page_content="Decent phone, battery is okay, camera is okay. Nothing special.", metadata={"rating": 3}),
    Document(page_content="Absolutely terrible. The battery drains so fast and customer service was no help.", metadata={"rating": 1})
]
vector_db = FAISS.from_documents(sample_reviews, embeddings)

# --- 4. Define LangGraph State ---
class AgentState(TypedDict):
    query: str
    retrieved_reviews: List[str]
    predicted_rating: str

# --- 5. Define Graph Nodes ---
def retrieve_reviews(state: AgentState):
    """Retrieves relevant reviews from FAISS based on the query."""
    print("-> Retrieving reviews from FAISS...")
    query = state["query"]
    # Retrieve top 5 most relevant chunks to get a holistic view for rating prediction
    docs = vector_db.similarity_search(query, k=5) 
    reviews_text = [f"Review {i+1}: {doc.page_content}" for i, doc in enumerate(docs)]
    return {"retrieved_reviews": reviews_text}

def predict_rating(state: AgentState):
    """Predicts the overall 1-5 star rating based on the retrieved reviews."""
    print("-> Predicting Overall Rating...")
    reviews = "\n".join(state["retrieved_reviews"])
    
    predict_prompt = ChatPromptTemplate.from_messages([
        ("system", """You are an expert product analyst. Read the provided product reviews and predict the overall product rating.

Your task is to synthesize the overall sentiment and predict what the average star rating would be on a scale of 1 to 5. 
- Weigh extreme reviews (very positive or very negative) heavily.
- Consider moderate reviews as pulling the score toward a 3.
- Output a single number (e.g., 1.0, 2.5, 3.8, 4.2, 5.0).

Format your output EXACTLY like this:

⭐ PREDICTED RATING: [Your predicted number]/5 Stars
📝 REASONING: [1-2 sentences explaining how you weighed the positive and negative feedback to arrive at this specific rating]"""),
        ("user", "Here are the reviews to analyze:\n\n{reviews}")
    ])
    
    predict_chain = predict_prompt | llm
    predict_result = predict_chain.invoke({"reviews": reviews})
    
    return {
        "predicted_rating": predict_result.content
    }

# --- 6. Build the LangGraph ---
workflow = StateGraph(AgentState)

# Add nodes
workflow.add_node("retrieve", retrieve_reviews)
workflow.add_node("predict", predict_rating)

# Define edges
workflow.set_entry_point("retrieve")
workflow.add_edge("retrieve", "predict")
workflow.add_edge("predict", END)

# Compile graph
rating_agent = workflow.compile()

# --- 7. Test the Agent ---
if __name__ == "__main__":
    print("Starting Rating Prediction Agent Test...\n")
    
    test_query = "Based on the feedback, what is the expected star rating for this phone?"
    
    initial_state = {
        "query": test_query,
        "retrieved_reviews": [],
        "predicted_rating": ""
    }
    
    # Run the graph
    result = rating_agent.invoke(initial_state)
    
    print("\n" + "="*50)
    print("📊 RATING PREDICTION RESULT:")
    print("="*50)
    print(result["predicted_rating"])