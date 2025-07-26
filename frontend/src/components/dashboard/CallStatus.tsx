import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Clock, Phone, Globe, MapPin, User, AlertTriangle, Calendar, PhoneOff, ChevronDown } from "lucide-react";
import { useState } from "react";

interface CallStatusProps {
  callDuration: string;
  isActive: boolean;
  detectedLanguage: string;
  callerLocation: string;
  callerGender: 'male' | 'female' | 'unidentified';
  priority: 'low' | 'medium' | 'high' | 'critical';
  phoneNumber: string;
  callStartTime: string;
  onPriorityChange: (priority: 'low' | 'medium' | 'high' | 'critical') => void;
  onCallToggle?: () => void;
  isCompact?: boolean;
}

export const CallStatus = ({ 
  callDuration, 
  isActive, 
  detectedLanguage, 
  callerLocation, 
  callerGender, 
  priority, 
  phoneNumber,
  callStartTime,
  onPriorityChange,
  onCallToggle,
  isCompact = false
}: CallStatusProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <Card className={`${isCompact ? 'p-4' : 'p-6'} bg-gradient-to-br from-card to-card/80 border-2 shadow-xl hover:shadow-2xl transition-all duration-300 animate-fade-in h-full flex flex-col`}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger className="w-full">
          <div className={`flex items-center justify-between ${isCompact ? 'mb-4' : 'mb-6'}`}>
            <div className="flex items-center gap-3">
              <Phone className="w-6 h-6 text-primary" />
              <h3 className={`font-bold ${isCompact ? 'text-base' : 'text-lg'} text-foreground`}>Call Status</h3>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
            </div>
            <Badge 
              variant={isActive ? "default" : "secondary"} 
              className={`${isActive ? "bg-active text-active-foreground shadow-lg shadow-active/25" : "bg-inactive text-inactive-foreground"} px-3 py-1 animate-scale-in cursor-pointer hover:scale-105 transition-all duration-200 ${
                isActive ? "hover:bg-destructive hover:text-destructive-foreground" : "hover:bg-active hover:text-active-foreground"
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onCallToggle?.();
              }}
            >
              {isActive ? (
                <>
                  <PhoneOff className="w-3 h-3 mr-2" />
                  Disconnect
                </>
              ) : (
                <>
                  <Phone className="w-3 h-3 mr-2" />
                  Reconnect
                </>
              )}
            </Badge>
          </div>
        </CollapsibleTrigger>
      
        {/* Compact view - always visible */}
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
            <Clock className="w-5 h-5 text-primary" />
            <span className="text-base font-mono font-semibold">{callDuration}</span>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
            <MapPin className="w-5 h-5 text-primary" />
            <span className="text-base">{callerLocation}</span>
          </div>
        </div>

        {/* Expandable content */}
        <CollapsibleContent className="mt-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
              <Calendar className="w-5 h-5 text-primary" />
              <span className="text-base">{callStartTime}</span>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
              <Phone className="w-5 h-5 text-primary" />
              <span className="text-base font-mono">{phoneNumber}</span>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
              <User className="w-5 h-5 text-primary" />
              <span className="text-base capitalize">{callerGender}</span>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors">
              <Globe className="w-5 h-5 text-primary" />
              <span className="text-base">{detectedLanguage}</span>
            </div>
            
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-primary" />
              <Select value={priority} onValueChange={onPriorityChange}>
                <SelectTrigger className="w-full h-10 bg-background border-2 hover:border-primary/50 transition-colors">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                  <SelectItem value="critical">Critical Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};