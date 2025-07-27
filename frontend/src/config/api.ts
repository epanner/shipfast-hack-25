// API Configuration for different environments
const isDevelopment = import.meta.env.DEV;
const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const isDocker = window.location.port === '3100';

// Determine the API base URL based on environment
export const API_BASE_URL = (() => {
  if (isLocalhost && isDocker) {
    // Local Docker environment
    return 'http://localhost:8100';
  } else if (isLocalhost) {
    // Local development environment
    return 'http://localhost:8000';
  } else {
    // Production environment (Hetzner server with subdomains)
    return 'https://api-shipfast2025.naurzalinov.me';
  }
})();

// Define endpoints as relative paths
export const API_ENDPOINTS = {
  PROCESS_AUDIO: '/process-audio',
  GENERATE_RECOMMENDATIONS: '/generate-recommendations',
  GENERATE_AGENT_SUGGESTIONS: '/generate-agent-suggestions',
  HEALTH: '/health',
} as const;

// Helper function to build API URLs
export const buildApiUrl = (endpoint: string): string => {
  return `${API_BASE_URL}${endpoint}`;
};
