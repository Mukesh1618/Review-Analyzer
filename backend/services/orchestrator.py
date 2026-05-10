from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver

from backend.models.state import DashboardState, ChatState
from backend.agents.dashboard import (
    ingest_node, run_product_name_agent, run_summary_agent,
    run_sentiment_agent, run_pros_cons_agent, run_keyword_agent,
    run_aspect_agent, run_rating_agent, run_timeline_agent,
    run_fake_review_agent, run_metrics_agent, compile_dashboard
)
from backend.agents.chat import retrieve_chat_context, generate_chat_answer

def get_dashboard_orchestrator():
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
    workflow.add_node("metrics", run_metrics_agent)
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
    workflow.add_edge("ingest", "metrics")

    workflow.add_edge("product_name", "compile")
    workflow.add_edge("summary", "compile")
    workflow.add_edge("sentiment", "compile")
    workflow.add_edge("pros_cons", "compile")
    workflow.add_edge("keyword", "compile")
    workflow.add_edge("aspect", "compile")
    workflow.add_edge("rating", "compile")
    workflow.add_edge("timeline", "compile")
    workflow.add_edge("fake", "compile")
    workflow.add_edge("metrics", "compile")
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
