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
# Temperature is 0.0 to ensure strict extraction of dates and ratings without hallucination.
llm = ChatGroq(model_name="qwen/qwen3-32b", temperature=0.0) 

embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

# --- 3. Mock FAISS Database Setup ---
sample_reviews = [
    Document(page_content="[2023-01-15] The battery life is incredible, lasts two full days. Phone is super fast.", metadata={"rating": 5, "date": "2023-01-15"}),
    Document(page_content="[2023-03-10] Still love the battery, but the recent software update made the camera app crash sometimes.", metadata={"rating": 4, "date": "2023-03-10"}),
    Document(page_content="[2023-05-22] Battery is good. However, since the update, the phone gets really hot and lags during games.", metadata={"rating": 3, "date": "2023-05-22"}),
    Document(page_content="[2023-07-05] Used to be my favorite phone. Now it freezes constantly. They ruined it with the updates.", metadata={"rating": 2, "date": "2023-07-05"}),
    Document(page_content="[2023-09-12] Absolutely terrible performance now. It broke my heart because the battery is still great, but it's unusable.", metadata={"rating": 1, "date": "2023-09-12"})
]
vector_db = FAISS.from_documents(sample_reviews, embeddings)

# --- 4. Define LangGraph State ---
class AgentState(TypedDict):
    query: str
    retrieved_reviews: List[str]
    timeline_analysis: str

# --- 5. Define Graph Nodes ---
def retrieve_reviews(state: AgentState):
    print("-> Retrieving reviews from FAISS...")
    query = state["query"]
    docs = vector_db.similarity_search(query, k=5) 
    reviews_text = [doc.page_content for doc in docs]
    return {"retrieved_reviews": reviews_text}

def analyze_timeline(state: AgentState):
    """Extracts chronological rating patterns."""
    print("-> Mapping Timeline and Rating Patterns...")
    reviews = "\n- ".join(state["retrieved_reviews"])
    
    # UPDATED PROMPT: Strict instructions to create a timeline and identify the turning point
    timeline_prompt = ChatPromptTemplate.from_messages([
        ("system", """You are an expert product data analyst. Analyze the provided product reviews to track how the product's rating has changed over time.

1. TIMELINE EXTRACTION: Extract the date, the implied or stated rating, and a brief summary of the user's sentiment for that date.
2. PATTERN RECOGNITION: Identify exactly when the reviews transitioned from positive to negative, and state the primary reason for this shift.

Format your output EXACTLY like this:

📅 RATING TIMELINE:
- [Date]: [Rating]/5 Stars - [1-sentence summary of feedback]
(List all dates in chronological order)

⚠️ PATTERN ANALYSIS:
- **Peak Positivity**: [Date/Period when reviews were best]
- **The Turning Point**: [The specific date or event where ratings started dropping]
- **Core Issue**: [The main reason for the negative trend]"""),
        ("user", "Reviews:\n- {reviews}")
    ])
    
    timeline_chain = timeline_prompt | llm
    timeline_result = timeline_chain.invoke({"reviews": reviews})
    
    return {
        "timeline_analysis": timeline_result.content
    }

# --- 6. Build the LangGraph ---
workflow = StateGraph(AgentState)
workflow.add_node("retrieve", retrieve_reviews)
workflow.add_node("analyze", analyze_timeline)

workflow.set_entry_point("retrieve")
workflow.add_edge("retrieve", "analyze")
workflow.add_edge("analyze", END)

timeline_agent = workflow.compile()

# --- 7. Test the Agent ---
if __name__ == "__main__":
    print("Starting Timeline Analysis Agent Test...\n")
    
    test_query = "Show me the timeline of product ratings and when the reviews turned negative."
    
    initial_state = {
        "query": test_query,
        "retrieved_reviews": [],
        "timeline_analysis": ""
    }
    
    result = timeline_agent.invoke(initial_state)
    
    print("\n" + "="*50)
    print("📅 TIMELINE ANALYSIS RESULT:")
    print("="*50)
    print(result["timeline_analysis"])