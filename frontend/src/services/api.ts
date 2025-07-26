export interface UpdateSuggestionsRequest {
  session_id: number;
  question_suggestions: QuestionSuggestion[];
  department_suggestions?: string[];
}

export interface AudioProcessingResponse {
  session_id: number;
  transcript: string;
  summary: string;
  translation: string;
  confidence_score: number;
}

// API Configuration
const API_BASE_URL = 'http://localhost:8001';
