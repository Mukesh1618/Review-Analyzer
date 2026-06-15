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
    return ChatOpenAI(
        model=os.getenv("OPENAI_MODEL_NAME", "gpt-4o-mini"),
        temperature=temperature,
        max_retries=5
    )
