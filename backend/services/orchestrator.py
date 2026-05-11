from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

from backend.models.state import DashboardState, ChatState
from backend.agents.dashboard import (
    ingest_node, run_identity_agent, run_descriptive_agent,
    run_scoring_agent, run_timeline_agent, run_security_agent,
    compile_dashboard
)
from backend.agents.chat import retrieve_chat_context, generate_chat_answer

def get_dashboard_orchestrator():
    workflow = StateGraph(DashboardState)

    # 1. Add Optimized Logical Nodes
    workflow.add_node("ingest", ingest_node)
    workflow.add_node("identity", run_identity_agent)           # Name + Rating
    workflow.add_node("descriptive", run_descriptive_agent)     # Summary + Pros/Cons + Keywords
    workflow.add_node("scoring", run_scoring_agent)             # Sentiment + Metrics + Aspects
    workflow.add_node("timeline", run_timeline_agent)           # Charts
    workflow.add_node("security", run_security_agent)           # Fake Detection
    workflow.add_node("compile", compile_dashboard)

    # 2. Parallel Flow
    workflow.add_edge(START, "ingest")

    workflow.add_edge("ingest", "identity")
    workflow.add_edge("ingest", "descriptive")
    workflow.add_edge("ingest", "scoring")
    workflow.add_edge("ingest", "timeline")
    workflow.add_edge("ingest", "security")

    workflow.add_edge("identity", "compile")
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
