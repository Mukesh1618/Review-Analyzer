import json
import os
import sys
from dotenv import load_dotenv

# Add current directory to path
sys.path.append(os.getcwd())

load_dotenv()

from backend.agents.dashboard import run_scoring_agent

def debug_sentiment(file_path):
    with open(file_path, "r") as f:
        data = json.load(f)
    
    reviews = [json.dumps(r) for r in data["reviews"]]
    
    # We want to see the classifications
    # Since the agent returns a summary, let's wrap it to see what's happening
    state = {
        "retrieved_reviews": reviews,
        "query": "sentiment analysis"
    }
    
    print("Running scoring agent on sample...")
    result = run_scoring_agent(state)
    
    print("\n--- RESULTS ---")
    print(result["sentiment_analysis"])
    print("\n--- ASPECT ANALYSIS ---")
    print(result["aspect_analysis"])

if __name__ == "__main__":
    if len(sys.argv) > 1:
        debug_sentiment(sys.argv[1])
    else:
        debug_sentiment("Sample_Files/smartphone_reviews.txt")
