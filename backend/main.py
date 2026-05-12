import os
import io
import pandas as pd
import hashlib
import json
from fastapi import FastAPI, UploadFile, File, Query, Header, HTTPException
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

async def process_content(content: bytes, user_id: str):
    # 0. CALCULATE UNIQUE FINGERPRINT (HASH)
    content_hash = hashlib.sha256(content).hexdigest()
    
    text = content.decode('utf-8', errors='ignore').strip()
    
    # --- HEURISTIC KILL SWITCH ---
    # If the file starts with HTML tags or common code patterns, reject it early.
    sample_for_type = text[:1000].lower()
    if "<!doctype html" in sample_for_type or "<html" in sample_for_type or "<head" in sample_for_type:
         return {"error": "Invalid file type: HTML detected. Please upload a plain text, CSV, or JSON file containing product reviews."}
    if "import {" in sample_for_type or "from '" in sample_for_type or "export default" in sample_for_type:
         return {"error": "Invalid file type: Source code detected. Please upload a file containing product reviews."}
    # -----------------------------

    reviews = []
    detected_name = None
    
    # 1. CONTENT-BASED DETECTION
    if text.startswith('{') or text.startswith('['):
        try:
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
        # Optimization: Filter out very short lines, HTML tags, or lines that look like code
        raw_lines = text.split('\n')
        for line in raw_lines:
            clean_line = line.strip()
            # Skip empty, very short (under 10 chars), or obvious HTML/code
            if len(clean_line) > 10 and not clean_line.startswith('<') and not clean_line.endswith('>') and not clean_line.startswith('{'):
                reviews.append(clean_line)

    if not reviews:
        # If we filtered everything out, it might really be a code file
        return {"error": "No valid review text found. The file may be empty or contain non-review content (like code)."}

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
    existing_hash = get_data_hash(product_id, user_id)
    
    if existing_hash == content_hash:
        # Re-load the database to ensure it's the current one
        load_vector_db(product_id, user_id)
        return {"message": f"Same data detected for '{product_name}'. Analysis preserved.", "product_id": product_id}

    # Create and save a new specific index for this product
    docs = [Document(page_content=r) for r in reviews]
    db = FAISS.from_documents(docs, embeddings)
    product_id = save_vector_db(db, product_name, user_id)
    
    # Save the new fingerprint
    save_data_hash(content_hash, product_id, user_id)
    
    # FORCE FRESH ANALYSIS (since hash didn't match)
    user_path = os.path.join(FAISS_BASE_PATH, user_id, product_id)
    analysis_path = os.path.join(user_path, "analysis.json")
    if os.path.exists(analysis_path):
        os.remove(analysis_path)

    return {"message": f"Successfully loaded {len(docs)} reviews for '{product_name}'. Generating fresh analysis.", "product_id": product_id}

@app.post("/chat")
async def chat_endpoint(req: ChatRequest, x_user_id: str = Header(None)):
    if not x_user_id:
        return {"error": "Authentication required."}
    
    if not get_db():
        return {"error": "No product selected or uploaded."}
    
    config = {"configurable": {"thread_id": req.thread_id}}
    input_state = {"messages": [HumanMessage(content=req.message)]}
    result = chat_orchestrator.invoke(input_state, config=config)
    reply = result["messages"][-1].content
    return {"reply": clean_llm_output(reply)}

@app.get("/products")
async def get_products(x_user_id: str = Header(None)):
    if not x_user_id:
        return []
    return get_all_products(user_id=x_user_id)

@app.post("/select_product")
async def select_product(product_id: str = Query(...), x_user_id: str = Header(None)):
    if not x_user_id:
        return {"error": "Authentication required."}
    
    db = load_vector_db(product_id, user_id=x_user_id)
    if db:
        return {"message": f"Product {product_id} selected."}
    return {"error": "Product not found."}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...), x_user_id: str = Header(None)):
    if not x_user_id:
        return {"error": "Authentication required."}
    content = await file.read()
    result = await process_content(content, x_user_id)
    return result

@app.post("/upload_sample")
async def upload_sample(sample_name: str = Query(...), x_user_id: str = Header(None)):
    if not x_user_id:
        return {"error": "Authentication required."}
    # Look for files in Sample_Files directory
    sample_path = os.path.join("Sample_Files", sample_name)
    if not os.path.exists(sample_path):
        return {"error": f"Sample file {sample_name} not found."}
    
    with open(sample_path, "rb") as f:
        content = f.read()
    
    result = await process_content(content, x_user_id)
    return result

@app.get("/analyze")
async def analyze_dashboard(x_user_id: str = Header(None)):
    if not x_user_id:
        return {"error": "Authentication required."}
    
    if not get_db():
        return {"error": "No data uploaded yet. Please upload a file first."}
    
    # Check if analysis already exists
    saved_data = load_analysis_data(user_id=x_user_id)
    if saved_data:
        return saved_data
        
    initial_state = {
        "query": "general product feedback",
        "retrieved_reviews": [],
        "total_reviews": 0,
        "product_name": get_product_name(user_id=x_user_id),
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
        "is_valid": True,
        "validation_error": "",
        "sentiment_distribution": {"positive": 0, "neutral": 0, "negative": 0},
        "sentiment_trend": [],
        "key_metrics": {"key_strength": "N/A", "top_complaint": "N/A", "emerging_request": "N/A"}
    }
    
    result = dashboard_orchestrator.invoke(initial_state)

    # Check for validation failure
    if result.get("is_valid") is False:
        error_msg = result.get("validation_error", "The uploaded file does not contain valid product reviews.")
        raise HTTPException(status_code=400, detail=error_msg)
    
    # Save results to the user's specific folder
    save_analysis_data(result, user_id=x_user_id)
    
    return result

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
