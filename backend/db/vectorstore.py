import os
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings

FAISS_INDEX_PATH = "faiss_index"
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
global_vector_db = None

def get_db():
    global global_vector_db
    return global_vector_db

def load_vector_db():
    global global_vector_db
    if os.path.exists(FAISS_INDEX_PATH):
        try:
            global_vector_db = FAISS.load_local(FAISS_INDEX_PATH, embeddings, allow_dangerous_deserialization=True)
            print("Loaded FAISS index from disk.")
        except Exception as e:
            print(f"Error loading FAISS index: {e}")
            global_vector_db = None
    return global_vector_db

def save_vector_db(db):
    global global_vector_db
    global_vector_db = db
    db.save_local(FAISS_INDEX_PATH)

def get_product_name():
    name = "Active Product Data"
    if os.path.exists(os.path.join(FAISS_INDEX_PATH, "product_name.txt")):
        with open(os.path.join(FAISS_INDEX_PATH, "product_name.txt"), "r") as f:
            name = f.read().strip()
    return name

def set_product_name(name):
    if not os.path.exists(FAISS_INDEX_PATH):
        os.makedirs(FAISS_INDEX_PATH)
    with open(os.path.join(FAISS_INDEX_PATH, "product_name.txt"), "w") as f:
        f.write(name)
