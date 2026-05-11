import os
import time
from typing import Any, List, Optional
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.messages import BaseMessage
from langchain_core.outputs import ChatResult
import groq

# Load environment variables from .env file
load_dotenv()

class RetryingChatGroq(ChatGroq):
    """Custom ChatGroq wrapper with exponential backoff for rate limits."""
    
    max_retries: int = 5
    initial_delay: float = 2.0
    
    def _generate(
        self,
        messages: List[BaseMessage],
        stop: Optional[List[str]] = None,
        run_manager: Any = None,
        **kwargs: Any,
    ) -> ChatResult:
        retries = 0
        delay = self.initial_delay
        
        while retries <= self.max_retries:
            try:
                return super()._generate(messages, stop=stop, run_manager=run_manager, **kwargs)
            except Exception as e:
                # Check if it's a rate limit error (429)
                if isinstance(e, groq.RateLimitError) or "429" in str(e):
                    retries += 1
                    if retries > self.max_retries:
                        print(f"❌ Max retries reached for Groq. Error: {e}")
                        raise e
                    
                    # Log the retry attempt
                    print(f"⚠️ Rate limit hit. Retrying in {delay}s (Attempt {retries}/{self.max_retries})...")
                    time.sleep(delay)
                    delay *= 2  # Exponential backoff
                else:
                    # If it's another error, raise it immediately
                    raise e

def get_llm(temperature=0.1):
    return RetryingChatGroq(
        model_name="llama-3.3-70b-versatile", 
        temperature=temperature,
        max_retries=5
    )
