import { useState, useEffect } from "react";
import { CallStatus } from "./CallStatus";
import { LiveTranscript } from "./LiveTranscript";
import { QuestionSuggestions } from "./QuestionSuggestions";
import { AIAssessment } from "./AIAssessment";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

// Mock data types
interface TranscriptMessage {
  id: string;
  speaker: 'caller' | 'ai-agent' | 'human-agent';
  message: string;
  originalLanguage?: string;
  timestamp: string;
  isTranslated?: boolean;
}

interface Suggestion {
  id: string;
  type: 'advice' | 'warning' | 'protocol';
  priority: 'high' | 'medium' | 'low';
  title: string;
  content: string;
  confidence: number;
}

interface Question {
  id: string;
  category: 'location' | 'medical' | 'safety' | 'details' | 'reassurance';
  question: string;
  priority: number;
  reasoning: string;
}

interface Assessment {
  summary: string;
  departments: {
    police: boolean;
    fire: boolean;
    ambulance: boolean;
  };
  confidence: number;
}

interface CallData {
  phoneNumber: string;
  language: string;
  priority: string;
  audioResults?: any;
  transcript: string;
  summary: string[];
  target_language: string;
}

interface EmergencyDashboardProps {
  initialCallData?: CallData;
}

export const EmergencyDashboard = ({ initialCallData }: EmergencyDashboardProps) => {
  const navigate = useNavigate();
  const [callDuration, setCallDuration] = useState("00:00:00");
  const [isCallActive, setIsCallActive] = useState(true);
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('high');
  const [systemStatus, setSystemStatus] = useState<'online' | 'offline'>('online');
  
  // Debug logging
  console.log('EmergencyDashboard - initialCallData:', initialCallData);

  // AI recommendations state
  const [aiRecommendations, setAiRecommendations] = useState<Suggestion[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // Agent communication suggestions state
  const [agentSuggestions, setAgentSuggestions] = useState<Question[]>([]);
  const [loadingAgentSuggestions, setLoadingAgentSuggestions] = useState(false);

  // Initialize messages with audio transcript if available
  const [messages, setMessages] = useState<TranscriptMessage[]>(() => {
    const defaultMessages: TranscriptMessage[] = [];

    // If we have audio transcript, add it as the most recent message
    if (initialCallData?.transcript) {
      console.log('Adding audio transcript:', initialCallData.transcript);
      const audioMessage: TranscriptMessage = {
        id: "audio-upload",
        speaker: "caller",
        message: `🎵 UPLOADED AUDIO: ${initialCallData.transcript}`,
        originalLanguage: initialCallData.target_language,
        timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
        isTranslated: initialCallData.target_language !== 'english'
      };
      
      const finalMessages = [...defaultMessages, audioMessage];
      console.log('Final messages array:', finalMessages);
      return finalMessages;
    }

    console.log('No audio transcript found, using default messages');
    return defaultMessages;
  });

  const [suggestions] = useState<Suggestion[]>([
    {
      id: "1",
      type: "warning",
      priority: "high",
      title: "Vehicle Fire Risk",
      content: "Advise caller to maintain safe distance due to smoke from engine. Fire department response should be prioritized.",
      confidence: 95
    },
    {
      id: "2",
      type: "advice",
      priority: "high",
      title: "Medical Assessment",
      content: "One victim appears unresponsive - immediate paramedic dispatch required. Advise caller not to move victims unless immediate danger.",
      confidence: 89
    },
    {
      id: "3",
      type: "protocol",
      priority: "medium",
      title: "Traffic Management",
      content: "Highway 95 Exit 12 - coordinate with traffic control to prevent secondary accidents. Request police for scene management.",
      confidence: 78
    }
  ]);

  const [questions] = useState<Question[]>([
    {
      id: "1",
      category: "safety",
      question: "Are you in a safe location away from the vehicle?",
      priority: 10,
      reasoning: "Caller safety is priority with potential vehicle fire"
    },
    {
      id: "2",
      category: "medical",
      question: "Is the responsive person able to speak or move freely?",
      priority: 9,
      reasoning: "Assess extent of injuries for proper medical response"
    },
    {
      id: "3",
      category: "location",
      question: "Which direction was the vehicle traveling when it flipped?",
      priority: 8,
      reasoning: "Helps determine lane closure and traffic control needs"
    },
    {
      id: "4",
      category: "details",
      question: "How many lanes does the accident block?",
      priority: 7,
      reasoning: "Critical for traffic management and emergency vehicle access"
    }
  ]);

  const [assessment] = useState<Assessment>(() => {
    const defaultAssessment = {
      summary: ".",
      departments: {
        police: true,
        fire: true,
        ambulance: true
      },
      confidence: 94
    };

    // If we have audio summary, combine it with the default assessment
    if (initialCallData?.summary && initialCallData.summary.length > 0) {
      const audioSummary = initialCallData.summary.join(' ');
      return {
        ...defaultAssessment,
        summary: `${defaultAssessment.summary}\n\n UPLOADED AUDIO ANALYSIS: ${audioSummary}`,
        confidence: 96 // Higher confidence with additional audio data
      };
    }

    return defaultAssessment;
  });

  // Fetch AI recommendations when audio data is available
  useEffect(() => {
    if (initialCallData?.transcript && initialCallData?.summary) {
      fetchAIRecommendations(initialCallData.transcript, initialCallData.summary);
      fetchAgentSuggestions(initialCallData.transcript, initialCallData.summary);
    }
  }, [initialCallData]);

  const fetchAIRecommendations = async (transcript: string, summary: string[]) => {
    setLoadingRecommendations(true);
    
    try {
      const response = await fetch('http://localhost:8000/generate-recommendations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: transcript,
          summary: summary,
          target_language: 'english'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Convert backend recommendations to frontend Suggestion format
      const formattedRecommendations: Suggestion[] = result.recommendations.map((rec: any) => ({
        id: rec.id,
        type: rec.type as 'advice' | 'warning' | 'protocol',
        priority: rec.priority as 'high' | 'medium' | 'low',
        title: rec.title,
        content: rec.content,
        confidence: rec.confidence
      }));
      
      setAiRecommendations(formattedRecommendations);
      
    } catch (error) {
      console.error('Error fetching AI recommendations:', error);
      // Set fallback recommendations
      setAiRecommendations([
        {
          id: 'fallback-1',
          type: 'advice',
          priority: 'high',
          title: 'Scene Assessment',
          content: 'Conduct thorough scene safety assessment before approaching.',
          confidence: 85
        }
      ]);
    } finally {
      setLoadingRecommendations(false);
    }
  };

  const fetchAgentSuggestions = async (transcript: string, summary: string[]) => {
    setLoadingAgentSuggestions(true);
    
    try {
      const response = await fetch('http://localhost:8000/generate-agent-suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript: transcript,
          summary: summary,
          target_language: 'english'
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Convert backend suggestions to frontend Question format
      const formattedSuggestions: Question[] = result.suggestions.map((suggestion: any) => ({
        id: suggestion.id,
        category: suggestion.category as 'location' | 'medical' | 'safety' | 'details' | 'reassurance',
        question: suggestion.suggestion, // Backend uses 'suggestion' field
        priority: suggestion.priority,
        reasoning: suggestion.reasoning
      }));
      
      setAgentSuggestions(formattedSuggestions);
      
    } catch (error) {
      console.error('Error fetching agent suggestions:', error);
      // Set fallback suggestions
      setAgentSuggestions([
        {
          id: 'fallback-1',
          category: 'safety',
          question: 'Is the caller in a safe location?',
          priority: 10,
          reasoning: 'Caller safety is priority with potential vehicle fire'
        }
      ]);
    } finally {
      setLoadingAgentSuggestions(false);
    }
  };

  // Simulate call duration
  useEffect(() => {
    const startTime = Date.now() - 3 * 60 * 1000; // Started 3 minutes ago
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const hours = Math.floor(elapsed / 3600000);
      const minutes = Math.floor((elapsed % 3600000) / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      setCallDuration(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Simulate new messages
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.85) { // 15% chance every 3 seconds
        const newMessage: TranscriptMessage = {
          id: Date.now().toString(),
          speaker: Math.random() > 0.7 ? 'caller' : Math.random() > 0.5 ? 'ai-agent' : 'human-agent',
          message: Math.random() > 0.5 
            ? "I can see the emergency vehicles arriving now." 
            : "Stay on the line with me. Help is on the way.",
          timestamp: new Date().toLocaleTimeString('en-US', { hour12: false }),
          isTranslated: Math.random() > 0.7,
          originalLanguage: Math.random() > 0.5 ? "Spanish" : "French"
        };
        
        setMessages(prev => [...prev, newMessage]);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const handleCallToggle = () => {
    setIsCallActive(!isCallActive);
  };

  return (
    <div className="h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 flex flex-col">
      <div className="max-w-[1800px] mx-auto flex-1 flex flex-col">
        <header className="mb-6 flex-shrink-0">
          <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 backdrop-blur-sm border rounded-xl p-6 shadow-lg">
            <div>
              <h1 className="text-4xl font-bold text-white">
                Emergency Call Center
              </h1>
              <p className="text-blue-100 mt-1">Real-time AI-assisted emergency response dashboard</p>
            </div>
            <div className="flex items-center gap-4">
              <Button
                onClick={() => navigate('/')}
                variant="ghost"
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 border border-white/20 shadow-sm text-white hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Dashboard
              </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20 shadow-sm text-white hover:text-white">
                  <div className={`w-3 h-3 rounded-full ${systemStatus === 'online' ? 'bg-green-400 animate-pulse shadow-lg shadow-green-400/50' : 'bg-red-400'}`}></div>
                  <span className="text-sm font-medium">System {systemStatus === 'online' ? 'Online' : 'Offline'}</span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-40 bg-white dark:bg-gray-800 border shadow-lg z-50">
                <DropdownMenuItem 
                  onClick={() => setSystemStatus('online')}
                  className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                  <span>Online</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setSystemStatus('offline')}
                  className="flex items-center gap-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <span>Offline</span>
                </DropdownMenuItem>
               </DropdownMenuContent>
             </DropdownMenu>
           </div>
         </div>
       </header>

        <div className="grid grid-cols-1 lg:grid-cols-6 gap-6 h-full">
          {/* Left Column - Call Status & Question Suggestions */}
          <div className="lg:col-span-2 flex flex-col gap-6 min-h-0">
            <div className="flex-shrink-0">
              <CallStatus 
                callDuration={callDuration}
                isActive={isCallActive}
                detectedLanguage="Spanish"
                callerLocation="Highway 95, Exit 12"
                callerGender="female"
                priority={priority}
                phoneNumber="+1 (555) 123-4567"
                callStartTime="Today 14:20:15"
                onPriorityChange={setPriority}
                onCallToggle={handleCallToggle}
                isCompact={true}
              />
            </div>
            <div className="flex-1 min-h-0">
              <QuestionSuggestions questions={agentSuggestions} />
            </div>
          </div>

          {/* Center - Live Transcript */}
          <div className="lg:col-span-2 min-h-0">
            <LiveTranscript 
              messages={messages}
              isRecording={isCallActive}
            />
          </div>

          {/* Right Column - AI Assessment with Suggestions */}
          <div className="lg:col-span-2 min-h-0 max-h-screen">
            <AIAssessment 
              assessment={assessment} 
              suggestions={[]} 
              aiRecommendations={aiRecommendations} 
              loadingRecommendations={loadingRecommendations} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};