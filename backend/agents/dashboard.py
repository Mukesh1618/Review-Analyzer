import re
import json
from backend.models.state import DashboardState
from backend.utils.helpers import SYSTEM_RESTRICTION, clean_llm_output
from backend.utils.llm import get_llm
from backend.db.vectorstore import get_db, set_product_name
from langchain_core.prompts import ChatPromptTemplate

llm_0 = get_llm(0.0)
llm_1 = get_llm(0.1)

def ingest_node(state: DashboardState):
    db = get_db()
    if not db:
        return {"retrieved_reviews": [], "total_reviews": 0}

    # Retrieve up to 100 reviews to ensure comprehensive analysis
    docs = db.similarity_search(state["query"], k=100)
    reviews = [doc.page_content for doc in docs]

    total = db.index.ntotal if hasattr(db, 'index') else len(reviews)
    return {"retrieved_reviews": reviews, "total_reviews": total}


def run_identity_agent(state: DashboardState):
    """Group A: Product Identity and Final Rating"""
    reviews_list = state.get("retrieved_reviews", [])
    if not reviews_list: 
        return {"product_name": "Unknown Product", "predicted_rating": "N/A"}

    reviews_text = "\n- ".join(reviews_list[:20]) # Small sample is enough for identity
    existing_name = state.get("product_name")
    name_instruction = f"The product name is already known as '{existing_name}'. Use it." if existing_name and existing_name not in ["", "Unknown Product", "default"] else "Extract the specific product name from the reviews."

    prompt = ChatPromptTemplate.from_messages([
        ("system", f"""You are a product researcher.
1. NAME: {name_instruction}
2. RATING: Predict a 1-5 star rating based on the overall sentiment.

Format EXACTLY as:
NAME: [Value]
RATING: [X]/5 Stars
REASONING: [Reason]""" + SYSTEM_RESTRICTION),
        ("user", "Reviews:\n{reviews}")
    ])
    
    out = clean_llm_output((prompt | llm_0).invoke({"reviews": reviews_text}).content)
    
    name_match = re.search(r"NAME:\s*(.*)", out)
    name = name_match.group(1).strip() if name_match else (existing_name or "Unknown Product")
    if not name or name.lower() == "none": name = "Unknown Product"
    
    rating_match = re.search(r"RATING:\s*(.*)", out)
    rating = f"⭐ PREDICTED RATING: {rating_match.group(1).strip()}" if rating_match else "N/A"

    if not existing_name or existing_name in ["", "Unknown Product", "default"]:
        set_product_name(name)

    return {
        "product_name": name,
        "predicted_rating": rating
    }


def run_descriptive_agent(state: DashboardState):
    """Group B: Summaries, Pros, Cons, and Keywords"""
    reviews_list = state.get("retrieved_reviews", [])
    if not reviews_list: 
        return {"short_summary": "No data", "detailed_summary": "No data", "pros": "No data", "cons": "No data", "keyword_analysis": ""}

    reviews_text = "\n- ".join(reviews_list[:30]) # Good sample for qualitative data

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a professional product analyst.
Read the reviews and provide:
1. SHORT SUMMARY: 3 concise sentences. No bolding.
2. DETAILED SUMMARY: Structured breakdown under 400 words. Bullet points allowed. No bolding.
3. PROS: Simple bulleted list of key advantages. No bolding.
4. CONS: Simple bulleted list of key disadvantages. No bolding.
5. KEYWORDS: Exactly 5 UNIQUE product features (e.g., 'OLED Display', 'Battery Life'). Do not use generic words like 'laptop'. Comma-separated only.

Format EXACTLY using these markers:
[[SHORT]]
[Text]
[[DETAILED]]
[Text]
[[PROS]]
- [Item]
[[CONS]]
- [Item]
[[KEYWORDS]]
[Key1, Key2, Key3...]""" + SYSTEM_RESTRICTION),
        ("user", "Reviews:\n{reviews}")
    ])

    out = clean_llm_output((prompt | llm_1).invoke({"reviews": reviews_text}).content)

    # Robust parsing using markers
    try:
        short = out.split("[[SHORT]]")[1].split("[[DETAILED]]")[0].strip()
    except: short = "Analysis failed."
    
    try:
        detailed = out.split("[[DETAILED]]")[1].split("[[PROS]]")[0].strip()
    except: detailed = "Analysis failed."
    
    try:
        pros = out.split("[[PROS]]")[1].split("[[CONS]]")[0].strip()
    except: pros = "Analysis failed."
    
    try:
        cons = out.split("[[CONS]]")[1].split("[[KEYWORDS]]")[0].strip()
    except: cons = "Analysis failed."
    
    try:
        kw_str = out.split("[[KEYWORDS]]")[1].strip()
        keywords = [k.strip().replace("*", "").replace("-", "") for k in kw_str.split(",")]
        kw_final = ", ".join(keywords[:5])
    except: kw_final = ""

    return {
        "short_summary": short,
        "detailed_summary": detailed,
        "pros": pros,
        "cons": cons,
        "keyword_analysis": kw_final
    }


def run_scoring_agent(state: DashboardState):
    """Group C: Sentiment Distribution, Key Metrics, and Aspects"""
    reviews_list = state.get("retrieved_reviews", [])
    if not reviews_list: 
        return {"sentiment_analysis": "No data", "sentiment_distribution": {"positive": 0, "neutral": 0, "negative": 0}, "key_metrics": {}, "aspect_analysis": "No data"}

    reviews_text = "\n".join(reviews_list[:50]) # Use a larger set for accurate counting

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a quantitative data analyst.
Analyze EVERY SINGLE review provided. DO NOT guess the counts. Tally them mentally line by line.
Return ONLY a valid JSON object. Do not include any formatting blocks like ```json.
{{
  "positive_count": [Exact integer tally],
  "neutral_count": [Exact integer tally],
  "negative_count": [Exact integer tally],
  "explanation": "[1 sentence explaining the math or main sentiment drivers]",
  "strength": "[Brief phrase]",
  "complaint": "[Brief phrase]",
  "request": "[Brief phrase]",
  "loyalty": "[Brief phrase]",
  "aspects": "[Markdown list. e.g., \\n- **Battery**: 8/10\\n- **Screen**: 9/10]"
}}""" + SYSTEM_RESTRICTION),
        ("user", "Reviews:\n{reviews}")
    ])

    out = clean_llm_output((prompt | llm_0).invoke({"reviews": reviews_text}).content)
    
    # Defaults
    pos, neu, neg = 0, 0, 0
    expl = "Sentiment analysis failed."
    metrics = {"key_strength": "N/A", "top_complaint": "N/A", "emerging_request": "N/A", "customer_loyalty": "N/A"}
    aspects = "Aspect analysis unavailable."

    # Try JSON parsing
    try:
        # Strip potential markdown blocks just in case
        json_str = out.replace("```json", "").replace("```", "").strip()
        json_match = re.search(r"\{.*\}", json_str, re.DOTALL)
        if json_match:
            data = json.loads(json_match.group(0))
            pos = int(data.get("positive_count", 0))
            neu = int(data.get("neutral_count", 0))
            neg = int(data.get("negative_count", 0))
            expl = str(data.get("explanation", expl))
            metrics["key_strength"] = str(data.get("strength", "N/A"))
            metrics["top_complaint"] = str(data.get("complaint", "N/A"))
            metrics["emerging_request"] = str(data.get("request", "N/A"))
            metrics["customer_loyalty"] = str(data.get("loyalty", "N/A"))
            aspects = str(data.get("aspects", aspects))
    except Exception as e:
        print(f"❌ Scoring Agent JSON Parsing Error: {e}")
        # Regex fallback for counts if JSON fails completely
        p_m = re.search(r'"positive_count":\s*(\d+)', out, re.I)
        nu_m = re.search(r'"neutral_count":\s*(\d+)', out, re.I)
        ne_m = re.search(r'"negative_count":\s*(\d+)', out, re.I)
        if p_m: pos = int(p_m.group(1))
        if nu_m: neu = int(nu_m.group(1))
        if ne_m: neg = int(ne_m.group(1))

    # Strict Python calculation to guarantee score accuracy
    total = (pos + neu + neg) or 1
    score = ((pos + 0.5 * neu) / total) * 10
    
    final_text = f"OVERALL SCORE: {score:.1f}/10\n\nDISTRIBUTION:\n- Positive: {pos}\n- Neutral: {neu}\n- Negative: {neg}\n\nREASONING: {expl}"

    return {
        "sentiment_analysis": final_text,
        "sentiment_distribution": {"positive": pos, "neutral": neu, "negative": neg},
        "key_metrics": metrics,
        "aspect_analysis": aspects
    }


def run_timeline_agent(state: DashboardState):
    reviews_list = state.get("retrieved_reviews", [])
    if not reviews_list: 
        return {"timeline_analysis": "No data", "sentiment_trend": []}

    reviews_text = "\n- ".join(reviews_list[:100]) # Need full set for timeline

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a time-series analyst. 
Task: Extract the sentiment trend from the reviews. 
Requirement: For each unique date mentioned in the reviews, calculate a single average sentiment score (1-10).

STRICT FORMAT:
- [YYYY-MM-DD]: [Score]
- [YYYY-MM-DD]: [Score]

CRITICAL: 
1. Use ONLY the date in the format YYYY-MM-DD. 
2. Do NOT include descriptions like 'hinge issues' or 'peak positivity'. 
3. Return ONLY the list of points, one per line.""" + SYSTEM_RESTRICTION),
        ("user", "Reviews:\n{reviews}")
    ])

    out = clean_llm_output((prompt | llm_0).invoke({"reviews": reviews_text}).content)

    trend = []
    # Regex to catch YYYY-MM-DD or Month Day, Year formats (bullet optional)
    matches = re.findall(r"(?:-\s*)?([\d-]{10}|[\w\s,]+):\s*([\d.]+)", out)
    for date_str, score in matches:
        try:
            trend.append({"date": date_str.strip(), "score": float(score)})
        except ValueError:
            continue

    # Sort chronologically by date string
    trend.sort(key=lambda x: x["date"])

    return {"timeline_analysis": out, "sentiment_trend": trend}


def run_security_agent(state: DashboardState):
    reviews_list = state.get("retrieved_reviews", [])
    if not reviews_list: 
        return {"fake_review_analysis": "No data"}
    
    reviews_text = "\n- ".join(reviews_list[:30])

    prompt = ChatPromptTemplate.from_messages([
        ("system", "Identify suspicious/spam reviews. Output EXACTLY as:\n🛡️ AUTHENTICITY ANALYSIS:\n\nTrust Score: [X]%\n- [Num] suspicious reviews detected\n\nSUSPICIOUS REVIEWS:\n- [Review]: [Reason]\n\nRELIABILITY INDICATORS:\n- [Indicator]\n\nRED FLAGS:\n- [Flag]" + SYSTEM_RESTRICTION),
        ("user", "Reviews:\n{reviews}")
    ])
    
    return {"fake_review_analysis": clean_llm_output((prompt | llm_0).invoke({"reviews": reviews_text}).content)}


def compile_dashboard(state: DashboardState):
    return state
