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
    
    docs = db.similarity_search(state["query"], k=10)
    reviews = [doc.page_content for doc in docs]
    total = db.index.ntotal if hasattr(db, 'index') else len(reviews)
    return {"retrieved_reviews": reviews, "total_reviews": total}

def run_product_name_agent(state: DashboardState):
    reviews = "\n- ".join(state["retrieved_reviews"])
    if not reviews: return {"product_name": "Unknown Product"}
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Extract the specific product name from these reviews. Return ONLY the product name, no other text." + SYSTEM_RESTRICTION),
        ("user", "Reviews:\n- {reviews}")
    ])
    out = clean_llm_output((prompt | llm_0).invoke({"reviews": reviews}).content)
    set_product_name(out)
    return {"product_name": out}

def run_summary_agent(state: DashboardState):
    reviews = "\n- ".join(state["retrieved_reviews"])
    if not reviews: return {"short_summary": "No data", "detailed_summary": "No data"}
    
    short_prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a professional product analyst. Provide a 3 sentence concise summary using **Bold Titles** for key takeaways." + SYSTEM_RESTRICTION),
        ("user", "Reviews:\n- {reviews}")
    ])
    detailed_prompt = ChatPromptTemplate.from_messages([
        ("system", "You are a professional product analyst. Provide a detailed, structured summary under 400 words. "
                   "STRICT RULES: Use **Bold Section Titles**, use standard Markdown bullet points (e.g., '- Item') for sub-details, "
                   "ensure each bullet is on its own line, and use professional Markdown formatting." + SYSTEM_RESTRICTION),
        ("user", "Reviews:\n- {reviews}")
    ])
    
    return {
        "short_summary": clean_llm_output((short_prompt | llm_1).invoke({"reviews": reviews}).content),
        "detailed_summary": clean_llm_output((detailed_prompt | llm_1).invoke({"reviews": reviews}).content)
    }

def run_sentiment_agent(state: DashboardState):
    reviews = "\n".join(state["retrieved_reviews"])
    if not reviews: return {"sentiment_analysis": "No data"}
    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are an expert data analyst. Read the provided product reviews and perform two tasks:
1. CLASSIFICATION: Classify every single review strictly as 'Positive', 'Negative', or 'Neutral'. 
2. SCORING: Calculate an overall sentiment score out of 10. Disregard 'Neutral'.
Format your output exactly like this:
CLASSIFICATIONS:
- [Review 1]: [Classification]
OVERALL SCORE: [Score]/10
REASONING: [Math based on Positive/Negative counts]""" + SYSTEM_RESTRICTION),
        ("user", "{reviews}")
    ])
    return {"sentiment_analysis": clean_llm_output((prompt | llm_0).invoke({"reviews": reviews}).content)}

def run_pros_cons_agent(state: DashboardState):
    reviews = "\n- ".join(state["retrieved_reviews"])
    if not reviews: return {"pros": "", "cons": ""}
    prompt_pros = ChatPromptTemplate.from_messages([("system", "Extract only the key advantages (pros). Format as a bulleted list." + SYSTEM_RESTRICTION), ("user", "{reviews}")])
    prompt_cons = ChatPromptTemplate.from_messages([("system", "Extract only the key disadvantages (cons). Format as a bulleted list." + SYSTEM_RESTRICTION), ("user", "{reviews}")])
    return {
        "pros": clean_llm_output((prompt_pros | llm_1).invoke({"reviews": reviews}).content),
        "cons": clean_llm_output((prompt_cons | llm_1).invoke({"reviews": reviews}).content)
    }

def run_keyword_agent(state: DashboardState):
    reviews = "\n- ".join(state["retrieved_reviews"])
    if not reviews: return {"keyword_analysis": ""}
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Extract the top 5 most frequently mentioned meaningful keywords or short phrases. Format EXACTLY as:\n🔑 TOP TRENDING KEYWORDS:\n- **[Keyword]** (Mentions: [Count]): [Context]" + SYSTEM_RESTRICTION),
        ("user", "Reviews:\n- {reviews}")
    ])
    return {"keyword_analysis": clean_llm_output((prompt | llm_0).invoke({"reviews": reviews}).content)}

def run_aspect_agent(state: DashboardState):
    reviews = "\n- ".join(state["retrieved_reviews"])
    if not reviews: return {"aspect_analysis": ""}
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Identify product features/aspects. For each, calculate a sentiment score (Positive / (Positive + Negative) * 10). Format EXACTLY as:\nASPECTS:\n- **[Aspect Name]**: [Score]/10\n  - Reasoning: [Math]\n  - Feedback Summary: [Sentence]" + SYSTEM_RESTRICTION),
        ("user", "{reviews}")
    ])
    return {"aspect_analysis": clean_llm_output((prompt | llm_0).invoke({"reviews": reviews}).content)}

def run_rating_agent(state: DashboardState):
    reviews = "\n- ".join(state["retrieved_reviews"])
    if not reviews: return {"predicted_rating": "N/A"}
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Predict the overall 1-5 star rating based on sentiment. Output EXACTLY as:\n⭐ PREDICTED RATING: [X]/5 Stars\n📝 REASONING: [Explanation]" + SYSTEM_RESTRICTION),
        ("user", "{reviews}")
    ])
    return {"predicted_rating": clean_llm_output((prompt | llm_0).invoke({"reviews": reviews}).content)}

def run_timeline_agent(state: DashboardState):
    reviews = "\n- ".join(state["retrieved_reviews"])
    if not reviews: return {"timeline_analysis": "No data"}
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Extract a chronological rating timeline and identify turning points. Output EXACTLY as:\n📅 RATING TIMELINE:\n- [Date]: [Rating]/5 Stars - [Summary]\n\n⚠️ PATTERN ANALYSIS:\n- **Peak Positivity**: [Period]\n- **The Turning Point**: [Date]\n- **Core Issue**: [Reason]" + SYSTEM_RESTRICTION),
        ("user", "{reviews}")
    ])
    return {"timeline_analysis": clean_llm_output((prompt | llm_0).invoke({"reviews": reviews}).content)}

def run_fake_review_agent(state: DashboardState):
    reviews = "\n- ".join(state["retrieved_reviews"])
    if not reviews: return {"fake_review_analysis": "No data"}
    prompt = ChatPromptTemplate.from_messages([
        ("system", "Identify suspicious/spam reviews. Output EXACTLY as:\n🛡️ AUTHENTICITY ANALYSIS:\n\nTrust Score: [X]%\n- [Num] suspicious reviews detected\n\nSUSPICIOUS REVIEWS:\n- [Review]: [Reason]\n\nRELIABILITY INDICATORS:\n- [Indicator]\n\nRED FLAGS:\n- [Flag]" + SYSTEM_RESTRICTION),
        ("user", "{reviews}")
    ])
    return {"fake_review_analysis": clean_llm_output((prompt | llm_0).invoke({"reviews": reviews}).content)}

def compile_dashboard(state: DashboardState):
    return state
