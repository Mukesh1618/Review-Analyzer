import os
import shutil
import json
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings

FAISS_BASE_PATH = "faiss_index"
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
global_vector_db = None
current_product_id = "default"

def get_db():
    global global_vector_db
    return global_vector_db

def load_vector_db(product_id="default"):
    global global_vector_db, current_product_id
    current_product_id = product_id
    path = os.path.join(FAISS_BASE_PATH, product_id)
    if os.path.exists(path):
        try:
            global_vector_db = FAISS.load_local(path, embeddings, allow_dangerous_deserialization=True)
            print(f"Loaded FAISS index for {product_id} from disk.")
        except Exception as e:
            print(f"Error loading FAISS index: {e}")
            global_vector_db = None
    else:
        global_vector_db = None
    return global_vector_db

def save_vector_db(db, product_name):
    global global_vector_db, current_product_id
    # Create a safe ID from the product name
    product_id = "".join([c if c.isalnum() else "_" for c in product_name]).strip("_")
    current_product_id = product_id

    path = os.path.join(FAISS_BASE_PATH, product_id)
    if not os.path.exists(path):
        os.makedirs(path)

    global_vector_db = db
    db.save_local(path)

    # Save the actual display name inside the folder
    with open(os.path.join(path, "product_name.txt"), "w") as f:
        f.write(product_name)
    return product_id

def set_product_name(name, product_id=None):
    pid = product_id or current_product_id
    path = os.path.join(FAISS_BASE_PATH, pid)
    if not os.path.exists(path):
        os.makedirs(path)
    with open(os.path.join(path, "product_name.txt"), "w") as f:
        f.write(name)

def get_product_name(product_id=None):
    pid = product_id or current_product_id
    path = os.path.join(FAISS_BASE_PATH, pid, "product_name.txt")
    if os.path.exists(path):
        with open(path, "r") as f:
            return f.read().strip()
    return pid

def get_all_products():
    if not os.path.exists(FAISS_BASE_PATH):
        return []

    products = []
    for pid in os.listdir(FAISS_BASE_PATH):
        path = os.path.join(FAISS_BASE_PATH, pid)
        if os.path.isdir(path):
            name = get_product_name(pid)
            products.append({"id": pid, "name": name})
    return products

def save_analysis_data(data, product_id=None):
    """Saves the fully computed dashboard state to a JSON file."""
    pid = product_id or current_product_id
    path = os.path.join(FAISS_BASE_PATH, pid)
    if not os.path.exists(path):
        os.makedirs(path)
    # We shouldn't serialize the raw retrieved docs to save space if it's large, but let's save the main fields
    try:
        with open(os.path.join(path, "analysis.json"), "w", encoding='utf-8') as f:
            json.dump(data, f, indent=4)
        return True
    except Exception as e:
        print(f"Failed to save analysis data: {e}")
        return False

def load_analysis_data(product_id=None):
    """Loads the previously computed dashboard state from JSON."""
    pid = product_id or current_product_id
    path = os.path.join(FAISS_BASE_PATH, pid, "analysis.json")
    if os.path.exists(path):
        try:
            with open(path, "r", encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Failed to load analysis data: {e}")
    return None
