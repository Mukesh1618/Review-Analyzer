import re
import json
from backend.models.state import DashboardState
from backend.utils.helpers import SYSTEM_RESTRICTION, clean_llm_output
from backend.utils.llm import get_llm
from backend.db.vectorstore import get_db, set_product_name
from langchain_core.prompts import ChatPromptTemplate

llm_0 = get_llm(0.0)
llm_1 = get_llm(0.1)

def validate_node(state: DashboardState):
    """Guardrail: Verify if the uploaded content actually contains product reviews."""
    reviews_list = state.get("retrieved_reviews", [])
    print(f"DEBUG: Validating {len(reviews_list)} reviews.")
    
    if not reviews_list:
        return {"is_valid": False, "validation_error": "No data found to validate."}

    # Take a representative sample
    total = len(reviews_list)
    if total <= 15:
        sample = reviews_list
    else:
        sample = reviews_list[:5] + reviews_list[total//2 - 2 : total//2 + 3] + reviews_list[-5:]
    
    sample_text = "\n---\n".join([str(r)[:500] for r in sample])
    print(f"DEBUG: Sample text for validation: {sample_text[:200]}...")

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a strict content filter. Your ONLY job is to determine if the provided text consists of product reviews or customer feedback.

A valid review MUST contain qualitative opinions about a product's performance, quality, or features. 

INVALID content includes:
- HTML/CSS/JavaScript code or web page source.
- Server logs or system data.
- Documentation or instructional text.
- Random marketing copy or landing page text that isn't a USER review.

Respond EXACTLY in this JSON format:
{{
  "is_valid": true/false,
  "reason": "Brief explanation if invalid (e.g., 'Source code', 'Landing page content', 'Gibberish')"
}}""" + SYSTEM_RESTRICTION),
        ("user", "Analyze this sample content:\n\n{sample}")
    ])

    try:
        response = (prompt | llm_0).invoke({"sample": sample_text})
        content = clean_llm_output(response.content)
        print(f"DEBUG: Validation LLM response: {content}")
        
        # Handle potential markdown blocks in response
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
        
        result = json.loads(content)
        is_valid = result.get("is_valid", False)
        print(f"DEBUG: Final decision - is_valid: {is_valid}")
        
        return {
            "is_valid": is_valid,
            "validation_error": result.get("reason", "Unknown content type") if not is_valid else ""
        }
    except Exception as e:
        print(f"Validation Error: {e}")
        return {"is_valid": True}


def ingest_node(state: DashboardState):
    db = get_db()
    if not db:
        return {"retrieved_reviews": [], "total_reviews": 0}

    # Retrieve ALL reviews for comprehensive analysis
    # ntotal gives the total number of documents in the FAISS index
    total = db.index.ntotal if hasattr(db, 'index') else 0
    
    # We use a large k to get everything, or fetch by ID if possible. 
    # For FAISS, similarity_search with k=total is effective.
    docs = db.similarity_search(state["query"], k=max(total, 1))
    reviews = [doc.page_content for doc in docs]

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
    """Group B: Summaries, Pros, Cons, Keywords, and Key Metrics using a wider sample"""
    reviews_list = state.get("retrieved_reviews", [])
    if not reviews_list: 
        return {"short_summary": "No data", "detailed_summary": "No data", "pros": "No data", "cons": "No data", "keyword_analysis": "", "key_metrics": {"key_strength": "N/A", "top_complaint": "N/A", "emerging_request": "N/A"}}

    # Pick a representative sample (beginning, middle, and end)
    total = len(reviews_list)
    if total <= 30:
        sample = reviews_list
    else:
        # Take 10 from start, 10 from middle, 10 from end
        sample = reviews_list[:10] + reviews_list[total//2 - 5 : total//2 + 5] + reviews_list[-10:]
        
    reviews_text = "\n- ".join(sample)

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
    """Group C: Sentiment Distribution and Aspects with 100% Review Batching"""
    reviews_list = state.get("retrieved_reviews", [])
    if not reviews_list: 
        return {"sentiment_analysis": "No data", "sentiment_distribution": {"positive": 0, "neutral": 0, "negative": 0}, "aspect_analysis": "No data"}

    unique_reviews = list(dict.fromkeys(reviews_list))
    
    # Batch processing logic
    batch_size = 50
    pos, neu, neg = 0, 0, 0
    all_aspect_summaries = []

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

    # Process in batches
    for i in range(0, len(unique_reviews), batch_size):
        batch = unique_reviews[i : i + batch_size]
        batch_text = ""
        for j, r in enumerate(batch):
            batch_text += f"Review_{j}: {r}\n"

        try:
            out = clean_llm_output((prompt | llm_0).invoke({"reviews": batch_text}).content)
            
            # Count sentiments in this batch
            lines = out.split('\n')
            for line in lines:
                if "POSITIVE" in line.upper(): pos += 1
                elif "NEGATIVE" in line.upper(): neg += 1
                elif "Review" in line and ":" in line: 
                    # If it has a review ID but isn't Pos/Neg, it's Neutral (handles SPAM, etc.)
                    neu += 1
        except Exception as e:
            print(f"Error processing batch {i//batch_size}: {e}")

    total_counted = pos + neu + neg
    total_for_score = total_counted or 1
    score = ((pos + 0.5 * neu) / total_for_score) * 10
    
    # NEW TASK: Aspect-Based Analysis (Independent of classification batching)
    aspect_prompt = ChatPromptTemplate.from_messages([
        ("system", """You are an expert product analyst.
Identify the main aspects of the product (e.g., Performance, Display Quality, Battery, Price, Build Quality) 
and determine the sentiment score for each aspect on a scale of 1-10 (where 10 is perfect).

STRICT OUTPUT FORMAT:
**[Aspect Name]**: [Score]/10
...""" + SYSTEM_RESTRICTION),
        ("user", "Extract aspects and scores from these reviews:\n\n{reviews}")
    ])
    
    aspect_sample = unique_reviews[:100]
    aspect_out = clean_llm_output((aspect_prompt | llm_0).invoke({"reviews": "\n- ".join(aspect_sample)}).content)
    
    final_text = f"OVERALL SCORE: {score:.1f}/10\n\nDISTRIBUTION (Based on {total_counted} analyzed reviews):\n- Positive: {pos}\n- Neutral: {neu}\n- Negative: {neg}"

    return {
        "sentiment_analysis": final_text,
        "sentiment_distribution": {"positive": pos, "neutral": neu, "negative": neg},
        "aspect_analysis": aspect_out
    }


def run_timeline_agent(state: DashboardState):
    """Group D: Timeline Trend with 100% Review Batching"""
    reviews_list = state.get("retrieved_reviews", [])
    if not reviews_list: 
        return {"timeline_analysis": "No data", "sentiment_trend": []}

    unique_reviews = list(dict.fromkeys(reviews_list))
    
    batch_size = 100
    trend = []
    all_output = []

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a time-series analyst. 
Extract the date and calculate the true sentiment score (1-10) based on the text.
STRICT FORMAT:
- [YYYY-MM-DD]: [Score]
Return ONLY the list of points.""" + SYSTEM_RESTRICTION),
        ("user", "Reviews:\n{reviews}")
    ])

    # Process in batches to cover the whole timeline
    for i in range(0, len(unique_reviews), batch_size):
        # We can skip some batches if there are thousands to save time, 
        # but for accuracy, we process a sampled selection across the file
        batch = unique_reviews[i : i + batch_size]
        reviews_text = "\n- ".join(batch)

        try:
            out = clean_llm_output((prompt | llm_0).invoke({"reviews": reviews_text}).content)
            all_output.append(out)
            
            matches = re.findall(r"(?:-\s*)?([\d-]{10}):\s*([\d.]+)", out)
            for date_str, score in matches:
                try:
                    trend.append({"date": date_str.strip(), "score": float(score)})
                except ValueError:
                    continue
        except Exception as e:
            print(f"Error in timeline batch {i//batch_size}: {e}")

    # Sort by date for the graph
    trend.sort(key=lambda x: x["date"])
    
    return {
        "timeline_analysis": "\n".join(all_output[:2]), # Store a snippet for debug
        "sentiment_trend": trend
    }


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
