import os
import shutil
import json
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings

FAISS_BASE_PATH = "faiss_index"
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
global_vector_db = None
current_product_id = "default"
current_user_id = "default"

def get_db():
    global global_vector_db
    return global_vector_db

def get_user_path(user_id=None):
    uid = user_id or current_user_id
    return os.path.join(FAISS_BASE_PATH, uid)

def load_vector_db(product_id="default", user_id=None):
    global global_vector_db, current_product_id, current_user_id
    current_product_id = product_id
    if user_id:
        current_user_id = user_id
    
    path = os.path.join(get_user_path(user_id), product_id)
    if os.path.exists(path):
        try:
            global_vector_db = FAISS.load_local(path, embeddings, allow_dangerous_deserialization=True)
            print(f"Loaded FAISS index for {product_id} (User: {current_user_id}) from disk.")
        except Exception as e:
            print(f"Error loading FAISS index: {e}")
            global_vector_db = None
    else:
        global_vector_db = None
    return global_vector_db

def save_vector_db(db, product_name, user_id=None):
    global global_vector_db, current_product_id, current_user_id
    uid = user_id or current_user_id
    
    # Create a safe ID from the product name
    product_id = "".join([c if c.isalnum() else "_" for c in product_name]).strip("_")
    current_product_id = product_id
    current_user_id = uid

    path = os.path.join(get_user_path(uid), product_id)
    if not os.path.exists(path):
        os.makedirs(path)

    global_vector_db = db
    db.save_local(path)

    return product_id

def set_product_name(name, product_id=None):
    # This is a legacy function kept for compatibility with dashboard agents
    pass

def get_product_name(product_id=None, user_id=None):
    pid = product_id or current_product_id
    uid = user_id or current_user_id
    
    # First try to get it from the analysis.json if it exists
    analysis = load_analysis_data(pid, uid)
    if analysis and analysis.get("product_name"):
        return analysis["product_name"]
    
    # Fallback: Clean up the folder name (replace underscores with spaces)
    return pid.replace("_", " ")

def get_all_products(user_id=None):
    uid = user_id or current_user_id
    user_path = get_user_path(uid)
    
    if not os.path.exists(user_path):
        return []

    products = []
    for pid in os.listdir(user_path):
        path = os.path.join(user_path, pid)
        if os.path.isdir(path):
            name = get_product_name(pid, uid)
            products.append({"id": pid, "name": name})
    return products

def save_analysis_data(data, product_id=None, user_id=None):
    """Saves the fully computed dashboard state to a JSON file."""
    pid = product_id or current_product_id
    uid = user_id or current_user_id
    
    path = os.path.join(get_user_path(uid), pid)
    if not os.path.exists(path):
        os.makedirs(path)
    try:
        with open(os.path.join(path, "analysis.json"), "w", encoding='utf-8') as f:
            json.dump(data, f, indent=4)
        return True
    except Exception as e:
        print(f"Failed to save analysis data: {e}")
        return False

def save_data_hash(content_hash, product_id=None, user_id=None):
    """Saves the fingerprint of the raw data to check for changes later."""
    pid = product_id or current_product_id
    uid = user_id or current_user_id
    
    path = os.path.join(get_user_path(uid), pid)
    if not os.path.exists(path):
        os.makedirs(path)
    with open(os.path.join(path, "data_hash.txt"), "w") as f:
        f.write(content_hash)

def get_data_hash(product_id=None, user_id=None):
    """Retrieves the stored fingerprint for a product."""
    pid = product_id or current_product_id
    uid = user_id or current_user_id
    
    path = os.path.join(get_user_path(uid), pid, "data_hash.txt")
    if os.path.exists(path):
        with open(path, "r") as f:
            return f.read().strip()
    return None

def load_analysis_data(product_id=None, user_id=None):
    """Loads the previously computed dashboard state from JSON."""
    pid = product_id or current_product_id
    uid = user_id or current_user_id
    
    path = os.path.join(get_user_path(uid), pid, "analysis.json")
    if os.path.exists(path):
        try:
            with open(path, "r", encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"Failed to load analysis data: {e}")
    return None
