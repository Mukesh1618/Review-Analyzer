from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

from backend.models.state import DashboardState, ChatState
from backend.agents.dashboard import (
    ingest_node, validate_node, run_identity_agent, run_descriptive_agent,
    run_scoring_agent, run_timeline_agent, run_security_agent,
    compile_dashboard
)
from backend.agents.chat import retrieve_chat_context, generate_chat_answer

def check_validity(state: DashboardState):
    if state.get("is_valid") is False:
        return "invalid"
    return "valid"

def get_dashboard_orchestrator():
    workflow = StateGraph(DashboardState)

    # 1. Add Optimized Logical Nodes
    workflow.add_node("ingest", ingest_node)
    workflow.add_node("validate", validate_node)
    workflow.add_node("identity", run_identity_agent)           # Name + Rating
    workflow.add_node("descriptive", run_descriptive_agent)     # Summary + Pros/Cons + Keywords
    workflow.add_node("scoring", run_scoring_agent)             # Sentiment + Metrics + Aspects
    workflow.add_node("timeline", run_timeline_agent)           # Charts
    workflow.add_node("security", run_security_agent)           # Fake Detection
    workflow.add_node("compile", compile_dashboard)

    # 2. Sequential Flow with Validation Gate
    workflow.add_edge(START, "ingest")
    workflow.add_edge("ingest", "validate")
    
    # Conditional route after validation
    workflow.add_conditional_edges(
        "validate",
        check_validity,
        {
            "valid": "identity",
            "invalid": "compile" # Skip all agents if invalid
        }
    )

    # Parallel Flow (only if valid)
    workflow.add_edge("identity", "descriptive") # Making it slightly more sequential to avoid race conditions if any, but identity is fast
    
    # Actually, keep the parallel structure but starting from identity
    workflow.add_edge("identity", "scoring")
    workflow.add_edge("identity", "timeline")
    workflow.add_edge("identity", "security")

    workflow.add_edge("descriptive", "compile")
    workflow.add_edge("scoring", "compile")
    workflow.add_edge("timeline", "compile")
    workflow.add_edge("security", "compile")

    workflow.add_edge("compile", END)

    return workflow.compile()

def get_chat_orchestrator():
    chat_workflow = StateGraph(ChatState)
    chat_workflow.add_node("retrieve", retrieve_chat_context)
    chat_workflow.add_node("answer", generate_chat_answer)

    chat_workflow.add_edge(START, "retrieve")
    chat_workflow.add_edge("retrieve", "answer")
    chat_workflow.add_edge("answer", END)

    memory = MemorySaver()
    return chat_workflow.compile(checkpointer=memory)

dashboard_orchestrator = get_dashboard_orchestrator()
chat_orchestrator = get_chat_orchestrator()
