import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Brain, Users, Truck, Shield, AlertTriangle, CheckCircle, Edit2, Save, X, Sparkles } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Suggestion {
  id: string;
  type: 'advice' | 'warning' | 'protocol';
  priority: 'high' | 'medium' | 'low';
  title: string;
  content: string;
  confidence: number;
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

interface AIAssessmentProps {
  assessment: Assessment;
  suggestions: Suggestion[];
}

export const AIAssessment = ({ assessment, suggestions }: AIAssessmentProps) => {
  const [selectedDepartments, setSelectedDepartments] = useState(assessment.departments);
  const [situationSummary, setSituationSummary] = useState(assessment.summary);
  const [isEditingSummary, setIsEditingSummary] = useState(false);
  const [editedSummary, setEditedSummary] = useState(assessment.summary);
  const [showDispatchDialog, setShowDispatchDialog] = useState(false);
  const [isRequestSent, setIsRequestSent] = useState(false);
  const [clickedSuggestions, setClickedSuggestions] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const getDepartmentIcon = (dept: string) => {
    switch (dept) {
      case 'police': return <Shield className="w-4 h-4" />;
      case 'fire': return <Truck className="w-4 h-4" />;
      case 'ambulance': return <Users className="w-4 h-4" />;
      default: return null;
    }
  };

  const handleDepartmentChange = (dept: string, checked: boolean) => {
    setSelectedDepartments(prev => ({
      ...prev,
      [dept]: checked
    }));
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    const newContent = ` ${suggestion.content}`;
    if (isEditingSummary) {
      setEditedSummary(prev => `${prev}${newContent}`);
    } else {
      setSituationSummary(prev => `${prev}${newContent}`);
    }
    
    // Mark suggestion as clicked
    setClickedSuggestions(prev => new Set([...prev, suggestion.id]));
    
    toast({
      description: "Suggestion added to situation summary",
      duration: 2000,
    });
  };

  const handleSaveEdit = () => {
    setSituationSummary(editedSummary);
    setIsEditingSummary(false);
    toast({
      description: "Situation summary updated",
      duration: 2000,
    });
  };

  const handleCancelEdit = () => {
    setEditedSummary(situationSummary);
    setIsEditingSummary(false);
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
    <Card className="p-6 bg-gradient-to-br from-card to-card/80 border-2 shadow-xl hover:shadow-2xl transition-all duration-300 animate-fade-in h-[calc(100vh-200px)] flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <Brain className="w-6 h-6 text-primary" />
        <h3 className="font-bold text-lg text-foreground">AI Assessment</h3>
      </div>
      
      <div className="flex-1">
        <div className="space-y-4 pr-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-base text-foreground">Situation Summary</h4>
              {isEditingSummary ? (
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSaveEdit}
                    className="h-8 w-8 p-0 hover:bg-success/20 hover:text-success"
                  >
                    <Save className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleCancelEdit}
                    className="h-8 w-8 p-0 hover:bg-destructive/20 hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingSummary(true)}
                  className="h-8 w-8 p-0 hover:bg-primary/20 hover:text-primary"
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
              )}
            </div>
            {isEditingSummary ? (
              <Textarea
                value={editedSummary}
                onChange={(e) => setEditedSummary(e.target.value)}
                className="text-sm leading-relaxed bg-muted/20 border-primary/50 focus:border-primary resize-none"
                rows={4}
              />
            ) : (
              <p className="text-sm text-muted-foreground leading-relaxed bg-muted/20 p-3 rounded-lg max-h-24 overflow-y-auto">
                {situationSummary}
              </p>
            )}
          </div>
        
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Sparkles className="w-5 h-5 text-primary" />
              <h4 className="font-semibold text-base text-foreground">AI Suggestions</h4>
              <Badge variant="secondary" className="ml-auto bg-primary/10 text-primary border-primary/30 text-xs">
                {suggestions.length} available
              </Badge>
            </div>
            <div className="h-48 overflow-y-scroll border rounded-lg">
              <div className="p-4 space-y-2">
                {suggestions
                  .sort((a, b) => {
                    const aClicked = clickedSuggestions.has(a.id);
                    const bClicked = clickedSuggestions.has(b.id);
                    if (aClicked && !bClicked) return 1;
                    if (!aClicked && bClicked) return -1;
                    return 0;
                  })
                  .map((suggestion) => {
                    const isClicked = clickedSuggestions.has(suggestion.id);
                    return (
                      <div
                        key={suggestion.id}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className={`group border rounded-xl transition-all duration-300 cursor-pointer relative overflow-hidden ${
                          isClicked 
                            ? 'p-2 bg-gradient-to-r from-green-50 to-green-100 hover:shadow-md border-green-200 scale-95' 
                            : 'p-3 bg-gradient-to-r from-card to-card/90 hover:shadow-lg hover:scale-[1.02] hover:border-primary/50'
                        }`}
                      >
                        <div className={`absolute inset-0 transition-opacity duration-300 ${
                          isClicked 
                            ? 'bg-gradient-to-r from-green-100/50 to-transparent opacity-100' 
                            : 'bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100'
                        }`} />
                        <div className="relative">
                          <div className="flex items-center gap-2 mb-2">
                            <div className={`p-1.5 rounded-lg ${
                              suggestion.priority === 'high' ? 'bg-emergency/20' :
                              suggestion.priority === 'medium' ? 'bg-warning/20' : 'bg-info/20'
                            }`}>
                              <div className={`${getPriorityColor(suggestion.priority)}`}>
                                {getTypeIcon(suggestion.type)}
                              </div>
                            </div>
                            <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">{suggestion.title}</span>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ml-auto ${getPriorityColor(suggestion.priority)} border-current`}
                            >
                              {suggestion.priority}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">{suggestion.content}</p>
                          <div className="flex items-center justify-between mt-2">
                            <div className="text-xs text-muted-foreground">Confidence: {suggestion.confidence}%</div>
                            <div className="text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">Click to add →</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        
          <div>
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-semibold text-base text-foreground">Required Departments</h4>
              <Dialog open={showDispatchDialog} onOpenChange={setShowDispatchDialog}>
                <DialogTrigger asChild>
                  <Button 
                    className={isRequestSent 
                      ? "bg-green-600 text-white hover:bg-green-700 px-4 py-2 text-sm font-medium shadow-lg" 
                      : "bg-emergency text-emergency-foreground hover:bg-emergency/90 px-4 py-2 text-sm font-medium shadow-lg"
                    }
                    onClick={() => setIsRequestSent(true)}
                  >
                    {isRequestSent ? "Sent" : "Request"}
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Emergency Services Dispatched</DialogTitle>
                  </DialogHeader>
                  <p className="text-muted-foreground">
                    Requested emergency services are dispatched and situation summary is sent to them.
                  </p>
                  <Button 
                    onClick={() => setShowDispatchDialog(false)}
                    className="mt-4"
                  >
                    Close
                  </Button>
                </DialogContent>
              </Dialog>
            </div>
            <div className="space-y-3">
              {['police', 'fire', 'ambulance'].map((dept) => (
                <div key={dept} className="flex items-center space-x-3 p-2 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors">
                  <Checkbox
                    id={dept}
                    checked={selectedDepartments[dept as keyof typeof selectedDepartments]}
                    onCheckedChange={(checked) => handleDepartmentChange(dept, checked as boolean)}
                    className={`${
                      dept === 'police' ? 'data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500' :
                      dept === 'fire' ? 'data-[state=checked]:bg-red-500 data-[state=checked]:border-red-500' :
                      'data-[state=checked]:bg-green-500 data-[state=checked]:border-green-500'
                    }`}
                  />
                  <div className="flex items-center gap-2 flex-1">
                    <div className={`${
                      dept === 'police' ? 'text-blue-500' :
                      dept === 'fire' ? 'text-red-500' :
                      'text-green-500'
                    }`}>
                      {getDepartmentIcon(dept)}
                    </div>
                    <label 
                      htmlFor={dept} 
                      className="text-sm font-medium cursor-pointer capitalize"
                    >
                      {dept}
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
};