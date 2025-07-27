# -*- coding: utf-8 -*-
"""
Created on Sat Jul 26 13:33:40 2025

@author: parsa
"""

from sqlalchemy import Column, Integer, String, Float, Text, Boolean, ForeignKey, DateTime, JSON
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

Base = declarative_base()

# ----------------------
# Table: user_caller
# ----------------------
class UserCaller(Base):
    __tablename__ = "user_caller"
    id = Column(Integer, primary_key=True)
    fullname = Column(String)
    sex = Column(String)
    location = Column(String)
    phone_number = Column(String)
    language = Column(String)

# ----------------------
# Table: user_agent
# ----------------------
class UserAgent(Base):
    __tablename__ = "user_agent"
    id = Column(Integer, primary_key=True)
    fullname = Column(String)
    sex = Column(String)
    hospital_location = Column(String)
    status = Column(String)  # available / occupied
    language = Column(String)

# ----------------------
# Table: chat_session
# ----------------------
class ChatSession(Base):
    __tablename__ = "chat_session"
    id = Column(Integer, primary_key=True)
    user_caller_id = Column(Integer, ForeignKey("user_caller.id"))
    user_agent_id = Column(Integer, ForeignKey("user_agent.id"))
    started_at = Column(DateTime, default=datetime.utcnow)
    ended_at = Column(DateTime, nullable=True)
    status = Column(String)  # ongoing / completed / emergency

# ----------------------
# Table: chat_message
# ----------------------
class ChatMessage(Base):
    __tablename__ = "chat_message"
    id = Column(Integer, primary_key=True)
    session_id = Column(Integer, ForeignKey("chat_session.id"))
    sender_type = Column(String)  # caller / agent / ai
    message = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    confidence_score = Column(Float, nullable=True)
    unresolved = Column(Boolean, default=False)

# ----------------------
# Table: chat_session_guide
# ----------------------
class ChatSessionGuide(Base):
    __tablename__ = "chat_session_guide"
    id = Column(Integer, primary_key=True)
    session_id = Column(Integer, ForeignKey("chat_session.id"))
    question_suggestions = Column(JSON)  # [{"question": "...", "priority": 1, "status": "not_asked"}]
    department_suggestions = Column(JSON)  # ["emergency", "neurology"]




