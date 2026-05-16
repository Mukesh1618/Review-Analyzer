import os
import operator
from typing import TypedDict, Annotated, Sequence
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_core.documents import Document
from langchain_core.messages import BaseMessage, HumanMessage
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langgraph.graph import StateGraph, START, END
from langgraph.checkpoint.memory import MemorySaver 

# --- 1. Environment Setup ---
load_dotenv()
api_key = os.getenv("GROQ_API_KEY")
if api_key:
    os.environ["GROQ_API_KEY"] = api_key
else:
    print("⚠️ Warning: GROQ_API_KEY not found in .env file.")

# --- 2. Initialize Models ---
llm = ChatGroq(model_name="qwen/qwen3-32b", temperature=0.3) 
embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")

# --- 3. Mock FAISS Database Setup ---
sample_reviews = [
    Document(page_content="The battery life is incredible, lasts two full days. But the camera is terrible in low light.", metadata={"rating": 3}),
    Document(page_content="Amazing performance, super fast charging. Highly recommend it for gaming.", metadata={"rating": 5}),
    Document(page_content="Overpriced for what it offers. The screen is nice, but it gets too hot when watching videos.", metadata={"rating": 2}),
    Document(page_content="Decent phone, battery is okay, camera is okay. Nothing special.", metadata={"rating": 3})
]
vector_db = FAISS.from_documents(sample_reviews, embeddings)

# --- 4. Define LangGraph State ---
class AgentState(TypedDict):
    messages: Annotated[Sequence[BaseMessage], operator.add]
    context: str

# --- 5. Define Graph Nodes ---
def retrieve_context(state: AgentState):
    """Retrieves context from FAISS based on the user's latest message."""
    latest_message = state["messages"][-1].content
    docs = vector_db.similarity_search(latest_message, k=3) 
    context = "\n- ".join([doc.page_content for doc in docs])
    return {"context": context}

def generate_answer(state: AgentState):
    """Generates an answer using the retrieved context AND the conversation history."""
    context = state["context"]
    
    qa_prompt = ChatPromptTemplate.from_messages([
        ("system", """You are a helpful product assistant. Answer the user's questions based ONLY on the provided review context.
        
        If the context does not contain the answer, politely state that you do not have enough information based on the current reviews. 
        Maintain a friendly, conversational tone.
        
        Review Context:
        - {context}"""),
        MessagesPlaceholder(variable_name="messages")
    ])
    
    qa_chain = qa_prompt | llm
    response = qa_chain.invoke({"context": context, "messages": state["messages"]})
    return {"messages": [response]}

# --- 6. Build the LangGraph ---
workflow = StateGraph(AgentState)
workflow.add_node("retrieve", retrieve_context)
workflow.add_node("answer", generate_answer)

workflow.add_edge(START, "retrieve")
workflow.add_edge("retrieve", "answer")
workflow.add_edge("answer", END)

memory = MemorySaver()
qa_agent = workflow.compile(checkpointer=memory)

# --- 7. Interactive Chat Loop ---
if __name__ == "__main__":
    print("="*50)
    print("🤖 STARTING Q&A AGENT (Type 'end' to quit)")
    print("="*50)
    
    # Define the session thread to maintain memory
    config = {"configurable": {"thread_id": "interactive_session_1"}}
    
    while True:
        # 1. Get input from the user
        user_input = input("\n👤 USER: ")
        
        # 2. Check for the exit command
        if user_input.strip().lower() == "end":
            print("\n👋 Ending chat. Goodbye!")
            break
            
        # Optional: Skip empty inputs
        if not user_input.strip():
            continue
            
        # 3. Format the input for LangGraph
        current_state = {"messages": [HumanMessage(content=user_input)]}
        
        # 4. Run the graph
        result = qa_agent.invoke(current_state, config=config)
        
        # 5. Extract and print the AI's response
        ai_response = result["messages"][-1].content
        print(f"🤖 AI: {ai_response}")