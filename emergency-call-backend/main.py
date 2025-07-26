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


from fastapi import FastAPI, Depends, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from models import Base, UserCaller, UserAgent, ChatSession
from pydantic import BaseModel
import random
import whisper
import os
from anthropic import Anthropic
from dotenv import load_dotenv
from typing import Union, List
import tempfile
from datetime import datetime

load_dotenv(dotenv_path="../.env")  # Load .env from parent directory

# -------- AI Configuration --------
CLAUDE_API_KEY = os.getenv("ANTHROPIC_API_KEY")
CLAUDE_MODEL = "claude-3-haiku-20240307"
MAX_TOKENS = 300

if CLAUDE_API_KEY:
    claude_client = Anthropic(api_key=CLAUDE_API_KEY)
else:
    claude_client = None

# -------- Database Setup --------
DATABASE_URL = "sqlite:///./emergency_call.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base.metadata.create_all(bind=engine)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    try:
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
    except Exception as e:
        print(f"Startup error: {e}")
    yield
    # Shutdown (nothing to do here)

app = FastAPI(lifespan=lifespan)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://127.0.0.1:8080", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add a simple root endpoint
@app.get("/")
def read_root():
    return {"message": "Emergency Call Backend is running", "status": "ok"}

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
# AI Processing Functions

def transcribe_audio(audio_path: str) -> str:
    """Transcribe audio using Whisper"""
    model = whisper.load_model("base")
    result = model.transcribe(audio_path)
    return result["text"]

def summarize_text_with_claude(text: str, target_language: str = "french") -> list:
    """Summarize and translate text using Claude"""
    if not claude_client:
        raise HTTPException(status_code=500, detail="Claude API not configured")
    
    response = claude_client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=MAX_TOKENS,
        messages=[
            {
                "role": "user",
                "content": (
                    f"This is a transcript of a voice message:\n\n{text}\n\n"
                    f"Please summarize the key points in bullet points. "
                    f"Then, translate the summary into {target_language}. "
                    f"Only output the translated bullet points."
                )
            }
        ]
    )
    
    summary_text = response.content[0].text.strip()
    summary_lines = [line.strip("-• ").strip() for line in summary_text.splitlines() if line.strip()]
    return summary_lines

def translate_with_claude(text: Union[str, List[str]], target_language: str) -> List[str]:
    """Translate text using Claude"""
    if not claude_client:
        raise HTTPException(status_code=500, detail="Claude API not configured")
    
    if isinstance(text, str):
        text_list = [text]
    else:
        text_list = text

    joined_text = "\n".join(f"- {t}" for t in text_list)

    prompt = (
        f"Translate the following messages into {target_language}. "
        f"Preserve the tone and meaning as much as possible. Output only the translations:\n\n"
        f"{joined_text}"
    )

    response = claude_client.messages.create(
        model=CLAUDE_MODEL,
        max_tokens=MAX_TOKENS,
        messages=[{"role": "user", "content": prompt}]
    )

    output = response.content[0].text.strip()
    translated_lines = [line.strip("-• ").strip() for line in output.splitlines() if line.strip()]
    return translated_lines

def process_audio_file(audio_path: str, target_language: str = "french") -> dict:
    """Complete audio processing pipeline"""
    transcript = transcribe_audio(audio_path)
    summary = summarize_text_with_claude(transcript, target_language)
    
    return {
        "transcript": transcript,
        "summary": summary,
        "target_language": target_language
    }

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




# -------- Audio Processing Endpoints --------

class AudioProcessRequest(BaseModel):
    session_id: int
    target_language: Optional[str] = "french"

class AudioProcessResponse(BaseModel):
    session_id: int
    transcript: str
    summary: List[str]
    target_language: str
    message: str

@app.post("/process-audio", response_model=AudioProcessResponse)
async def process_audio(
    audio_file: UploadFile = File(...),
    session_id: int = None,
    target_language: str = "french",
    db: Session = Depends(get_db)
):
    """Process audio file: transcribe, summarize, and optionally save to session"""
    
    # Validate session if provided
    if session_id:
        session = db.query(ChatSession).filter(ChatSession.id == session_id).first()
        if not session:
            raise HTTPException(status_code=404, detail="Chat session not found")
    
    # Save uploaded file temporarily
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_file:
        content = await audio_file.read()
        temp_file.write(content)
        temp_audio_path = temp_file.name
    
    try:
        # Process the audio
        result = process_audio_file(temp_audio_path, target_language)
        
        # If session_id provided, save transcript as a message
        if session_id:
            transcript_message = ChatMessage(
                session_id=session_id,
                sender_type="caller",
                message=result["transcript"],
                confidence_score=0.9,  # Default confidence for Whisper
                unresolved=False
            )
            db.add(transcript_message)
            
            # Save summary as AI message
            summary_text = "\n".join(f"• {point}" for point in result["summary"])
            summary_message = ChatMessage(
                session_id=session_id,
                sender_type="ai",
                message=f"Summary:\n{summary_text}",
                confidence_score=0.95,
                unresolved=False
            )
            db.add(summary_message)
            db.commit()
            
            message = "Audio processed and saved to session"
        else:
            message = "Audio processed successfully"
        
        return AudioProcessResponse(
            session_id=session_id or 0,
            transcript=result["transcript"],
            summary=result["summary"],
            target_language=result["target_language"],
            message=message
        )
        
    finally:
        # Clean up temporary file
        os.unlink(temp_audio_path)

@app.post("/transcribe-only")
async def transcribe_only(audio_file: UploadFile = File(...)):
    """Just transcribe audio without summarization"""
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=".mp3") as temp_file:
        content = await audio_file.read()
        temp_file.write(content)
        temp_audio_path = temp_file.name
    
    try:
        transcript = transcribe_audio(temp_audio_path)
        return {"transcript": transcript}
    finally:
        os.unlink(temp_audio_path)

@app.post("/translate-text")
def translate_text(text: str, target_language: str = "french"):
    """Translate text using Claude"""
    translated = translate_with_claude(text, target_language)
    return {"original": text, "translated": translated, "target_language": target_language}

@app.get("/test-backend")
def test_backend():
    """Simple test endpoint"""
    return {"status": "Backend is working!", "timestamp": datetime.now().isoformat()}

@app.get("/agents")
def get_agents(db: Session = Depends(get_db)):
    """Get all agents"""
    agents = db.query(UserAgent).all()
    return {"agents": [{"id": agent.id, "name": agent.fullname, "status": agent.status} for agent in agents]}

@app.post("/seed-agent")
def seed_agent(db: Session = Depends(get_db)):
    """Manually seed an agent for testing"""
    # Check if we already have agents
    agent_count = db.query(UserAgent).count()
    if agent_count > 0:
        # Set all agents to available
        agents = db.query(UserAgent).all()
        for agent in agents:
            agent.status = "available"
        db.commit()
        return {"message": f"Set {agent_count} agents to available", "agents": [{"name": agent.fullname, "status": agent.status} for agent in agents]}
    
    # Create test agent
    agent = UserAgent(
        fullname="Dr. Mathias Brunel",
        sex="male",
        hospital_location="Paris",
        status="available",
        language="french"
    )
    db.add(agent)
    db.commit()
    db.refresh(agent)
    
    return {"message": "Agent created successfully", "agent": {"id": agent.id, "name": agent.fullname, "status": agent.status}}

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
