import os
import io
import pandas as pd
from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from langchain_core.messages import HumanMessage
from langchain_core.documents import Document
from langchain_community.vectorstores import FAISS

from backend.db.vectorstore import load_vector_db, get_db, save_vector_db, get_product_name, embeddings, FAISS_INDEX_PATH
from backend.services.orchestrator import dashboard_orchestrator, chat_orchestrator
from backend.utils.helpers import clean_llm_output

app = FastAPI(title="ReviewMind API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize vector DB on startup
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
    name = get_product_name()
    if os.path.exists(FAISS_INDEX_PATH):
        return [{"id": "current", "name": name}]
    return []

@app.post("/select_product")
async def select_product(product_id: str):
    load_vector_db()
    return {"message": "Product selected."}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    content = await file.read()
    reviews = []
    
    # Try to parse as JSON
    try:
        import json
        data = json.loads(content)
        if isinstance(data, dict) and "reviews" in data:
            reviews = [r["text"] if isinstance(r, dict) and "text" in r else str(r) for r in data["reviews"]]
        elif isinstance(data, list):
            reviews = [r["text"] if isinstance(r, dict) and "text" in r else str(r) for r in data]
    except Exception:
        pass

    # If JSON failed, try to parse as CSV
    if not reviews:
        try:
            df = pd.read_csv(io.BytesIO(content))
            col = next((c for c in df.columns if 'review' in c.lower() or 'text' in c.lower()), df.columns[0])
            reviews = df[col].dropna().astype(str).tolist()
        except Exception:
            pass

    # If both JSON and CSV failed, treat as plain text (one review per line)
    if not reviews:
        try:
            text = content.decode('utf-8', errors='ignore')
            reviews = [line.strip() for line in text.split('\n') if line.strip()]
        except Exception:
            pass

    docs = [Document(page_content=r) for r in reviews[:100]]
    
    if docs:
        db = FAISS.from_documents(docs, embeddings)
        save_vector_db(db)
        return {"message": f"Successfully loaded {len(reviews)} reviews (indexed {len(docs)}) and saved to disk."}
    return {"message": "No reviews found."}

@app.get("/analyze")
async def analyze_dashboard():
    if not get_db():
        return {"error": "No data uploaded yet. Please upload a file first."}
    
    initial_state = {
        "query": "general product feedback",
        "retrieved_reviews": [],
        "total_reviews": 0,
        "product_name": "",
        "short_summary": "",
        "detailed_summary": "",
        "sentiment_analysis": "",
        "pros": "",
        "cons": "",
        "aspect_analysis": "",
        "keyword_analysis": "",
        "predicted_rating": "",
        "timeline_analysis": "",
        "fake_review_analysis": ""
    }
    
    result = dashboard_orchestrator.invoke(initial_state)
    return result

if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8000, reload=True)
