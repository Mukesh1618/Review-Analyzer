import re

SYSTEM_RESTRICTION = "\n\nCRITICAL: Do not include any internal thought process, <think> tags, or 'thinking' blocks in your output. Provide ONLY the requested information."

def clean_llm_output(text: str) -> str:
    """Removes <think>...</think> blocks but is careful with unclosed tags."""
    if not isinstance(text, str):
        return text
    
    # 1. Remove all closed thinking blocks
    text = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL)
    
    # 2. If there's still a <think> tag (unclosed), just remove the tag itself
    # but keep the content, in case the LLM put the answer inside by mistake
    # or the closing tag was truncated.
    text = text.replace('<think>', '').replace('</think>', '')
    
    return text.strip()
