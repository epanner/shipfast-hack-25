import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Phone, 
  PhoneCall, 
  Clock, 
  MapPin, 
  User, 
  AlertTriangle, 
  Heart, 
  Truck, 
  Shield,
  CheckCircle,
  XCircle,
  Volume2,
  MessageSquare
} from 'lucide-react';

interface EmergencyCallData {
  transcript: string;
  summary: string[];
  target_language: string;
  audioFile?: File;
}

interface EmergencyCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  callData: EmergencyCallData | null;
}

const EmergencyCallModal: React.FC<EmergencyCallModalProps> = ({ isOpen, onClose, callData }) => {
  const [callStatus, setCallStatus] = useState<'incoming' | 'connected' | 'ended'>('incoming');
  const [callDuration, setCallDuration] = useState(0);
  const [emergencyType, setEmergencyType] = useState<string>('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high' | 'critical'>('medium');
  const [dispatchedServices, setDispatchedServices] = useState<string[]>([]);

  // Mock caller data
  const callerInfo = {
    name: "Unknown Caller",
    phone: "+33 6 12 34 56 78",
    location: "Paris 15ème, Rue de Vaugirard",
    coordinates: "48.8566° N, 2.3522° E"
  };

  // Analyze emergency type from transcript
  useEffect(() => {
    if (callData?.transcript) {
      const transcript = callData.transcript.toLowerCase();
      
      if (transcript.includes('heart') || transcript.includes('chest') || transcript.includes('cardiac')) {
        setEmergencyType('Medical - Cardiac');
        setPriority('critical');
      } else if (transcript.includes('fire') || transcript.includes('smoke') || transcript.includes('burning')) {
        setEmergencyType('Fire Emergency');
        setPriority('high');
      } else if (transcript.includes('accident') || transcript.includes('crash') || transcript.includes('injured')) {
        setEmergencyType('Traffic Accident');
        setPriority('high');
      } else if (transcript.includes('help') || transcript.includes('emergency')) {
        setEmergencyType('General Emergency');
        setPriority('medium');
      } else {
        setEmergencyType('Unknown Emergency');
        setPriority('medium');
      }
    }
  }, [callData]);

  // Call timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callStatus === 'connected') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = () => {
    setCallStatus('connected');
  };

  const handleHangup = () => {
    setCallStatus('ended');
    setTimeout(() => onClose(), 2000);
  };

  const dispatchService = (service: string) => {
    if (!dispatchedServices.includes(service)) {
      setDispatchedServices([...dispatchedServices, service]);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  if (!callData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {callStatus === 'incoming' && <Phone className="h-5 w-5 text-green-600 animate-bounce" />}
            {callStatus === 'connected' && <PhoneCall className="h-5 w-5 text-blue-600" />}
            {callStatus === 'ended' && <XCircle className="h-5 w-5 text-red-600" />}
            
            {callStatus === 'incoming' && 'Incoming Emergency Call'}
            {callStatus === 'connected' && 'Emergency Call Active'}
            {callStatus === 'ended' && 'Call Ended'}
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Call Info & Controls */}
          <div className="space-y-4">
            {/* Call Status */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  Call Status
                  {callStatus === 'connected' && (
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4" />
                      {formatTime(callDuration)}
                    </div>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    <span className="font-medium">{callerInfo.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span className="text-sm">{callerInfo.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span className="text-sm">{callerInfo.location}</span>
                  </div>
                </div>

                {/* Call Controls */}
                <div className="flex gap-2 mt-4">
                  {callStatus === 'incoming' && (
                    <>
                      <Button onClick={handleAnswer} className="flex-1" size="lg">
                        <PhoneCall className="h-4 w-4 mr-2" />
                        Answer Call
                      </Button>
                    </>
                  )}
                  {callStatus === 'connected' && (
                    <Button onClick={handleHangup} variant="destructive" className="flex-1" size="lg">
                      <XCircle className="h-4 w-4 mr-2" />
                      End Call
                    </Button>
                  )}
                  {callStatus === 'ended' && (
                    <div className="w-full text-center text-gray-500">
                      Call ended. Closing...
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Emergency Assessment */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Emergency Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span>Emergency Type:</span>
                  <Badge variant="outline">{emergencyType}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Priority Level:</span>
                  <Badge variant={getPriorityColor(priority) as any}>
                    {priority.toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Language:</span>
                  <Badge variant="secondary">{callData.target_language}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Services Dispatch */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Emergency Services
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant={dispatchedServices.includes('Ambulance') ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => dispatchService('Ambulance')}
                    className="flex items-center gap-2"
                  >
                    <Heart className="h-4 w-4" />
                    Ambulance
                    {dispatchedServices.includes('Ambulance') && <CheckCircle className="h-3 w-3" />}
                  </Button>
                  <Button 
                    variant={dispatchedServices.includes('Fire') ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => dispatchService('Fire')}
                    className="flex items-center gap-2"
                  >
                    <AlertTriangle className="h-4 w-4" />
                    Fire Dept
                    {dispatchedServices.includes('Fire') && <CheckCircle className="h-3 w-3" />}
                  </Button>
                  <Button 
                    variant={dispatchedServices.includes('Police') ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => dispatchService('Police')}
                    className="flex items-center gap-2"
                  >
                    <Shield className="h-4 w-4" />
                    Police
                    {dispatchedServices.includes('Police') && <CheckCircle className="h-3 w-3" />}
                  </Button>
                  <Button 
                    variant={dispatchedServices.includes('Rescue') ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => dispatchService('Rescue')}
                    className="flex items-center gap-2"
                  >
                    <Truck className="h-4 w-4" />
                    Rescue
                    {dispatchedServices.includes('Rescue') && <CheckCircle className="h-3 w-3" />}
                  </Button>
                </div>
                
                {dispatchedServices.length > 0 && (
                  <Alert className="mt-3">
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      Dispatched: {dispatchedServices.join(', ')}
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Transcript & AI Analysis */}
          <div className="space-y-4">
            {/* Live Transcript */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Volume2 className="h-5 w-5" />
                  Call Transcript
                </CardTitle>
                <CardDescription>Real-time speech-to-text transcription</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-50 p-4 rounded-lg min-h-[120px] max-h-[200px] overflow-y-auto">
                  <p className="text-sm leading-relaxed">
                    {callStatus === 'connected' ? callData.transcript : 
                     callStatus === 'incoming' ? 'Waiting to answer call...' : 
                     callData.transcript}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* AI Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  AI Analysis & Summary
                </CardTitle>
                <CardDescription>Key points extracted by AI</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {callData.summary.map((point, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <p className="text-sm">{point}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* AI Suggestions */}
            <Card>
              <CardHeader>
                <CardTitle>AI Suggestions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Priority: {priority === 'critical' ? 'IMMEDIATE medical response required' :
                               priority === 'high' ? 'Urgent emergency services needed' :
                               'Standard emergency response protocol'}
                    </AlertDescription>
                  </Alert>
                  
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>• Verify caller location accuracy</p>
                    <p>• Assess if additional services needed</p>
                    <p>• Keep caller calm and on the line</p>
                    {priority === 'critical' && <p>• <strong>Immediate dispatch required</strong></p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmergencyCallModal;