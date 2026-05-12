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
    """Group B: Summaries, Pros, Cons, Keywords, and Key Metrics"""
    reviews_list = state.get("retrieved_reviews", [])
    if not reviews_list: 
        return {"short_summary": "No data", "detailed_summary": "No data", "pros": "No data", "cons": "No data", "keyword_analysis": "", "key_metrics": {"key_strength": "N/A", "top_complaint": "N/A", "emerging_request": "N/A"}}

    reviews_text = "\n- ".join(reviews_list[:30]) # Good sample for qualitative data

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a professional product analyst.
Read the reviews and provide:
1. SHORT SUMMARY: 3 concise sentences. No bolding.
2. DETAILED SUMMARY: Structured breakdown under 400 words. Bullet points allowed. No bolding.
3. PROS: Simple bulleted list of key advantages. No bolding.
4. CONS: Simple bulleted list of key disadvantages. No bolding.
5. KEYWORDS: Exactly 5 UNIQUE product features. Comma-separated only.
6. STRENGTH: One short phrase describing the biggest strength.
7. COMPLAINT: One short phrase describing the biggest complaint.
8. REQUEST: One short phrase describing the most frequent feature request.

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
[Key1, Key2...]
[[STRENGTH]]
[Phrase]
[[COMPLAINT]]
[Phrase]
[[REQUEST]]
[Phrase]""" + SYSTEM_RESTRICTION),
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
        kw_str = out.split("[[KEYWORDS]]")[1].split("[[STRENGTH]]")[0].strip()
        keywords = [k.strip().replace("*", "").replace("-", "") for k in kw_str.split(",")]
        kw_final = ", ".join(keywords[:5])
    except: kw_final = ""

    try:
        strength = out.split("[[STRENGTH]]")[1].split("[[COMPLAINT]]")[0].strip()
    except: strength = "N/A"

    try:
        complaint = out.split("[[COMPLAINT]]")[1].split("[[REQUEST]]")[0].strip()
    except: complaint = "N/A"

    try:
        request = out.split("[[REQUEST]]")[1].strip()
    except: request = "N/A"

    return {
        "short_summary": short,
        "detailed_summary": detailed,
        "pros": pros,
        "cons": cons,
        "keyword_analysis": kw_final,
        "key_metrics": {
            "key_strength": strength,
            "top_complaint": complaint,
            "emerging_request": request
        }
    }


def run_scoring_agent(state: DashboardState):
    """Group C: Sentiment Distribution and Aspects"""
    reviews_list = state.get("retrieved_reviews", [])
    if not reviews_list: 
        return {"sentiment_analysis": "No data", "sentiment_distribution": {"positive": 0, "neutral": 0, "negative": 0}, "aspect_analysis": "No data"}

    # Use a set to track unique reviews to avoid duplicates in counting
    unique_reviews = list(dict.fromkeys(reviews_list))
    sample_reviews = unique_reviews[:50]
    
    reviews_text = ""
    for i, r in enumerate(sample_reviews):
        # The input is now a JSON string containing text, rating, and date
        reviews_text += f"Review_{i}: {r}\n"

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are an expert NLP data analyst.
Each input is a structured JSON string containing "text", "rating", and "date".
Your task is to parse these fields precisely and classify the true sentiment strictly as 'POSITIVE', 'NEGATIVE', or 'NEUTRAL'.

STRICT CLASSIFICATION RULES:
1. TEXT OVERRIDES RATING: Use the "text" as the ultimate source of truth. If "rating" is 4 or 5 but "text" is a complaint, classify as NEGATIVE.
2. IDENTIFY SPAM AS NEUTRAL: Promotional spam/irrelevant text = NEUTRAL regardless of rating.
3. THE "MIXED" RULE: Balanced praise and complaints = NEUTRAL. Severe complaints = NEGATIVE.
4. THE "AVERAGE" RULE: "It's okay", "Nothing special" = NEUTRAL.
5. ACCESSORY VS CORE: Praise OUR product but hate a minor accessory = POSITIVE. Hate an accessory with NO praise for our product = NEGATIVE.
6. THIRD-PARTY SOLUTIONS: If things are only "all right" because they bought another brand's product, it is NEGATIVE for our product.

STRICT OUTPUT FORMAT:
- Review [ID]: [CLASSIFICATION]

After the list, provide an aspect analysis (Markdown list with scores 1-10) under the header 'ASPECTS:'.
""" + SYSTEM_RESTRICTION),
        ("user", "Analyze these reviews:\n\n{reviews}")
    ])

    out = clean_llm_output((prompt | llm_0).invoke({"reviews": reviews_text}).content)
    
    # Python-based counting
    pos, neu, neg = 0, 0, 0
    # Extract classifications: - Review_0: POSITIVE or - Review 0: POSITIVE
    tally_matches = re.findall(r"Review[_\s]\d+:\s*(POSITIVE|NEGATIVE|NEUTRAL)", out, re.I)
    
    for code in tally_matches:
        code = code.upper()
        if code == 'POSITIVE': pos += 1
        elif code == 'NEGATIVE': neg += 1
        elif code == 'NEUTRAL': neu += 1
    
    total_counted = pos + neu + neg
    total_for_score = total_counted or 1
    score = ((pos + 0.5 * neu) / total_for_score) * 10
    
    aspects = "Aspect analysis unavailable."
    try:
        aspects = out.split("ASPECTS:")[1].strip()
    except:
        pass
    
    final_text = f"OVERALL SCORE: {score:.1f}/10\n\nDISTRIBUTION (Based on {total_counted} analyzed reviews):\n- Positive: {pos}\n- Neutral: {neu}\n- Negative: {neg}"

    return {
        "sentiment_analysis": final_text,
        "sentiment_distribution": {"positive": pos, "neutral": neu, "negative": neg},
        "aspect_analysis": aspects
    }


def run_timeline_agent(state: DashboardState):
    reviews_list = state.get("retrieved_reviews", [])
    if not reviews_list: 
        return {"timeline_analysis": "No data", "sentiment_trend": []}

    unique_reviews = list(dict.fromkeys(reviews_list))
    reviews_text = "\n- ".join(unique_reviews[:100])

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a time-series analyst. 
Each input is a JSON string with "text", "rating", and "date".
Task: Extract the date and calculate the true sentiment score (1-10) based on the text.

STRICT FORMAT:
- [YYYY-MM-DD]: [Score]

CRITICAL: 
1. Use ONLY the "date" from the JSON. 
2. Return ONLY the list of points, one per line.""" + SYSTEM_RESTRICTION),
        ("user", "Reviews:\n{reviews}")
    ])

    out = clean_llm_output((prompt | llm_0).invoke({"reviews": reviews_text}).content)

    trend = []
    matches = re.findall(r"(?:-\s*)?([\d-]{10}):\s*([\d.]+)", out)
    for date_str, score in matches:
        try:
            trend.append({"date": date_str.strip(), "score": float(score)})
        except ValueError:
            continue

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
