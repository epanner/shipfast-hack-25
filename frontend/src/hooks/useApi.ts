import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  apiService, 
  StartCallRequest, 
  StartCallResponse, 
  SendMessageRequest,
  LiveFeedResponse,
  UpdateSuggestionsRequest,
  AudioProcessingResponse
} from '../services/api';

// Query Keys
export const queryKeys = {
  liveFeed: (sessionId: number) => ['liveFeed', sessionId],
  suggestions: (sessionId: number) => ['suggestions', sessionId],
};

// Start Call Mutation
export const useStartCall = () => {
  return useMutation<StartCallResponse, Error, StartCallRequest>({
    mutationFn: (data: StartCallRequest) => apiService.startCall(data),
    onSuccess: (data) => {
      console.log('Call started successfully:', data);
    },
    onError: (error) => {
      console.error('Failed to start call:', error);
    },
  });
};

// Send Message Mutation
export const useSendMessage = () => {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, SendMessageRequest>({
    mutationFn: (data: SendMessageRequest) => apiService.sendMessage(data),
    onSuccess: (_, variables) => {
      // Invalidate live feed to refresh messages
      queryClient.invalidateQueries({
        queryKey: queryKeys.liveFeed(variables.session_id)
      });
    },
    onError: (error) => {
      console.error('Failed to send message:', error);
    },
  });
};

// Live Feed Query
export const useLiveFeed = (sessionId: number | null, enabled: boolean = true) => {
  return useQuery<LiveFeedResponse, Error>({
    queryKey: queryKeys.liveFeed(sessionId!),
    queryFn: () => apiService.getLiveFeed(sessionId!),
    enabled: enabled && sessionId !== null,
    refetchInterval: 2000, // Poll every 2 seconds for real-time updates
    staleTime: 1000, // Consider data stale after 1 second
  });
};

// Update Suggestions Mutation
export const useUpdateSuggestions = () => {
  const queryClient = useQueryClient();
  
  return useMutation<void, Error, UpdateSuggestionsRequest>({
    mutationFn: (data: UpdateSuggestionsRequest) => apiService.updateSuggestions(data),
    onSuccess: (_, variables) => {
      // Invalidate live feed to refresh suggestions
      queryClient.invalidateQueries({
        queryKey: queryKeys.liveFeed(variables.session_id)
      });
    },
    onError: (error) => {
      console.error('Failed to update suggestions:', error);
    },
  });
};

// Generate Suggestions Mutation
export const useGenerateSuggestions = () => {
  const queryClient = useQueryClient();
  
  return useMutation<string[], Error, number>({
    mutationFn: (sessionId: number) => apiService.generateSuggestions(sessionId),
    onSuccess: (_, sessionId) => {
      // Invalidate live feed to refresh suggestions
      queryClient.invalidateQueries({
        queryKey: queryKeys.liveFeed(sessionId)
      });
    },
    onError: (error) => {
      console.error('Failed to generate suggestions:', error);
    },
  });
};

// Process Audio Mutation
export const useProcessAudio = () => {
  const queryClient = useQueryClient();
  
  return useMutation<AudioProcessingResponse, Error, { sessionId: number; audioFile: File }>({
    mutationFn: ({ sessionId, audioFile }) => apiService.processAudio(sessionId, audioFile),
    onSuccess: (_, { sessionId }) => {
      // Invalidate live feed to refresh with new transcript/summary
      queryClient.invalidateQueries({
        queryKey: queryKeys.liveFeed(sessionId)
      });
    },
    onError: (error) => {
      console.error('Failed to process audio:', error);
    },
  });
};

// Upload Audio Mutation (alternative)
export const useUploadAudio = () => {
  const queryClient = useQueryClient();
  
  return useMutation<any, Error, { sessionId: number; audioFile: File }>({
    mutationFn: ({ sessionId, audioFile }) => apiService.uploadAudio(sessionId, audioFile),
    onSuccess: (_, { sessionId }) => {
      // Invalidate live feed to refresh with new data
      queryClient.invalidateQueries({
        queryKey: queryKeys.liveFeed(sessionId)
      });
    },
    onError: (error) => {
      console.error('Failed to upload audio:', error);
    },
  });
};
