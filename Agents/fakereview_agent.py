"""Fake Review Detection Agent."""

import os
from typing import Dict
from langchain_groq import ChatGroq
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import ChatPromptTemplate
from dotenv import load_dotenv
load_dotenv()

llm = ChatGroq(
    model_name="qwen/qwen3-32b",
    temperature=0.0,
    api_key=os.getenv("GROQ_API_KEY")
)


def run_fake_review_agent(vector_db: FAISS) -> Dict:
    """Identify suspicious or spam reviews and calculate trust score."""
    docs = vector_db.similarity_search("product review analysis", k=10)
    reviews_text = "\n".join([f"Review {i+1}: {doc.page_content}" for i, doc in enumerate(docs)])
    
    fake_prompt = ChatPromptTemplate.from_messages([
        ("system", """You are an expert in fraud detection and review authenticity analysis. Analyze the provided product reviews.

Your task:
1. Identify reviews that appear suspicious, fake, spam, or bot-generated.
2. Look for patterns like: extreme/generic language, duplicate phrasing, lack of specifics, promotional tone, irrelevant content.
3. Calculate a trust/authenticity score percentage (0-100%).

Format your output EXACTLY like this:

🛡️ AUTHENTICITY ANALYSIS:

Trust Score: [X]%
- [Number] suspicious reviews detected out of [Total] analyzed

SUSPICIOUS REVIEWS:
- Review [N]: [Brief reason why it looks suspicious]

RELIABILITY INDICATORS:
- [Positive indicator 1]
- [Positive indicator 2]

RED FLAGS:
- [Red flag 1]
- [Red flag 2]"""),
        ("user", "Here are the reviews to analyze:\n\n{reviews}")
    ])
    
    chain = fake_prompt | llm
    result = chain.invoke({"reviews": reviews_text})
    
    return {
        "raw_output": result.content,
        "reviews_analyzed": len(docs)
    }
