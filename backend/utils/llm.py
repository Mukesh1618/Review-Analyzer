import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

# Monkey-patch langchain root module to have 'verbose' and 'debug' attributes.
# This prevents compatibility issues between custom langchain-core versions and the installed langchain package.
try:
    import langchain
    if not hasattr(langchain, "verbose"):
        langchain.verbose = False
    if not hasattr(langchain, "debug"):
        langchain.debug = False
    if not hasattr(langchain, "llm_cache"):
        langchain.llm_cache = None
except ImportError:
    pass

# Load environment variables from .env file
load_dotenv()

def get_llm(temperature=0.1):
    api_key = os.getenv("GROK_API_KEY")
    base_url = os.getenv("GROK_API_BASE") or os.getenv("GROK_BASE_URL")
    model_name = os.getenv("GROK_MODEL_NAME", "grok-4-1-fast-reasoning")
    
    # Fallback to OpenAI env vars if GROK is not specified
    if not api_key:
        api_key = os.getenv("OPENAI_API_KEY")
        base_url = os.getenv("OPENAI_API_BASE") or os.getenv("OPENAI_BASE_URL")
        model_name = os.getenv("OPENAI_MODEL_NAME", "gpt-4o-mini")
        
    return ChatOpenAI(
        model=model_name,
        temperature=temperature,
        api_key=api_key,
        base_url=base_url,
        max_retries=5
    )

