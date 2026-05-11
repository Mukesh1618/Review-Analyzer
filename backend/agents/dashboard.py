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

    # Retrieve up to 50 reviews for a good balance of accuracy and token limits
    docs = db.similarity_search(state["query"], k=50)
    reviews = [doc.page_content for doc in docs]

    total = db.index.ntotal if hasattr(db, 'index') else len(reviews)
    return {"retrieved_reviews": reviews, "total_reviews": total}

def run_product_name_agent(state: DashboardState):
    if state.get("product_name") and state["product_name"] not in ["", "Unknown Product", "default"]:
        return {"product_name": state["product_name"]}

    reviews = "\n- ".join(state["retrieved_reviews"][:10])
    if not reviews: return {"product_name": "Unknown Product"}
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Extract the specific product name. Return ONLY the product name, no other text."),
        ("user", "Reviews:\n- {reviews}")
    ])
    out = clean_llm_output((prompt | llm_0).invoke({"reviews": reviews}).content)
    if not out or out.strip().lower() == "none":
        out = "Unknown Product"
    set_product_name(out)
    return {"product_name": out}

def run_summary_agent(state: DashboardState):
    reviews = "\n- ".join(state["retrieved_reviews"][:30])
    if not reviews: return {"short_summary": "No data", "detailed_summary": "No data"}

    short_prompt = ChatPromptTemplate.from_messages([
        ("system", "Provide a 3 sentence concise summary. No bolding/symbols."),
        ("user", "Reviews:\n- {reviews}")
    ])
    detailed_prompt = ChatPromptTemplate.from_messages([
        ("system", "Provide a detailed summary under 400 words. Use bullet points. No bolding."),
        ("user", "Reviews:\n- {reviews}")
    ])

    return {
        "short_summary": clean_llm_output((short_prompt | llm_1).invoke({"reviews": reviews}).content),
        "detailed_summary": clean_llm_output((detailed_prompt | llm_1).invoke({"reviews": reviews}).content)
    }

def run_sentiment_agent(state: DashboardState):
    reviews_list = state.get("retrieved_reviews", [])
    if not reviews_list:
        print("❌ Sentiment Agent: No reviews in state!")
        return {"sentiment_analysis": "No reviews found to analyze.", "sentiment_distribution": {"positive": 0, "neutral": 0, "negative": 0}}
    
    # Process reviews in a structured way (cap at 50 for token limits)
    reviews_text = ""
    for i, r in enumerate(reviews_list[:50]):
        reviews_text += f"Review {i+1}: {r}\n"

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a precise data extraction tool. 
Task: Count sentiments.
Example Output: {{"positive": 10, "neutral": 2, "negative": 3, "explanation": "Most users liked the screen but hated the hinge."}}

Return ONLY the JSON object. No other text. No thinking.""" + SYSTEM_RESTRICTION),
        ("user", "Analyze these reviews:\n{reviews}")
    ])
    
    try:
        response = (prompt | llm_0).invoke({"reviews": reviews_text})
        raw_out = clean_llm_output(response.content)
        
        pos, neu, neg = 0, 0, 0
        expl = ""

        # 1. Try JSON parsing
        try:
            json_match = re.search(r"\{.*\}", raw_out, re.DOTALL)
            if json_match:
                json_data = json.loads(json_match.group(0))
                pos = int(json_data.get("positive", 0))
                neu = int(json_data.get("neutral", 0))
                neg = int(json_data.get("negative", 0))
                expl = json_data.get("explanation", "")
        except Exception:
            pass

        # 2. Fallback to robust Regex if JSON parsing failed to get valid counts
        if pos == 0 and neu == 0 and neg == 0:
            p_m = re.search(r"positive.:\s*(\d+)", raw_out, re.I)
            nu_m = re.search(r"neutral.:\s*(\d+)", raw_out, re.I)
            ne_m = re.search(r"negative.:\s*(\d+)", raw_out, re.I)
            pos = int(p_m.group(1)) if p_m else 0
            neu = int(nu_m.group(1)) if nu_m else 0
            neg = int(ne_m.group(1)) if ne_m else 0
            expl = raw_out

        total = (pos + neu + neg) or 1
        score = ((pos + 0.5 * neu) / total) * 10
        
        final_text = f"OVERALL SCORE: {score:.1f}/10\n\nDISTRIBUTION:\n- Positive: {pos}\n- Neutral: {neu}\n- Negative: {neg}\n\nREASONING: {expl}"
        
        print(f"✅ Sentiment Agent: Score {score:.1f} (P:{pos} N:{neu} Neg:{neg})")
        return {
            "sentiment_analysis": final_text,
            "sentiment_distribution": {"positive": pos, "neutral": neu, "negative": neg}
        }
    except Exception as e:
        print(f"❌ Sentiment Agent Error: {e}")
        return {"sentiment_analysis": "Error analyzing sentiment.", "sentiment_distribution": {"positive": 0, "neutral": 0, "negative": 0}}

def run_pros_cons_agent(state: DashboardState):
    reviews = "\n- ".join(state["retrieved_reviews"])
    if not reviews: return {"pros": "", "cons": ""}
    prompt_pros = ChatPromptTemplate.from_messages([("system", "Extract key advantages. Bulleted list. No bolding."), ("user", "{reviews}")])
    prompt_cons = ChatPromptTemplate.from_messages([("system", "Extract key disadvantages. Bulleted list. No bolding."), ("user", "{reviews}")])
    return {
        "pros": clean_llm_output((prompt_pros | llm_1).invoke({"reviews": reviews}).content),
        "cons": clean_llm_output((prompt_cons | llm_1).invoke({"reviews": reviews}).content)
    }

def run_keyword_agent(state: DashboardState):
    reviews = "\n- ".join(state["retrieved_reviews"])
    if not reviews: return {"keyword_analysis": ""}
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Extract top 5 UNIQUE product features. Return ONLY a comma-separated list."),
        ("user", "Reviews:\n- {reviews}")
    ])
    out = clean_llm_output((prompt | llm_0).invoke({"reviews": reviews}).content)
    keywords = [k.strip().replace("*", "").replace("-", "") for k in out.split(",")]
    return {"keyword_analysis": ", ".join(keywords[:5])}
def run_timeline_agent(state: DashboardState):
    reviews = "\n- ".join(state["retrieved_reviews"])
    if not reviews: return {"timeline_analysis": "No data", "sentiment_trend": []}

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
        ("user", "{reviews}")
    ])

    out = clean_llm_output((prompt | llm_0).invoke({"reviews": reviews}).content)

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


def run_metrics_agent(state: DashboardState):
    reviews = "\n- ".join(state["retrieved_reviews"])
    if not reviews: return {"key_metrics": {"key_strength": "N/A", "top_complaint": "N/A", "emerging_request": "N/A", "customer_loyalty": "N/A"}}
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Extract metrics (phrase each): STRENGTH: [X] COMPLAINT: [X] REQUEST: [X] LOYALTY: [X]"),
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
        ("system", "Identify suspicious/spam reviews."),
        ("user", "{reviews}")
    ])
    return {"fake_review_analysis": clean_llm_output((prompt | llm_0).invoke({"reviews": reviews}).content)}

def run_aspect_agent(state: DashboardState):
    reviews = "\n- ".join(state["retrieved_reviews"])
    if not reviews: return {"aspect_analysis": ""}
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Extract aspects and scores (0-10). Format: [Aspect]: [Score]"),
        ("user", "{reviews}")
    ])
    return {"aspect_analysis": clean_llm_output((prompt | llm_0).invoke({"reviews": reviews}).content)}

def run_rating_agent(state: DashboardState):
    reviews = "\n- ".join(state["retrieved_reviews"])
    if not reviews: return {"predicted_rating": "N/A"}
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Predict star rating 1-5."),
        ("user", "{reviews}")
    ])
    return {"predicted_rating": clean_llm_output((prompt | llm_0).invoke({"reviews": reviews}).content)}

def compile_dashboard(state: DashboardState):
    return state
