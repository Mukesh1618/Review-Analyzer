import json
import os
import sys
import re
from dotenv import load_dotenv
from langchain_core.prompts import ChatPromptTemplate

# Add current directory to path
sys.path.append(os.getcwd())

load_dotenv()

from backend.utils.llm import get_llm
from backend.utils.helpers import SYSTEM_RESTRICTION, clean_llm_output

llm_0 = get_llm(0.0)

def debug_full_sentiment(file_path):
    with open(file_path, "r") as f:
        data = json.load(f)
    
    reviews = [json.dumps(r) for r in data["reviews"]]
    sample_reviews = reviews[:30] # Just look at first 30
    
    reviews_text = ""
    for i, r in enumerate(sample_reviews):
        reviews_text += f"Review_{i}: {r}\n"

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are an expert NLP data analyst.
Classify sentiment as 'POSITIVE', 'NEGATIVE', or 'NEUTRAL'.
STRICT CLASSIFICATION RULES:
1. TEXT OVERRIDES RATING.
2. IDENTIFY SPAM AS NEUTRAL.
3. MIXED/AVERAGE = NEUTRAL.

STRICT OUTPUT FORMAT:
- Review [ID]: [CLASSIFICATION] [One sentence WHY]
""" + SYSTEM_RESTRICTION),
        ("user", "Analyze these reviews:\n\n{reviews}")
    ])

    print("Requesting detailed classifications from LLM...")
    out = clean_llm_output((prompt | llm_0).invoke({"reviews": reviews_text}).content)
    print("\n--- DETAILED CLASSIFICATIONS ---")
    print(out)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        debug_full_sentiment(sys.argv[1])
    else:
        debug_full_sentiment("Sample_Files/smartphone_reviews.txt")
