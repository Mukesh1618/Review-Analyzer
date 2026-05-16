from typing import TypedDict, List
from langgraph.graph import StateGraph, START, END
import time

# --- 1. Define the Global Dashboard State ---
# This state holds the final output for your React frontend.
# When all parallel agents finish, this object will be fully populated.
class DashboardState(TypedDict):
    query: str
    retrieved_reviews: List[str]
    
    # Agent Outputs
    short_summary: str
    detailed_summary: str
    sentiment_score: str
    pros_cons: str
    aspects: str
    # Add other agent outputs here (trends, keywords, etc.)

# --- 2. Define the Nodes ---

def ingest_data(state: DashboardState):
    """Simulates loading the file, chunking, and initial retrieval."""
    print("[Ingest Node] -> Loading reviews from FAISS...")
    # In production, this pulls the relevant chunks based on the uploaded file
    reviews = [
        "The battery is amazing but the camera is terrible.",
        "Overpriced, but it runs games perfectly."
    ]
    return {"retrieved_reviews": reviews}

# --- PARALLEL AGENT NODES ---
# In a real app, you would import your functions from your 'agents/' folder.
# For demonstration, these simulate the LLM calls we built earlier.

def run_summary_agent(state: DashboardState):
    print("[Summary Agent] -> Generating summaries (Running in parallel)...")
    time.sleep(1) # Simulating LLM processing time
    # Call your Groq Summary Chain here
    return {
        "short_summary": "Mixed reviews highlighting good battery but poor camera.",
        "detailed_summary": "Detailed breakdown goes here..."
    }

def run_sentiment_agent(state: DashboardState):
    print("[Sentiment Agent] -> Calculating score (Running in parallel)...")
    time.sleep(1.5) # Simulating LLM processing time
    # Call your Groq Sentiment Chain here
    return {"sentiment_score": "6.5/10"}

def run_pros_cons_agent(state: DashboardState):
    print("[Pros/Cons Agent] -> Extracting pros and cons (Running in parallel)...")
    time.sleep(0.5) # Simulating LLM processing time
    # Call your Groq Pros/Cons Chain here
    return {"pros_cons": "✅ Pros: Battery\n❌ Cons: Camera"}

# --- AGGREGATOR NODE ---

def compile_dashboard(state: DashboardState):
    """Waits for all parallel agents to finish, then packages the data."""
    print("[Aggregator Node] -> All parallel tasks complete. Compiling Dashboard JSON...")
    # LangGraph automatically updates the 'state' dictionary with the returns 
    # from the parallel nodes. By the time we get here, the state is complete!
    return state

# --- 3. Build the Parallel LangGraph ---
workflow = StateGraph(DashboardState)

# Add all nodes
workflow.add_node("ingest", ingest_data)
workflow.add_node("summary", run_summary_agent)
workflow.add_node("sentiment", run_sentiment_agent)
workflow.add_node("pros_cons", run_pros_cons_agent)
workflow.add_node("compile", compile_dashboard)

# Define Entry Point
workflow.add_edge(START, "ingest")

# FAN-OUT: One node triggers multiple agents simultaneously
workflow.add_edge("ingest", "summary")
workflow.add_edge("ingest", "sentiment")
workflow.add_edge("ingest", "pros_cons")
# (Add edges for Fake Detection, Trends, Keywords, Rating here)

# FAN-IN: All parallel agents must flow into the final compiler
workflow.add_edge("summary", "compile")
workflow.add_edge("sentiment", "compile")
workflow.add_edge("pros_cons", "compile")

# Define Exit Point
workflow.add_edge("compile", END)

# Compile the graph
orchestrator = workflow.compile()

# --- 4. Test the Parallel Execution ---
if __name__ == "__main__":
    print("Starting Parallel Orchestrator Test...\n")
    
    initial_state = {
        "query": "Analyze the latest product upload.",
        "retrieved_reviews": [],
        "short_summary": "",
        "detailed_summary": "",
        "sentiment_score": "",
        "pros_cons": "",
        "aspects": ""
    }
    
    # Run the graph
    start_time = time.time()
    final_result = orchestrator.invoke(initial_state)
    end_time = time.time()
    
    print("\n" + "="*50)
    print(f"🚀 PARALLEL EXECUTION COMPLETE IN {round(end_time - start_time, 2)} SECONDS")
    print("="*50)
    
    # Notice how the final state contains data from ALL the agents
    print(f"Summary: {final_result['short_summary']}")
    print(f"Sentiment: {final_result['sentiment_score']}")
    print(f"Pros/Cons:\n{final_result['pros_cons']}")