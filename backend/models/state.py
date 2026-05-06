from typing import TypedDict, List, Any, Annotated
import operator

class ChatState(TypedDict):
    messages: Annotated[List[Any], operator.add]
    context: str

class DashboardState(TypedDict):
    query: str
    retrieved_reviews: List[str]
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
