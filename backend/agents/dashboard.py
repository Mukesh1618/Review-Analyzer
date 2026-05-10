import re
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

    # Increase k to analyze more reviews (user wants accurate distribution)
    docs = db.similarity_search(state["query"], k=100)
    reviews = [doc.page_content for doc in docs]

    # Get total reviews correctly from FAISS index
    total = db.index.ntotal if hasattr(db, 'index') else len(reviews)
    return {"retrieved_reviews": reviews, "total_reviews": total}

def run_product_name_agent(state: DashboardState):
    # If we already have a name (from upload metadata), use it and don't re-extract
    if state.get("product_name") and state["product_name"] not in ["", "Unknown Product", "default"]:
        return {"product_name": state["product_name"]}

    # Use a small sample for name extraction to save tokens
    reviews = "\n- ".join(state["retrieved_reviews"][:10])
    if not reviews: return {"product_name": "Unknown Product"}
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Extract the specific product name from these reviews. Return ONLY the product name, no other text." + SYSTEM_RESTRICTION),
        ("user", "Reviews:\n- {reviews}")
    ])
    out = clean_llm_output((prompt | llm_0).invoke({"reviews": reviews}).content)
    if not out or out.strip().lower() == "none":
        out = "Unknown Product"
    set_product_name(out)
    return {"product_name": out}

def run_summary_agent(state: DashboardState):
    # Use a larger sample for summary
    reviews = "\n- ".join(state["retrieved_reviews"][:30])
    if not reviews: return {"short_summary": "No data", "detailed_summary": "No data"}

    short_prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a professional product analyst. Provide a 3 sentence concise summary. DO NOT use bolding or special symbols." + SYSTEM_RESTRICTION),
        ("user", "Reviews:\n- {reviews}")
    ])
    detailed_prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a professional product analyst. Provide a detailed, structured summary under 400 words. "
                   "STRICT RULES: Use standard Markdown bullet points (e.g., '- Item') for sub-details. "
                   "DO NOT use bolding (no asterisks). Use plain text for headers." + SYSTEM_RESTRICTION),
        ("user", "Reviews:\n- {reviews}")
    ])

    return {
        "short_summary": clean_llm_output((short_prompt | llm_1).invoke({"reviews": reviews}).content),
        "detailed_summary": clean_llm_output((detailed_prompt | llm_1).invoke({"reviews": reviews}).content)
    }

def run_sentiment_agent(state: DashboardState):
    # Analyze all retrieved reviews for distribution
    reviews = "\n".join(state["retrieved_reviews"])
    if not reviews: return {"sentiment_analysis": "No data", "sentiment_distribution": {"positive": 0, "neutral": 0, "negative": 0}}
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are an expert data analyst.
1. CLASSIFICATION: Classify EVERY SINGLE review provided strictly as 'Positive', 'Negative', or 'Neutral'.
2. DISTRIBUTION: Count the totals for each classification. The sum MUST equal the total number of reviews provided.
3. SCORING: Overall score = (Positive + 0.5 * Neutral) / Total * 10.

Format output EXACTLY as:
DISTRIBUTION:
Positive: [Count]
Neutral: [Count]
Negative: [Count]

OVERALL SCORE: [Score]/10
REASONING: [Math]""" + SYSTEM_RESTRICTION),
        ("user", "{reviews}")
    ])
    out = clean_llm_output((prompt | llm_0).invoke({"reviews": reviews}).content)

    # Extract distribution for charts
    pos = int(re.search(r"Positive:\s*(\d+)", out, re.I).group(1)) if re.search(r"Positive:\s*(\d+)", out, re.I) else 0
    neu = int(re.search(r"Neutral:\s*(\d+)", out, re.I).group(1)) if re.search(r"Neutral:\s*(\d+)", out, re.I) else 0
    neg = int(re.search(r"Negative:\s*(\d+)", out, re.I).group(1)) if re.search(r"Negative:\s*(\d+)", out, re.I) else 0

    # Calculate score in Python for total accuracy
    total = (pos + neu + neg) or 1
    score = ((pos + 0.5 * neu) / total) * 10
    
    # Prepend perfectly formatted score for the frontend handshake
    final_out = f"OVERALL SCORE: {score:.1f}/10\n\n{out}"

    return {
        "sentiment_analysis": final_out,
        "sentiment_distribution": {"positive": pos, "neutral": neu, "negative": neg}
    }

def run_pros_cons_agent(state: DashboardState):
    reviews = "\n- ".join(state["retrieved_reviews"])
    if not reviews: return {"pros": "", "cons": ""}
    prompt_pros = ChatPromptTemplate.from_messages([("system", "Extract only the key advantages (pros). Format as a bulleted list. DO NOT use bolding." + SYSTEM_RESTRICTION), ("user", "{reviews}")])
    prompt_cons = ChatPromptTemplate.from_messages([("system", "Extract only the key disadvantages (cons). Format as a bulleted list. DO NOT use bolding." + SYSTEM_RESTRICTION), ("user", "{reviews}")])
    return {
        "pros": clean_llm_output((prompt_pros | llm_1).invoke({"reviews": reviews}).content),
        "cons": clean_llm_output((prompt_cons | llm_1).invoke({"reviews": reviews}).content)
    }

def run_keyword_agent(state: DashboardState):
    reviews = "\n- ".join(state["retrieved_reviews"])
    if not reviews: return {"keyword_analysis": ""}
    prompt = ChatPromptTemplate.from_messages([
        ("system", """Extract exactly 5 UNIQUE product features or technical specs.
RULES:
- Focus ONLY on features (e.g., 'OLED Display', 'Battery Life', 'Build Quality').
- DO NOT include generic words like 'laptop', 'product', 'fast', 'good'.
- COMBINE related terms (e.g., do not list 'Screen' and 'OLED' separately, use 'OLED Screen').
- Return ONLY the 5 keywords as a comma-separated list.""" + SYSTEM_RESTRICTION),
        ("user", "Reviews:\n- {reviews}")
    ])
    out = clean_llm_output((prompt | llm_0).invoke({"reviews": reviews}).content)
    keywords = [k.strip().replace("*", "").replace("-", "") for k in out.split(",")]
    return {"keyword_analysis": ", ".join(keywords[:5])}

def run_timeline_agent(state: DashboardState):
    reviews = "\n- ".join(state["retrieved_reviews"])
    if not reviews: return {"timeline_analysis": "No data", "sentiment_trend": []}
    prompt = ChatPromptTemplate.from_messages([
        ("system", """Extract a chronological sentiment trend.
Format EXACTLY as:
TREND:
- [Month/Year]: [Score 1-10]
- [Month/Year]: [Score 1-10]""" + SYSTEM_RESTRICTION),
        ("user", "{reviews}")
    ])
    out = clean_llm_output((prompt | llm_0).invoke({"reviews": reviews}).content)

    trend = []
    trend_matches = re.findall(r"- (.*?):\s*(\d+)", out)
    for date, score in trend_matches:
        trend.append({"date": date, "score": int(score)})

    return {"timeline_analysis": out, "sentiment_trend": trend}

def run_metrics_agent(state: DashboardState):
    reviews = "\n- ".join(state["retrieved_reviews"])
    if not reviews: return {"key_metrics": {"key_strength": "N/A", "top_complaint": "N/A", "emerging_request": "N/A", "customer_loyalty": "N/A"}}
    prompt = ChatPromptTemplate.from_messages([
        ("system", """Extract key metrics. One short phrase each.
Format:
STRENGTH: [Value]
COMPLAINT: [Value]
REQUEST: [Value]
LOYALTY: [Value]""" + SYSTEM_RESTRICTION),
        ("user", "{reviews}")
    ])
    out = clean_llm_output((prompt | llm_0).invoke({"reviews": reviews}).content)

    metrics = {
        "key_strength": re.search(r"STRENGTH:\s*(.*)", out, re.I).group(1) if re.search(r"STRENGTH:\s*(.*)", out, re.I) else "N/A",
        "top_complaint": re.search(r"COMPLAINT:\s*(.*)", out, re.I).group(1) if re.search(r"COMPLAINT:\s*(.*)", out, re.I) else "N/A",
        "emerging_request": re.search(r"REQUEST:\s*(.*)", out, re.I).group(1) if re.search(r"REQUEST:\s*(.*)", out, re.I) else "N/A",
        "customer_loyalty": re.search(r"LOYALTY:\s*(.*)", out, re.I).group(1) if re.search(r"LOYALTY:\s*(.*)", out, re.I) else "N/A"
    }
    return {"key_metrics": metrics}

def run_fake_review_agent(state: DashboardState):
    reviews = "\n- ".join(state["retrieved_reviews"])
    if not reviews: return {"fake_review_analysis": "No data"}
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Identify suspicious/spam reviews." + SYSTEM_RESTRICTION),
        ("user", "{reviews}")
    ])
    return {"fake_review_analysis": clean_llm_output((prompt | llm_0).invoke({"reviews": reviews}).content)}

def run_aspect_agent(state: DashboardState):
    reviews = "\n- ".join(state["retrieved_reviews"])
    if not reviews: return {"aspect_analysis": ""}
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Extract product aspects and scores out of 10. Format: **[Aspect]**: [Score]/10" + SYSTEM_RESTRICTION),
        ("user", "{reviews}")
    ])
    return {"aspect_analysis": clean_llm_output((prompt | llm_0).invoke({"reviews": reviews}).content)}

def run_rating_agent(state: DashboardState):
    reviews = "\n- ".join(state["retrieved_reviews"])
    if not reviews: return {"predicted_rating": "N/A"}
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Predict star rating 1-5." + SYSTEM_RESTRICTION),
        ("user", "{reviews}")
    ])
    return {"predicted_rating": clean_llm_output((prompt | llm_0).invoke({"reviews": reviews}).content)}

def compile_dashboard(state: DashboardState):
    return state
