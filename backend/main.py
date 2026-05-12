import os
import io
import pandas as pd
from fastapi import FastAPI, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from langchain_core.messages import HumanMessage
from langchain_core.documents import Document
from langchain_community.vectorstores import FAISS
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from backend.db.vectorstore import load_vector_db, get_db, save_vector_db, get_product_name, get_all_products, embeddings, FAISS_BASE_PATH, save_analysis_data, load_analysis_data
from backend.services.orchestrator import dashboard_orchestrator, chat_orchestrator
from backend.utils.helpers import clean_llm_output
from backend.agents.dashboard import run_identity_agent

app = FastAPI(title="ReviewMind API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize vector DB (loads default or empty)
load_vector_db()

class ChatRequest(BaseModel):
    message: str
    thread_id: str

@app.post("/chat")
async def chat_endpoint(req: ChatRequest):
    if not get_db():
        return {"error": "No product selected or uploaded."}
    
    config = {"configurable": {"thread_id": req.thread_id}}
    input_state = {"messages": [HumanMessage(content=req.message)]}
    result = chat_orchestrator.invoke(input_state, config=config)
    reply = result["messages"][-1].content
    return {"reply": clean_llm_output(reply)}

@app.get("/products")
async def get_products():
    return get_all_products()

@app.post("/select_product")
async def select_product(product_id: str = Query(...)):
    db = load_vector_db(product_id)
    if db:
        return {"message": f"Product {product_id} selected."}
    return {"error": "Product not found."}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    content = await file.read()
    
    # 0. CALCULATE UNIQUE FINGERPRINT (HASH)
    import hashlib
    content_hash = hashlib.sha256(content).hexdigest()
    
    text = content.decode('utf-8', errors='ignore').strip()
    reviews = []
    detected_name = None
    
    # 1. CONTENT-BASED DETECTION
    if text.startswith('{') or text.startswith('['):
        try:
            import json
            data = json.loads(text)
            if isinstance(data, dict):
                # Look for product name in metadata
                detected_name = data.get("device") or data.get("product_name") or data.get("product")
            
            if isinstance(data, dict) and "reviews" in data:
                reviews = [json.dumps(r) if isinstance(r, dict) else str(r) for r in data["reviews"]]
            elif isinstance(data, list):
                reviews = [json.dumps(r) if isinstance(r, dict) else str(r) for r in data]
        except Exception:
            pass

    if not reviews:
        # Fallback to CSV detection
        try:
            if ',' in text or ';' in text:
                df = pd.read_csv(io.StringIO(text))
                col = next((c for c in df.columns if 'review' in c.lower() or 'text' in c.lower() or 'content' in c.lower()), df.columns[0])
                reviews = df[col].dropna().astype(str).tolist()
        except Exception:
            pass

    if not reviews:
        # Final fallback: Plain Text
        reviews = [line.strip() for line in text.split('\n') if line.strip()]

    if not reviews:
        return {"message": "No reviews found in the provided content."}

    # Identify the product name (fallback to agent if not in metadata)
    if not detected_name:
        temp_docs = [Document(page_content=r) for r in reviews[:10]]
        product_result = run_identity_agent({"retrieved_reviews": [d.page_content for d in temp_docs], "product_name": "Unknown Product"})
        product_name = product_result.get("product_name", "Unknown_Product")
    else:
        product_name = detected_name

    # Create a safe ID from the product name to check existing hash
    product_id = "".join([c if c.isalnum() else "_" for c in product_name]).strip("_")
    
    # SMART CHECK: Has the data actually changed?
    from backend.db.vectorstore import get_data_hash, save_data_hash
    existing_hash = get_data_hash(product_id)
    
    if existing_hash == content_hash:
        # Re-load the database to ensure it's the current one
        load_vector_db(product_id)
        return {"message": f"Same data detected for '{product_name}'. Analysis preserved."}

    # Create and save a new specific index for this product
    docs = [Document(page_content=r) for r in reviews]
    db = FAISS.from_documents(docs, embeddings)
    product_id = save_vector_db(db, product_name)
    
    # Save the new fingerprint
    save_data_hash(content_hash, product_id)
    
    # FORCE FRESH ANALYSIS (since hash didn't match)
    analysis_path = os.path.join(FAISS_BASE_PATH, product_id, "analysis.json")
    if os.path.exists(analysis_path):
        os.remove(analysis_path)

    return {"message": f"Successfully loaded {len(docs)} reviews for '{product_name}'. Generating fresh analysis."}

@app.get("/analyze")
async def analyze_dashboard():
    if not get_db():
        return {"error": "No data uploaded yet. Please upload a file first."}
    
    # Check if analysis already exists
    saved_data = load_analysis_data()
    if saved_data:
        return saved_data
        
    initial_state = {
        "query": "general product feedback",
        "retrieved_reviews": [],
        "total_reviews": 0,
        "product_name": get_product_name(),
        "short_summary": "",
        "detailed_summary": "",
        "sentiment_analysis": "",
        "pros": "",
        "cons": "",
        "aspect_analysis": "",
        "keyword_analysis": "",
        "predicted_rating": "",
        "timeline_analysis": "",
        "fake_review_analysis": "",
        "sentiment_distribution": {"positive": 0, "neutral": 0, "negative": 0},
        "sentiment_trend": [],
        "key_metrics": {"key_strength": "N/A", "top_complaint": "N/A", "emerging_request": "N/A"}
    }
    
    result = dashboard_orchestrator.invoke(initial_state)
    
    # Ensure raw documents are not saved to JSON to save space, but UI needs them for samples
    # We will just leave them in the result for now, but save the rest
    save_analysis_data(result)
    
    return result

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
