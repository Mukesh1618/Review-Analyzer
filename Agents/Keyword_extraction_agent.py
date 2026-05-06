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
# Temperature is 0.0 to ensure strict extraction without inventing words.
llm = ChatGroq(model_name="qwen/qwen3-32b", temperature=0.0) 

embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

# --- 3. Mock FAISS Database Setup ---
# I've added heavily repeated words here (battery, update, camera) to test the extraction.
sample_reviews = [
    Document(page_content="The battery life is incredible, lasts two full days. But the camera is terrible in low light.", metadata={"rating": 3}),
    Document(page_content="Amazing performance, super fast charging. Battery is solid. Highly recommend it for gaming.", metadata={"rating": 5}),
    Document(page_content="Overpriced for what it offers. The screen is nice, but it gets too hot when watching videos. Camera is just okay.", metadata={"rating": 2}),
    Document(page_content="Decent phone, battery is okay, camera is okay. Nothing special.", metadata={"rating": 3}),
    Document(page_content="Absolutely terrible. The battery drains so fast after the new update.", metadata={"rating": 1}),
    Document(page_content="Love the screen, but the recent software update ruined the battery optimization.", metadata={"rating": 2})
]
vector_db = FAISS.from_documents(sample_reviews, embeddings)

# --- 4. Define LangGraph State ---
class AgentState(TypedDict):
    query: str
    retrieved_reviews: List[str]
    keyword_analysis: str

# --- 5. Define Graph Nodes ---
def retrieve_reviews(state: AgentState):
    print("-> Retrieving reviews from FAISS...")
    query = state["query"]
    # Retrieving top 6 chunks to give the LLM enough text to spot word frequencies
    docs = vector_db.similarity_search(query, k=6) 
    reviews_text = [doc.page_content for doc in docs]
    return {"retrieved_reviews": reviews_text}

def extract_keywords(state: AgentState):
    """Extracts frequently mentioned terms and phrases."""
    print("-> Extracting Keywords...")
    reviews = "\n- ".join(state["retrieved_reviews"])
    
    keyword_prompt = ChatPromptTemplate.from_messages([
        ("system", """You are an expert SEO and product data analyst. Analyze the provided product reviews and extract the most frequently mentioned keywords or short phrases.

1. Ignore common stop words (e.g., 'the', 'is', 'and', 'but', 'for').
2. Identify the top 5 most repeated, meaningful terms (e.g., specific features, adjectives, or recurring issues).
3. Provide a rough count of how many times the concept or word appears across the provided reviews.

Format your output EXACTLY as a clear bulleted list like this:

🔑 TOP TRENDING KEYWORDS:
- **[Keyword 1]** (Mentions: [Count]): [1 short sentence explaining the context of how this word is used]
- **[Keyword 2]** (Mentions: [Count]): [Context]
(Continue for top 5 keywords)"""),
        ("user", "Reviews:\n- {reviews}")
    ])
    
    keyword_chain = keyword_prompt | llm
    keyword_result = keyword_chain.invoke({"reviews": reviews})
    
    return {
        "keyword_analysis": keyword_result.content
    }

# --- 6. Build the LangGraph ---
workflow = StateGraph(AgentState)
workflow.add_node("retrieve", retrieve_reviews)
workflow.add_node("analyze", extract_keywords)

workflow.set_entry_point("retrieve")
workflow.add_edge("retrieve", "analyze")
workflow.add_edge("analyze", END)

keyword_agent = workflow.compile()

# --- 7. Test the Agent ---
if __name__ == "__main__":
    print("Starting Keyword Extraction Agent Test...\n")
    
    # A broad query to pull in maximum text for keyword scanning
    test_query = "What are the most common words and topics mentioned by users?"
    
    initial_state = {
        "query": test_query,
        "retrieved_reviews": [],
        "keyword_analysis": ""
    }
    
    result = keyword_agent.invoke(initial_state)
    
    print("\n" + "="*50)
    print("🔑 KEYWORD EXTRACTION RESULT:")
    print("="*50)
    print(result["keyword_analysis"])