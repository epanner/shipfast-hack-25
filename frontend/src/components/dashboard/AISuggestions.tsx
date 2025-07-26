import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, AlertTriangle, CheckCircle, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Suggestion {
  id: string;
  type: 'advice' | 'warning' | 'protocol';
  priority: 'high' | 'medium' | 'low';
  title: string;
  content: string;
  confidence: number;
}

interface AISuggestionsProps {
  suggestions: Suggestion[];
}

export const AISuggestions = ({ suggestions }: AISuggestionsProps) => {
  const { toast } = useToast();

  const handleCopySuggestion = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      description: "Suggestion copied to clipboard",
      duration: 2000,
    });
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-emergency';
      case 'medium': return 'text-warning';
      case 'low': return 'text-info';
      default: return 'text-muted-foreground';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'warning': return <AlertTriangle className="w-4 h-4" />;
      case 'protocol': return <CheckCircle className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-card/80 border-2 shadow-xl hover:shadow-2xl transition-all duration-300 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="w-6 h-6 text-blue-600" />
        <h3 className="font-bold text-lg bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">AI Suggestions</h3>
        <Badge variant="secondary" className="ml-auto bg-blue-100 text-blue-700 border-blue-300">
          {suggestions.length} active
        </Badge>
      </div>
      
      <div>
        <div className="space-y-3">
          {suggestions.map((suggestion) => (
            <div
              key={suggestion.id}
              className="p-4 border rounded-xl bg-gradient-to-r from-card to-card/80 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 animate-fade-in"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-muted/30 ${getPriorityColor(suggestion.priority)}`}>
                    {getTypeIcon(suggestion.type)}
                  </div>
                  <span className="font-semibold text-base">{suggestion.title}</span>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                {suggestion.content}
              </p>
              
              <div className="flex items-center justify-between">
                <Badge
                  variant="outline"
                  className={`text-xs px-3 py-1 ${getPriorityColor(suggestion.priority)} bg-muted/20`}
                >
                  {suggestion.priority} priority
                </Badge>
                <div className="flex items-center gap-2 bg-muted/20 px-3 py-1 rounded-full">
                  <span className="text-xs text-muted-foreground">Confidence:</span>
                  <span className="text-xs font-bold text-primary">{suggestion.confidence}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};