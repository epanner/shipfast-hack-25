import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { HelpCircle, Check, Star } from "lucide-react";
import { useState } from "react";

interface Question {
  id: string;
  category: 'location' | 'medical' | 'safety' | 'details';
  question: string;
  priority: number;
  reasoning: string;
}

interface QuestionSuggestionsProps {
  questions: Question[];
}

export const QuestionSuggestions = ({ questions }: QuestionSuggestionsProps) => {
  const [askedQuestions, setAskedQuestions] = useState<Set<string>>(new Set());

  const handleMarkAsked = (questionId: string) => {
    setAskedQuestions(prev => new Set([...prev, questionId]));
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'location': return 'bg-emergency text-emergency-foreground';
      case 'medical': return 'bg-warning text-warning-foreground';
      case 'safety': return 'bg-success text-success-foreground';
      case 'details': return 'bg-info text-info-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const unansweredQuestions = questions.filter(q => !askedQuestions.has(q.id)).sort((a, b) => b.priority - a.priority);
  const answeredQuestions = questions.filter(q => askedQuestions.has(q.id)).sort((a, b) => b.priority - a.priority);
  const sortedQuestions = [...unansweredQuestions, ...answeredQuestions];

  return (
    <Card className="p-6 bg-gradient-to-br from-card to-card/80 border-2 shadow-xl hover:shadow-2xl transition-all duration-300 animate-fade-in h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <HelpCircle className="w-6 h-6 text-primary" />
        <h3 className="font-bold text-lg text-foreground">Question Suggestions</h3>
        <Badge variant="secondary" className="ml-auto bg-primary/10 text-primary border-primary/30">
          {questions.length} ready
        </Badge>
      </div>
      
      <ScrollArea className="flex-1">
        <div className="space-y-3 pr-4">
          {sortedQuestions.map((question) => {
            const isAsked = askedQuestions.has(question.id);
            return (
              <div
                key={question.id}
                className={`border rounded-xl bg-gradient-to-r from-card to-card/80 transition-all duration-500 animate-fade-in ${
                  isAsked 
                    ? 'bg-success/10 border-success/30 p-2' 
                    : 'p-4 hover:shadow-lg hover:scale-[1.02]'
                }`}
              >
              {isAsked ? (
                // Collapsed view for answered questions
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 bg-success/20 text-success hover:bg-success/30"
                      disabled
                    >
                      <Check className="w-3 h-3 text-success" />
                    </Button>
                    <p className="text-sm font-medium text-success truncate">
                      "{question.question}"
                    </p>
                  </div>
                  <Badge className={`text-xs px-2 py-1 ${getCategoryColor(question.category)} opacity-60`}>
                    {question.category}
                  </Badge>
                </div>
              ) : (
                // Full view for unanswered questions
                <>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Badge className={`text-xs px-3 py-1 ${getCategoryColor(question.category)}`}>
                        {question.category}
                      </Badge>
                      {question.priority >= 8 && (
                        <div className="p-1 bg-warning/20 rounded-full">
                          <Star className="w-3 h-3 text-warning fill-current" />
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleMarkAsked(question.id)}
                      className="h-8 w-8 p-0 hover:bg-success/20 hover:text-success"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  <p className="text-base font-semibold text-foreground mb-3">
                    "{question.question}"
                  </p>
                  
                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                    {question.reasoning}
                  </p>
                  
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 bg-muted/20 px-3 py-1 rounded-full">
                      <div className="w-2 h-2 rounded-full bg-primary"></div>
                      <span className="text-sm font-medium text-primary">Priority {question.priority}/10</span>
                    </div>
                  </div>
                </>
              )}
            </div>
            );
          })}
        </div>
      </ScrollArea>
    </Card>
  );
};