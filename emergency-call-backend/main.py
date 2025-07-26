# -*- coding: utf-8 -*-
"""
Created on Sat Jul 26 13:33:13 2025

@author: parsa
"""

"""
from fastapi import FastAPI

app = FastAPI()

@app.get("/")
def read_root():
    return {"message": "Emergency Call App Backend is running"}
"""

from typing import List, Optional

from models import ChatSessionGuide

from models import ChatMessage


from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from models import Base, UserCaller, UserAgent, ChatSession
from pydantic import BaseModel
import random


# -------- Database Setup --------
DATABASE_URL = "sqlite:///./emergency_call.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)

app = FastAPI()

# -------- Dependency --------
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# -------- Request Schema --------
class StartCallRequest(BaseModel):
    fullname: str
    phone_number: str
    language: str
    location: str
    sex: str

# -------- Response Schema --------
class StartCallResponse(BaseModel):
    session_id: int
    agent_name: str
    agent_language: str
    caller_name: str
    message: str

# -------- Route: Start a Call --------
@app.post("/start-call", response_model=StartCallResponse)
def start_call(data: StartCallRequest, db: Session = Depends(get_db)):
    # 1. Create caller
    caller = UserCaller(
        fullname=data.fullname,
        phone_number=data.phone_number,
        language=data.language,
        location=data.location,
        sex=data.sex
    )
    db.add(caller)
    db.commit()
    db.refresh(caller)

    # 2. Find available agent
    agent = db.query(UserAgent).filter(UserAgent.status == "available").first()
    if not agent:
        raise HTTPException(status_code=503, detail="No available agents at the moment")

    # 3. Assign agent (mark as occupied)
    agent.status = "occupied"
    db.commit()

    # 4. Create chat session
    session = ChatSession(
        user_caller_id=caller.id,
        user_agent_id=agent.id,
        status="ongoing"
    )
    db.add(session)
    db.commit()
    db.refresh(session)

    return StartCallResponse(
        session_id=session.id,
        agent_name=agent.fullname,
        agent_language=agent.language,
        caller_name=caller.fullname,
        message="Call started and assigned to available agent"
    )



# ----------------------------------------------------------------------------


class SendMessageRequest(BaseModel):
    session_id: int
    sender_type: str  # "caller", "agent", "ai"
    message: str
    confidence_score: float = None  # optional
    unresolved: bool = False



@app.post("/send-message")
def send_message(data: SendMessageRequest, db: Session = Depends(get_db)):
    # Check that session exists
    session = db.query(ChatSession).filter(ChatSession.id == data.session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Chat session not found")

    # Save message
    chat_msg = ChatMessage(
        session_id=data.session_id,
        sender_type=data.sender_type,
        message=data.message,
        confidence_score=data.confidence_score,
        unresolved=data.unresolved
    )
    db.add(chat_msg)
    db.commit()
    
    
    if detect_emergency_keywords(data.message):
        # Mark session as high priority or trigger ambulance dispatch logic
        session = db.query(ChatSession).filter(ChatSession.id == data.session_id).first()
        if session:
            session.status = "emergency"
            db.commit()


    return {"message": "Message stored successfully"}




# ----------------------------------------------------------------------------


class ChatMessageOut(BaseModel):
    sender_type: str
    message: str
    confidence_score: float | None = None
    unresolved: bool

class LiveFeedResponse(BaseModel):
    session_id: int
    messages: list[ChatMessageOut]
    suggestions: list[str]



@app.get("/live-feed/{session_id}", response_model=LiveFeedResponse)
def get_live_feed(session_id: int, db: Session = Depends(get_db)):
    messages = db.query(ChatMessage).filter(ChatMessage.session_id == session_id).order_by(ChatMessage.created_at).all()
    session_guide = db.query(ChatSessionGuide).filter(ChatSessionGuide.session_id == session_id).first()

    msg_list = [
        ChatMessageOut(
            sender_type=msg.sender_type,
            message=msg.message,
            confidence_score=msg.confidence_score,
            unresolved=msg.unresolved
        )
        for msg in messages
    ]

    suggestions = []
    if session_guide and session_guide.question_suggestions:
        suggestions = [q["question"] for q in session_guide.question_suggestions if q["status"] == "not_asked"]

    return LiveFeedResponse(
        session_id=session_id,
        messages=msg_list,
        suggestions=suggestions
    )


# ----------------------------------------------------------------------------


class QuestionSuggestion(BaseModel):
    question: str
    priority: int
    status: str  # "asked" or "not_asked"

class UpdateSuggestionsRequest(BaseModel):
    session_id: int
    question_suggestions: List[QuestionSuggestion]
    department_suggestions: Optional[List[str]] = []



@app.post("/update-suggestions")
def update_suggestions(data: UpdateSuggestionsRequest, db: Session = Depends(get_db)):
    session_guide = db.query(ChatSessionGuide).filter(ChatSessionGuide.session_id == data.session_id).first()

    if session_guide:
        session_guide.question_suggestions = [q.dict() for q in data.question_suggestions]
        session_guide.department_suggestions = data.department_suggestions
    else:
        session_guide = ChatSessionGuide(
            session_id=data.session_id,
            question_suggestions=[q.dict() for q in data.question_suggestions],
            department_suggestions=data.department_suggestions
        )
        db.add(session_guide)

    db.commit()
    return {"message": "Suggestions updated"}







# ----------------------------------------------------------------------------
# ----------------------------------------------------------------------------
# ----------------------------------------------------------------------------
# Helper functions


def generate_mock_suggestions(language: str):
    if language.lower() == "french":
        return [
            {"question": "Avez-vous des douleurs thoraciques ?", "priority": 1, "status": "not_asked"},
            {"question": "Avez-vous des antécédents médicaux ?", "priority": 2, "status": "not_asked"},
        ]
    else:
        return [
            {"question": "Are you experiencing chest pain?", "priority": 1, "status": "not_asked"},
            {"question": "Do you have any allergies?", "priority": 2, "status": "not_asked"},
        ]




@app.post("/generate-suggestions/{session_id}")
def generate_suggestions(session_id: int, db: Session = Depends(get_db)):
    session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    caller = db.query(UserCaller).filter(UserCaller.id == session.user_caller_id).first()
    if not caller:
        raise HTTPException(status_code=404, detail="Caller not found")

    questions = generate_mock_suggestions(caller.language)

    session_guide = db.query(ChatSessionGuide).filter(ChatSessionGuide.session_id == session_id).first()
    if session_guide:
        session_guide.question_suggestions = questions
    else:
        session_guide = ChatSessionGuide(
            session_id=session_id,
            question_suggestions=questions,
            department_suggestions=[]
        )
        db.add(session_guide)

    db.commit()
    return {"message": "Suggestions generated and saved", "questions": questions}



# ----------------------------------------------------------------------------


def detect_emergency_keywords(message: str) -> bool:
    keywords = ["heart attack", "unconscious", "severe bleeding", "not breathing"]
    message_lower = message.lower()
    return any(keyword in message_lower for keyword in keywords)







# ----------------------------------------------------------------------------
# ----------------------------------------------------------------------------
# ----------------------------------------------------------------------------
# TEMP
@app.on_event("startup")
def seed_agent():
    db = SessionLocal()
    if db.query(UserAgent).count() == 0:
        agent = UserAgent(
            fullname="Dr. Mathias Brunel",
            sex="male",
            hospital_location="Paris",
            status="available",
            language="french"
        )
        db.add(agent)
        db.commit()
    db.close()



# ----------------------------------------------------------------------------



