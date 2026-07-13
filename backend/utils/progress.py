PROGRESS_STORE = {}

def set_progress(user_id: str, progress: int, message: str, metadata: dict = None):
    if user_id:
        PROGRESS_STORE[user_id] = {
            "progress": min(max(progress, 0), 100),
            "status": message,
            "metadata": metadata or {}
        }

def get_progress(user_id: str):
    if user_id and user_id in PROGRESS_STORE:
        return PROGRESS_STORE[user_id]
    return {"progress": 0, "status": "Idle", "metadata": {}}
