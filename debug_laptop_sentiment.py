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

def debug_laptop_sentiment(file_path):
    with open(file_path, "r") as f:
        data = json.load(f)
    
    reviews = [json.dumps(r) for r in data["reviews"]]
    sample_reviews = reviews[:30] # Test first 30
    
    reviews_text = ""
    for i, r in enumerate(sample_reviews):
        reviews_text += f"Review_{i}: {r}\n"

    # USING THE EXACT SAME INSTRUCTIONS I JUST ADDED TO THE BACKEND
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are an expert NLP data analyst.
Classify sentiment as 'POSITIVE', 'NEGATIVE', or 'NEUTRAL'.

STRICT CLASSIFICATION RULES:
1. DECISIVE ACTION: Avoid NEUTRAL unless the review is truly indifferent (e.g., "It's fine", "Okay") or irrelevant spam.
2. POSITIVE SIGNALS: "Solid", "Good", "Great", "Amazing", "Satisfied", or "Works well" are POSITIVE.
3. NEGATIVE SIGNALS: "Buggy", "Crashes", "Overpriced", "Disappointed", "Annoying", "Broken", or "Slow" are NEGATIVE.
4. DOMINANT TONE: If a review has both praise and complaints, classify by the dominant tone. 
   - If they praise hardware but say an update "ruined" it, it is NEGATIVE.
   - If they complain about a minor detail but "love the phone overall", it is POSITIVE.
5. TEXT OVERRIDES RATING: Use the "text" as the source of truth.

STRICT OUTPUT FORMAT:
- Review [ID]: [CLASSIFICATION] | [Reasoning]
""" + SYSTEM_RESTRICTION),
        ("user", "Analyze these reviews:\n\n{reviews}")
    ])

    print(f"Analyzing Laptop Reviews from: {file_path}")
    print("="*80)
    out = clean_llm_output((prompt | llm_0).invoke({"reviews": reviews_text}).content)
    print(out)
    print("="*80)

if __name__ == "__main__":
    debug_laptop_sentiment("Sample_Files/laptop_reviews.txt")
