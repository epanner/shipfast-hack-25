import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
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
  MessageSquare,
  Upload,
  FileAudio,
  Loader2
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
  
  // Audio upload states
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioError, setAudioError] = useState<string>('');
  const [audioResults, setAudioResults] = useState<any>(null);

  // AI recommendations state
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

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

  // Audio upload handlers
  const handleAudioFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const audioExtensions = ['.mp3', '.wav', '.m4a', '.ogg', '.flac'];
    const isAudioExtension = audioExtensions.includes(fileExtension);
    const isAudioMimeType = file.type.startsWith('audio/') || file.type === '';
    
    if (!isAudioExtension && !isAudioMimeType) {
      setAudioError('Invalid file type. Please select MP3, WAV, M4A, OGG, or FLAC');
      setAudioFile(null);
      return;
    }

    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
      setAudioError('File size must be less than 50MB');
      setAudioFile(null);
      return;
    }

    setAudioFile(file);
    setAudioError('');
  };

  const processAudioFile = async () => {
    if (!audioFile) return;

    setUploadingAudio(true);
    setAudioError('');

    try {
      const formData = new FormData();
      formData.append('audio_file', audioFile);
      formData.append('target_language', callData?.target_language || 'french');

      const response = await fetch('http://localhost:8000/process-audio', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setAudioResults(result);
      
      // Fetch AI recommendations based on the transcript
      await fetchAIRecommendations(result.transcript, result.summary);
      
      // Clear the file after successful processing
      setAudioFile(null);
      
    } catch (error) {
      setAudioError(`Error processing audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploadingAudio(false);
    }
  };

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
      setAiRecommendations(result.recommendations);
      
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

            {/* AI Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle>AI Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingRecommendations ? (
                  <div className="text-center">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {aiRecommendations.map((recommendation, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <div>
                          <p className="text-sm font-medium">{recommendation.title}</p>
                          <p className="text-sm">{recommendation.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Audio Upload Section */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileAudio className="h-5 w-5" />
                  Upload Audio Evidence
                </CardTitle>
                <CardDescription>Upload additional audio files during the call</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
                    <Upload className="mx-auto h-8 w-8 text-gray-400" />
                    <div className="mt-2">
                      <label htmlFor="emergency-audio-file" className="cursor-pointer">
                        <span className="text-sm font-medium text-gray-900">
                          {audioFile ? audioFile.name : 'Click to upload audio file'}
                        </span>
                        <span className="block text-xs text-gray-500 mt-1">
                          MP3, WAV, M4A, OGG, FLAC up to 50MB
                        </span>
                      </label>
                      <Input
                        id="emergency-audio-file"
                        type="file"
                        accept=".mp3,.wav,.m4a,.ogg,.flac,audio/mpeg,audio/wav,audio/mp4,audio/ogg,audio/flac"
                        onChange={handleAudioFileChange}
                        className="hidden"
                      />
                    </div>
                  </div>
                  
                  {audioFile && (
                    <p className="text-sm text-gray-600 mt-2">
                      Selected: {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                  
                  {audioError && (
                    <Alert className="mt-2">
                      <XCircle className="h-4 w-4" />
                      <AlertDescription className="text-red-600">
                        {audioError}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>

                <Button 
                  onClick={processAudioFile} 
                  disabled={!audioFile || uploadingAudio}
                  className="w-full"
                >
                  {uploadingAudio ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing Audio...
                    </>
                  ) : (
                    <>
                      <FileAudio className="mr-2 h-4 w-4" />
                      Process Audio File
                    </>
                  )}
                </Button>

                {audioResults && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2">Audio Processing Results:</h4>
                    <div className="text-sm space-y-1">
                      <p><strong>Transcript:</strong> {audioResults.transcript}</p>
                      {audioResults.summary && (
                        <div>
                          <strong>Summary:</strong>
                          <ul className="list-disc list-inside ml-2">
                            {audioResults.summary.map((point: string, index: number) => (
                              <li key={index}>{point}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EmergencyCallModal;