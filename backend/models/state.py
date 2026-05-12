from typing import TypedDict, List, Any, Annotated
import operator

class ChatState(TypedDict):
    messages: Annotated[List[Any], operator.add]
    context: str

class DashboardState(TypedDict):
    query: str
    retrieved_reviews: List[Any]
    total_reviews: int
    product_name: str
    short_summary: str
    detailed_summary: str
    sentiment_analysis: str
    pros: str
    cons: str
    aspect_analysis: str
    keyword_analysis: str
    predicted_rating: str
    timeline_analysis: str
    fake_review_analysis: str
    is_valid: bool
    validation_error: str
    # New fields for structured data from preferred logic
    sentiment_distribution: dict  # {"positive": X, "neutral": Y, "negative": Z}
    sentiment_trend: List[dict]    # [{"date": "...", "score": ...}]
    key_metrics: dict             # {"key_strength": "...", "top_complaint": "...", "emerging_request": "..."}
