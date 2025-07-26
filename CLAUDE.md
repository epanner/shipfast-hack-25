# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

sosAI is an AI-powered real-time emergency call assistant that enhances emergency call handling by leveraging AI to transcribe, analyze, and assist dispatchers in real time. The system provides live translations, AI-generated response suggestions, and smart question prompts to help emergency services respond faster and more accurately.

## Architecture

### Multi-component System
- **Frontend**: React/TypeScript app built with Vite, using shadcn/ui components and Tailwind CSS
- **Backend**: FastAPI Python server with SQLite database for emergency call management 
- **AI Processing**: Standalone Python script using OpenAI Whisper for transcription and Anthropic Claude for analysis/translation

### Key Components
- **Frontend** (`frontend/`): Emergency dispatcher dashboard with live transcription, AI suggestions, and call management
- **Backend** (`emergency-call-backend/`): REST API managing call sessions, messages, and agent assignments
- **AI Pipeline** (`main.py`): Audio transcription, summarization, and translation service

### Frontend Structure
- Pages: `Index.tsx` (landing), `Call.tsx` (main dashboard), `NotFound.tsx`
- Dashboard components in `components/dashboard/`: `EmergencyDashboard`, `LiveTranscript`, `AIAssessment`, `AISuggestions`, `QuestionSuggestions`
- UI components from shadcn/ui in `components/ui/`
- React Router for navigation, TanStack Query for state management

### Backend Architecture
- FastAPI with SQLAlchemy ORM and SQLite database
- Models: `UserCaller`, `UserAgent`, `ChatSession`, `ChatMessage`, `ChatSessionGuide`
- Endpoints for call management, messaging, live feeds, and AI suggestions
- Real-time emergency keyword detection

## Development Commands

### Frontend Development
```bash
cd frontend
npm install          # Install dependencies
npm run dev          # Start development server
npm run build        # Production build
npm run build:dev    # Development build
npm run lint         # Run linting
npm run preview      # Preview production build
```

### Backend Development
```bash
cd emergency-call-backend
# Install Python dependencies (requirements not specified in codebase)
python main.py       # Start FastAPI server
```

### AI Processing
```bash
# Requires ANTHROPIC_API_KEY environment variable
python main.py       # Process audio file (configured for test.mp3)
```

## Environment Setup

Create `.env` file with:
- `ANTHROPIC_API_KEY`: For Claude API access
- OpenAI API key may be required for Whisper (not explicitly shown in codebase)

## Key Technologies

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Radix UI, TanStack Query
- **Backend**: FastAPI, SQLAlchemy, SQLite, Pydantic
- **AI**: OpenAI Whisper, Anthropic Claude (Haiku model)
- **Routing**: React Router DOM
- **Styling**: Tailwind CSS with custom components

## Database Schema

Core entities:
- `UserCaller`: Emergency caller information (name, phone, location, language)
- `UserAgent`: Emergency dispatcher/agent details 
- `ChatSession`: Active emergency call sessions
- `ChatMessage`: Real-time message history
- `ChatSessionGuide`: AI-generated suggestions and questions

## Development Notes

- Frontend uses modern React patterns with hooks and functional components
- Backend follows REST API conventions with Pydantic validation
- AI pipeline is separate from web components for modularity
- Emergency keyword detection triggers automatic priority escalation
- Multi-language support with real-time translation capabilities