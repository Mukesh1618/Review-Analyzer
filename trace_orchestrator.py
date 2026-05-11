import os
import asyncio
from backend.db.vectorstore import load_vector_db, get_db
from backend.services.orchestrator import dashboard_orchestrator
from backend.models.state import DashboardState

async def trace():
    print("--- 1. Loading DB ---")
    db = load_vector_db("ZenithBook_Pro_14")
    if not db:
        print("Error: No DB loaded")
        return

    print("\n--- 2. Running Orchestrator ---")
    initial_state = {
        "query": "general product feedback",
        "retrieved_reviews": [],
        "total_reviews": 0,
        "product_name": "ZenithBook_Pro_14",
        "short_summary": "",
        "detailed_summary": "",
        "sentiment_analysis": "",
        "pros": "",
        "cons": "",
        "aspect_analysis": "",
        "keyword_analysis": "",
        "predicted_rating": "",
        "timeline_analysis": "",
        "fake_review_analysis": "",
        "sentiment_distribution": {"positive": 0, "neutral": 0, "negative": 0},
        "sentiment_trend": [],
        "key_metrics": {"key_strength": "N/A", "top_complaint": "N/A", "emerging_request": "N/A", "customer_loyalty": "N/A"}
    }
    
    # We use invoke which runs synchronously in this context
    result = dashboard_orchestrator.invoke(initial_state)
    
    print("\n--- 3. Orchestrator Output Keys ---")
    for key, value in result.items():
        if key == "retrieved_reviews":
            print(f"{key}: {len(value)} items")
        else:
            print(f"{key}: {type(value)}")
            
    print("\n--- 4. Specific Checks ---")
    print(f"Sentiment Score snippet: {result.get('sentiment_analysis', '')[:50]}")
    print(f"Metrics keys: {result.get('key_metrics', {}).keys()}")
    print(f"Trend data points: {len(result.get('sentiment_trend', []))}")

if __name__ == "__main__":
    asyncio.run(trace())
