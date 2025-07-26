import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Mic, MicOff, User, Bot } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface TranscriptMessage {
  id: string;
  speaker: 'caller' | 'ai-agent' | 'human-agent';
  message: string;
  originalLanguage?: string;
  timestamp: string;
  isTranslated?: boolean;
}

interface LiveTranscriptProps {
  messages: TranscriptMessage[];
  isRecording: boolean;
}

export const LiveTranscript = ({ messages, isRecording }: LiveTranscriptProps) => {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [isMuted, setIsMuted] = useState(false);

  // Auto-scroll to bottom when new messages arrive, but show newest on top when screen is filled
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        // Always scroll to bottom to show latest message
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);
  return (
    <Card className="p-6 h-[calc(100vh-200px)] flex flex-col bg-gradient-to-br from-card to-card/80 border-2 shadow-xl hover:shadow-2xl transition-all duration-300 animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-xl text-foreground">Live Transcript</h3>
        <div className="flex items-center gap-3">
          {isRecording && (
            <div className="flex items-center gap-2 bg-emergency/10 px-3 py-1 rounded-full">
              <div className="w-2 h-2 bg-emergency rounded-full animate-pulse shadow-lg shadow-emergency/50"></div>
              <span className="text-sm font-medium text-emergency">Recording</span>
            </div>
          )}
          <Button
            variant="ghost"
            onClick={() => setIsMuted(!isMuted)}
            className={`p-2 rounded-full transition-all duration-200 ${
              isRecording && !isMuted 
                ? 'bg-emergency/10 hover:bg-emergency/20 text-emergency' 
                : isMuted 
                ? 'bg-destructive/10 hover:bg-destructive/20 text-destructive'
                : 'bg-muted/30 hover:bg-muted/50 text-muted-foreground'
            }`}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </Button>
        </div>
      </div>
      
      <ScrollArea className="flex-1" ref={scrollAreaRef}>
        <div className="space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-4 p-4 rounded-xl transition-all duration-300 hover:scale-[1.02] animate-fade-in ${
                message.speaker === 'caller' 
                  ? 'bg-gradient-to-r from-primary/10 to-primary/5 border-l-4 border-l-primary shadow-lg shadow-primary/10' 
                  : message.speaker === 'ai-agent'
                  ? 'bg-gradient-to-l from-warning/10 to-warning/5 border-r-4 border-r-warning shadow-lg shadow-warning/10 flex-row-reverse'
                  : 'bg-gradient-to-l from-success/10 to-success/5 border-r-4 border-r-success shadow-lg shadow-success/10 flex-row-reverse'
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                message.speaker === 'caller' 
                  ? 'bg-primary text-primary-foreground' 
                  : message.speaker === 'ai-agent'
                  ? 'bg-warning text-warning-foreground'
                  : 'bg-success text-success-foreground'
              }`}>
                {message.speaker === 'caller' ? (
                  <User className="w-5 h-5" />
                ) : message.speaker === 'ai-agent' ? (
                  <Bot className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </div>
              
              <div className={`flex-1 ${message.speaker !== 'caller' ? 'text-right' : ''}`}>
                <div className={`flex items-center gap-3 mb-2 ${message.speaker !== 'caller' ? 'flex-row-reverse' : ''}`}>
                  <span className="font-semibold text-base capitalize">
                    {message.speaker === 'ai-agent' ? 'AI Agent' : message.speaker === 'human-agent' ? 'Human Agent' : 'Caller'}
                  </span>
                  <span className="text-sm text-muted-foreground font-mono">{message.timestamp}</span>
                  {message.isTranslated && (
                    <Badge variant="outline" className="text-xs bg-info/10 text-info border-info/30">
                      Translated from {message.originalLanguage}
                    </Badge>
                  )}
                </div>
                <p className="text-base text-foreground leading-relaxed">{message.message}</p>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};