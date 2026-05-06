from backend.models.state import ChatState
from backend.utils.helpers import clean_llm_output, SYSTEM_RESTRICTION
from backend.utils.llm import get_llm
from backend.db.vectorstore import get_db, get_product_name
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder

llm = get_llm(0.3)

def retrieve_chat_context(state: ChatState):
    db = get_db()
    if not db:
        return {"context": ""}
    
    product_name = get_product_name()
    latest_query = state["messages"][-1].content
    
    # If the query is vague/short, augment it with the product name for better retrieval
    search_query = latest_query
    if len(latest_query.split()) < 5:
        search_query = f"{product_name} {latest_query}"
        
    docs = db.similarity_search(search_query, k=5)
    context = "\n- ".join([doc.page_content for doc in docs])
    return {"context": context}

def generate_chat_answer(state: ChatState):
    product_name = get_product_name()
    qa_prompt = ChatPromptTemplate.from_messages([
        ("system", f"You are a professional product analyst for '{product_name}'. "
                   f"The user is asking about '{product_name}'. "
                   "Answer based ONLY on the provided review context. "
                   "If the context doesn't have the answer, say so.\n\n"
                   "STRICT FORMATTING RULES:\n"
                   "1. Use professional Markdown formatting.\n"
                   "2. Use **Bold Titles** (e.g., **Feature Name**) for key points.\n"
                   "3. Use standard Markdown bullet points (using '*' or '-') for lists.\n"
                   "4. Ensure each bullet point is on a new line.\n"
                   "5. Use clear section headers if needed.\n"
                   "6. Maintain a structured and executive tone.\n\n"
                   "Context:\n{context}" + SYSTEM_RESTRICTION),
        MessagesPlaceholder(variable_name="messages")
    ])
    response = (qa_prompt | llm).invoke({"context": state["context"], "messages": state["messages"]})
    
    # Optional clean up of thought tags
    response.content = clean_llm_output(response.content)
    
    return {"messages": [response]}
