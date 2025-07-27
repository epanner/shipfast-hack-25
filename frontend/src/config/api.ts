// API Configuration for different environments
const isDevelopment = import.meta.env.DEV;
const isDocker = window.location.port === '3100';

export const API_BASE_URL = isDocker 
  ? 'http://localhost:8100'  // Docker port mapping
  : 'http://localhost:8000'; // Development port

export const API_ENDPOINTS = {
  PROCESS_AUDIO: `${API_BASE_URL}/process-audio`,
  GENERATE_RECOMMENDATIONS: `${API_BASE_URL}/generate-recommendations`,
  GENERATE_AGENT_SUGGESTIONS: `${API_BASE_URL}/generate-agent-suggestions`,
  HEALTH: `${API_BASE_URL}/health`,
} as const;

// Helper function to build API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};
