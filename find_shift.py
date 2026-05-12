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

def find_shift(file_path):
    with open(file_path, "r") as f:
        data = json.load(f)
    
    reviews = [json.dumps(r) for r in data["reviews"]]
    
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a strictly logical NLP data analyst specializing in e-commerce product reviews. 
Your only task is to classify the true sentiment of the provided reviews into exactly one of three categories: 'Positive', 'Negative', or 'Neutral'.

You will receive the user's text and their star rating (1-5). 
CRITICAL DIRECTIVE: The written text is the ultimate source of truth. You must ignore the star rating if it contradicts the text.

=== CATEGORY DEFINITIONS & RUBRIC ===

1. WHAT CLASSIFIES AS POSITIVE:
   - Explicit Praise: The user explicitly praises core features (performance, display, battery, value).
   - Recommendation: The user states they would recommend it, or expresses high satisfaction (e.g., "Best laptop I've owned").
   - Forgiven Flaws: The user mentions a minor flaw but explicitly states the product is still great or worth it (e.g., "Fans are loud, but the performance makes it worth it").
   - Accessory Complaints: The user loves the main device but complains about a secondary item (e.g., "Laptop is amazing, but the charger is too bulky").

2. WHAT CLASSIFIES AS NEGATIVE:
   - Hardware/Software Failure: Mentions of broken parts, critical bugs, crashing, or defects (e.g., "The hinge broke", "Sleep mode drains the battery").
   - Unusable/Dealbreakers: A flaw that ruins the user experience, even if they liked other parts (e.g., "Screen is nice, but it randomly restarts 5 times a day").
   - Regret/Returns: The user states they are returning it, regret buying it, or call it a waste of money.
   - Poor Support: The review focuses on a terrible customer service experience regarding a broken device.

3. WHAT CLASSIFIES AS NEUTRAL:
   - Apathy/Average: The user expresses no strong emotion. Key phrases: "It's fine", "Gets the job done", "Nothing special", "It's okay", "As expected".
   - Perfectly Balanced Mixed: The user lists an equal weight of pros and cons without a clear final verdict (e.g., "The screen is amazing but the battery is terrible. Undecided on this one.").
   - Spam/Irrelevant: Promotional content, bot links, crypto scams, or text that has nothing to do with using the product.
   - Purely Factual: Statements with zero qualitative judgment (e.g., "I bought this on Tuesday. It is silver.")

STRICT OUTPUT FORMAT:
- Review [ID]: [CLASSIFICATION]
""" + SYSTEM_RESTRICTION),
        ("user", "Analyze these reviews:\n\n{reviews}")
    ])

    # Analysis
    batch_text = ""
    for j, r in enumerate(reviews):
        batch_text += f"Review_{j}: {r}\n"
    
    out = clean_llm_output((prompt | llm_0).invoke({"reviews": batch_text}).content)
    
    print(out)

if __name__ == "__main__":
    find_shift("Sample_Files/laptop_reviews.txt")
