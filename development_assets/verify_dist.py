import json
import os
import sys
import re
from dotenv import load_dotenv

# Add current directory to path
sys.path.append(os.getcwd())

load_dotenv()

from backend.agents.dashboard import run_scoring_agent

def verify_distribution(file_path):
    print(f"Verifying distribution for: {file_path}")
    with open(file_path, "r") as f:
        data = json.load(f)
    
    # Analyze all reviews in the file
    reviews = [json.dumps(r) for r in data["reviews"]]
    
    state = {
        "retrieved_reviews": reviews,
        "query": "sentiment analysis"
    }
    
    result = run_scoring_agent(state)
    
    print("\n--- AGGREGATED RESULTS ---")
    print(result["sentiment_analysis"])
    print("\n--- ASPECT ANALYSIS (CURRENT) ---")
    print(result["aspect_analysis"])

if __name__ == "__main__":
    if len(sys.argv) > 1:
        verify_distribution(sys.argv[1])
    else:
        verify_distribution("Sample_Files/laptop_reviews.txt")
