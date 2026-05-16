import json
from langchain_core.documents import Document
from langchain_community.vectorstores import FAISS
from backend.db.vectorstore import embeddings, save_vector_db

def index_reviews(file_path):
    with open(file_path, "r") as f:
        data = json.load(f)
    
    product_name = data.get("device") or data.get("product_name") or "Unknown_Product"
    
    # PRESERVE FULL JSON RECORDS
    raw_reviews = data.get("reviews", [])
    docs = [Document(page_content=json.dumps(r)) for r in raw_reviews]
    
    print(f"Indexing {len(docs)} reviews for {product_name}...")
    db = FAISS.from_documents(docs, embeddings)
    product_id = save_vector_db(db, product_name)
    print(f"Saved to {product_id}")

if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1:
        index_reviews(sys.argv[1])
