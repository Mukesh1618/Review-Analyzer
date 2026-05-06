import re

SYSTEM_RESTRICTION = "\n\nCRITICAL: Do not include any internal thought process, <think> tags, or 'thinking' blocks in your output. Provide ONLY the requested information."

def clean_llm_output(text: str) -> str:
    """Removes <think>...</think> blocks and any unclosed <think> tags."""
    if not isinstance(text, str):
        return text
    text = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL)
    text = re.sub(r'<think>.*', '', text, flags=re.DOTALL)
    return text.strip()
