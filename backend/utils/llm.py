import os
from dotenv import load_dotenv
from langchain_openai import ChatOpenAI, AzureChatOpenAI

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
    api_key = os.getenv("GROK_API_KEY") or os.getenv("OPENAI_API_KEY")
    base_url = os.getenv("GROK_API_BASE") or os.getenv("GROK_BASE_URL") or os.getenv("OPENAI_API_BASE")
    model_name = os.getenv("GROK_MODEL_NAME") or os.getenv("OPENAI_MODEL_NAME") or "gpt-5.6-luna"
    api_version = os.getenv("AZURE_OPENAI_API_VERSION", "2024-05-01-preview")

    # Certain Azure models (like gpt-5.6-luna / reasoning models) only accept temperature=1.0
    # Override temperature to 1.0 for these models to prevent HTTP 400 Unsupported Value errors
    if os.getenv("FORCE_DEFAULT_TEMPERATURE", "true").lower() == "true":
        effective_temp = 1.0
    else:
        effective_temp = temperature

    if base_url and "openai.azure.com" in base_url:
        endpoint = base_url.split("/openai/")[0].rstrip("/")
        return AzureChatOpenAI(
            azure_endpoint=endpoint,
            azure_deployment=model_name,
            api_version=api_version,
            api_key=api_key,
            temperature=effective_temp,
            max_retries=5
        )

    return ChatOpenAI(
        model=model_name,
        temperature=effective_temp,
        api_key=api_key,
        base_url=base_url if base_url else None,
        max_retries=5
    )
