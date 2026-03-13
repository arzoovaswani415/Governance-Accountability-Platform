import logging
import uuid
import os
import shutil
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.models import Promise, Policy, BudgetAllocation, TimelineEvent, Sector
from app.models.chat import ChatSession, ChatMessage, UploadedDocument, DocumentChunk
from app.schemas.chat import (
    ChatMessageOut, ChatSessionCreate, ChatSessionOut, 
    SendMessagePayload, AiChatResponse, UploadedDocumentOut
)
from app.schemas import AIQuestion, AIResponse
from processing.document_processor import process_and_store_document
from app.api.similarity import _encode

# Set up dedicated assistant logging
os.makedirs("logs", exist_ok=True)
logging.basicConfig(filename="logs/assistant.log", level=logging.INFO, 
                    format="%(asctime)s - %(message)s")

router = APIRouter()

# --- Legacy AI Logic (Preserved entirely) ---

def _build_context(question: str, sector: str | None, election_cycle: str | None, db: Session) -> tuple[str, list[dict]]:
    evidence = []
    context_parts = []

    # Find relevant promises
    promise_query = db.query(Promise).join(Promise.sector)
    if sector:
        promise_query = promise_query.filter(Sector.name == sector)

    promises = promise_query.limit(10).all()
    for p in promises:
        context_parts.append(f"Promise ({p.sector.name}, {p.status}): {p.text}")
        evidence.append({
            "type": "promise",
            "id": p.id,
            "text": p.text[:100],
            "status": p.status,
            "sector": p.sector.name,
        })

    # Find relevant policies
    policy_query = db.query(Policy).join(Policy.sector)
    if sector:
        policy_query = policy_query.filter(Sector.name == sector)

    policies = policy_query.limit(10).all()
    for pol in policies:
        state_info = f" - {pol.state_name}" if pol.state_name else ""
        context_parts.append(
            f"Policy ({pol.sector.name}, {pol.status}, {pol.year_introduced}, Level: {pol.policy_level}{state_info}): {pol.name} - {pol.description or ''}"
        )
        evidence.append({
            "type": "policy",
            "id": pol.id,
            "name": pol.name,
            "status": pol.status,
            "year": pol.year_introduced,
            "level": pol.policy_level,
            "state_name": pol.state_name
        })

    # Find relevant budget data
    budget_query = db.query(BudgetAllocation).join(BudgetAllocation.sector)
    if sector:
        budget_query = budget_query.filter(Sector.name == sector)

    budgets = budget_query.order_by(BudgetAllocation.year).limit(20).all()
    for b in budgets:
        context_parts.append(f"Budget ({b.sector.name}, {b.year}): ₹{b.amount_crores} crores")

    # Find relevant timeline events
    event_query = db.query(TimelineEvent).join(TimelineEvent.policy).join(Policy.sector)
    if sector:
        event_query = event_query.filter(Sector.name == sector)

    events = event_query.order_by(TimelineEvent.year.desc()).limit(10).all()
    for e in events:
        context_parts.append(f"Event ({e.policy.name}, {e.year}): {e.event_type} - {e.description or ''}")

    context = "\n".join(context_parts)
    return context, evidence


def _generate_ai_response(question: str, context: str) -> str:
    try:
        from google import genai as genai_new
        from app.config import settings
        if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "your_gemini_api_key_here":
            raise ValueError("Gemini API key not configured")
            
        client = genai_new.Client(api_key=settings.GEMINI_API_KEY)

        prompt = f"""You are a governance intelligence assistant. Answer the user's question based ONLY on the provided governance data.\n\nGOVERNANCE DATA:\n{context}\n\nUSER QUESTION: {question}\n\nProvide a clear, structured response that:\n1. Directly answers the question\n2. References specific promises, policies, or budget data\n3. Highlights any gaps or notable findings\n4. Keeps the response concise (3-5 paragraphs max)\n\nIf the data doesn't contain enough information to fully answer, say so honestly."""
        response = client.models.generate_content(model='gemini-2.5-flash', contents=prompt)
        return response.text
    except Exception as e:
        import logging
        logging.error(f"Gemini API Error: {str(e)}")
        return _fallback_response(question, context)

def _fallback_response(question: str, context: str) -> str:
    lines = context.split("\n")
    promise_lines = [l for l in lines if l.startswith("Promise")]
    policy_lines = [l for l in lines if l.startswith("Policy")]
    budget_lines = [l for l in lines if l.startswith("Budget")]
    event_lines = [l for l in lines if l.startswith("Event")]

    parts = [f"## Governance Intelligence Report\n\nBased on your query: **\"{question}\"**, here is the relevant data from our governance database:\n"]

    if promise_lines:
        parts.append(f"### 📋 Related Manifesto Promises ({len(promise_lines)})\n")
        for line in promise_lines[:5]:
            parts.append(f"- {line}\n")

    if policy_lines:
        parts.append(f"\n### 📜 Related Policies ({len(policy_lines)})\n")
        for line in policy_lines[:5]:
            parts.append(f"- {line}\n")

    if budget_lines:
        parts.append(f"\n### 💰 Budget Allocations ({len(budget_lines)})\n")
        for line in budget_lines[:5]:
            parts.append(f"- {line}\n")

    if event_lines:
        parts.append(f"\n### 📅 Recent Timeline Events ({len(event_lines)})\n")
        for line in event_lines[:5]:
            parts.append(f"- {line}\n")

    if not any([promise_lines, policy_lines, budget_lines, event_lines]):
        parts.append("No directly matching governance data was found for this query. Try searching for a specific sector like Healthcare, Education, or Infrastructure.\n")

    return "\n".join(parts)

@router.post("/ask", response_model=AIResponse)
def ask_ai_assistant(payload: AIQuestion, db: Session = Depends(get_db)):
    context, evidence = _build_context(payload.question, payload.sector, payload.election_cycle, db)
    answer = _generate_ai_response(payload.question, context)

    suggestions = []
    sectors_found = set(item["sector"] for item in evidence if "sector" in item)
    for sec in sectors_found:
        suggestions.append(f"What promises were made for the {sec} sector?")
        suggestions.append(f"How has {sec} budget changed over the years?")

    return AIResponse(answer=answer, evidence=evidence[:10], suggestions=suggestions[:5])

# --- Chat & RAG Extensions ---

@router.post("/chat/session", response_model=ChatSessionOut)
def create_chat_session(payload: ChatSessionCreate, db: Session = Depends(get_db)):
    new_session = ChatSession(session_title=payload.session_title, user_id=payload.user_id)
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session

@router.get("/chat/history/{session_id}", response_model=ChatSessionOut)
def get_chat_history(session_id: str, db: Session = Depends(get_db)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    # Order messages chronologically
    session.messages = sorted(session.messages, key=lambda m: m.created_at)
    return session

@router.get("/chat/sessions", response_model=List[ChatSessionOut])
def get_all_chat_sessions(db: Session = Depends(get_db)):
    sessions = db.query(ChatSession).order_by(desc(ChatSession.updated_at)).all()
    return sessions

@router.delete("/chat/session/{session_id}")
def delete_chat_session(session_id: str, db: Session = Depends(get_db)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    db.delete(session)
    db.commit()
    return {"status": "success", "message": "Session deleted"}

@router.post("/chat/upload", response_model=UploadedDocumentOut)
def upload_document(
    session_id: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    # Verify session exists
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    os.makedirs("data/uploads", exist_ok=True)
    file_path = f"data/uploads/{uuid.uuid4()}_{file.filename}"
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    doc = UploadedDocument(
        session_id=session.id,
        file_name=file.filename,
        file_type=file.content_type or "unknown",
        file_path=file_path
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)

    # Trigger chunking and embedding pipeline
    process_and_store_document(db, doc.id)

    logging.info(f"Document uploaded: {file.filename} into session: {session_id}")
    return doc


def _retrieve_document_chunks(session_id: str, query: str, db: Session, top_k=5) -> str:
    """Retrieve top K chunks for the given session via semantic cosine similarity."""
    from sentence_transformers import util
    query_emb = _encode([query])

    # Get all chunks across all documents connected to this session
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session or not session.documents:
        return ""

    all_chunks = []
    chunk_embeddings = []
    
    for doc in session.documents:
        for chunk in doc.chunks:
            all_chunks.append(chunk)
            chunk_embeddings.append(chunk.embedding)

    if not all_chunks:
        return ""

    import torch
    corpus_tensor = torch.tensor(chunk_embeddings)
    scores = util.cos_sim(query_emb, corpus_tensor)[0]
    indexed_scores = sorted(enumerate(scores.tolist()), key=lambda x: x[1], reverse=True)

    results = []
    for idx, score in indexed_scores[:top_k]:
        results.append(all_chunks[idx].chunk_text)

    return "\n---\n".join(results)

@router.post("/chat/message", response_model=AiChatResponse)
def send_chat_message(payload: SendMessagePayload, db: Session = Depends(get_db)):
    # 1. Store user message
    user_msg = ChatMessage(session_id=payload.session_id, role="user", message=payload.message)
    db.add(user_msg)
    db.commit()
    
    # 2. Extract recent conversation history
    session = db.query(ChatSession).filter(ChatSession.id == payload.session_id).first()
    recent_msgs = sorted(session.messages, key=lambda m: m.created_at)[-10:]
    history_text = "\n".join([f"{m.role}: {m.message}" for m in recent_msgs if m.role != "system"])

    # 3. Handle Special Summarization Query
    is_summarize = any(word in payload.message.lower() for word in ["summarize", "summary"])
    
    # 4. Synthesize RAG Sources
    doc_context = ""
    gov_context = ""
    tools_used = []

    if is_summarize and session.documents:
        # Concatenate entire documents loosely for summarization
        tools_used.append("document_summarization")
        doc_context = "\n".join([chunk.chunk_text for doc in session.documents for chunk in doc.chunks])
    else:
        # Perform targeted semantic search
        doc_context = _retrieve_document_chunks(str(payload.session_id), payload.message, db)
        if doc_context:
            tools_used.append("document_qa")
        
        gov_string, _ = _build_context(payload.message, sector=None, election_cycle=None, db=db)
        if gov_string.strip():
            gov_context = gov_string
            tools_used.append("governance_database_query")

    logging.info(f"Chat Query: {payload.message} | Tools used: {tools_used}")

    # 5. Build Final Prompt
    doc_prompt = f"---\nUPLOADED DOCUMENT FRAGMENTS\n---\n{doc_context}\n" if doc_context else ""
    gov_prompt = f"---\nGOVERNANCE DATABASE INSIGHTS\n---\n{gov_context}\n" if gov_context else ""

    prompt = f"""You are a persistent, highly intelligent Government Policy AI Advisor.

CONVERSATION HISTORY:
{history_text}

USER LATEST MESSAGE: {payload.message}

{doc_prompt}
{gov_prompt}

INSTRUCTIONS:
- Answer the user's latest query accurately.
- Use the conversation history to maintain context across questions.
- If Document Fragments are present, ground your answer heavily in them.
- If Governance Database Insights are present, explain implementation status.
- Generate clean, structured, and easy-to-read text.
- If the user asks for a summary, synthesize the document fragments into a structural summary.
"""

    answer = "Error generating response."
    try:
        from google import genai as genai_new
        from app.config import settings

        if settings.GEMINI_API_KEY and settings.GEMINI_API_KEY != "your_gemini_api_key_here":
            client = genai_new.Client(api_key=settings.GEMINI_API_KEY)
            response = client.models.generate_content(model='gemini-2.5-flash', contents=prompt)
            answer = response.text
        else:
            answer = _fallback_response(payload.message, gov_context or doc_context)
    except Exception as e:
        logging.error(f"Chat Gemini Error: {e}")
        answer = _fallback_response(payload.message, gov_context or doc_context)

    # 6. Store Assistant msg
    assistant_msg = ChatMessage(session_id=payload.session_id, role="assistant", message=answer)
    db.add(assistant_msg)
    
    # 7. Optionally label Session
    if len(session.messages) <= 3 and session.session_title == "New Conversation":
        session.session_title = payload.message[:30] + "..."
        
    db.commit()

    return AiChatResponse(
        answer=answer,
        reasoning="Aggregated document chunks and database context.",
        tools_used=tools_used
    )
