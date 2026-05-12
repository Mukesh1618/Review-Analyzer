import asyncio
from backend.models.state import DashboardState
from backend.agents.dashboard import run_scoring_agent
from backend.db.vectorstore import load_vector_db

async def run():
    db = load_vector_db('ZenithBook_Pro_14')
    docs = db.similarity_search('performance', k=50)
    state = DashboardState(retrieved_reviews=[d.page_content for d in docs])
    res = run_scoring_agent(state)
    print("\n--- NEW NLP EXPERT TALLY ---")
    print(res['sentiment_analysis'])

if __name__ == "__main__":
    asyncio.run(run())
