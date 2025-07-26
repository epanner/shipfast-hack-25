import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { 
  Phone, 
  PhoneCall, 
  Clock, 
  MapPin, 
  User, 
  Power,
  PhoneIncoming,
  AlertTriangle,
  Bot,
  Upload,
  FileAudio,
  Loader2
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface CallRecord {
  id: string;
  phoneNumber: string;
  callerLocation: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  duration: string;
  status: 'completed' | 'transferred' | 'dropped';
  timestamp: string;
  callerGender: 'male' | 'female' | 'unidentified';
  detectedLanguage: string;
  caseSummary: string;
}

export const AgentDashboard = () => {
  const [isOnline, setIsOnline] = useState(false);
  const [incomingCall, setIncomingCall] = useState<boolean>(false);
  const [waitingTime, setWaitingTime] = useState<number>(0);
  
  // Audio upload states
  const [uploadingAudio, setUploadingAudio] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [audioError, setAudioError] = useState<string>('');
  const [audioResults, setAudioResults] = useState<any>(null);

  const navigate = useNavigate();

  const [previousCalls] = useState<CallRecord[]>([
    {
      id: "1",
      phoneNumber: "+1 (555) 123-4567",
      callerLocation: "Highway 95, Exit 12",
      priority: "critical",
      duration: "00:08:34",
      status: "completed",
      timestamp: "14:23:01",
      callerGender: "female",
      detectedLanguage: "Spanish",
      caseSummary: "Vehicle rollover accident with trapped occupants and fire risk. Multi-department response dispatched."
    },
    {
      id: "2",
      phoneNumber: "+1 (555) 987-6543",
      callerLocation: "Downtown Mall, 3rd Floor",
      priority: "high",
      duration: "00:12:56",
      status: "transferred",
      timestamp: "13:45:22",
      callerGender: "male",
      detectedLanguage: "English",
      caseSummary: "Medical emergency - person collapsed in food court. Ambulance dispatched, transferred to paramedics."
    },
    {
      id: "3",
      phoneNumber: "+1 (555) 456-7890",
      callerLocation: "Residential Area, Oak Street",
      priority: "medium",
      duration: "00:04:12",
      status: "completed",
      timestamp: "12:30:15",
      callerGender: "unidentified",
      detectedLanguage: "French",
      caseSummary: "Suspicious activity report - resolved as false alarm after police verification."
    }
  ]);

  const handleGoOnline = () => {
    setIsOnline(true);
    // Simulate incoming call after going online
    setTimeout(() => {
      setIncomingCall(true);
      setWaitingTime(0); // Reset waiting time when new call comes in
    }, 3000);
  };

  const handleGoOffline = () => {
    setIsOnline(false);
    setIncomingCall(false);
    setWaitingTime(0);
  };

  const handleAnswerCall = () => {
    setIncomingCall(false);
    setWaitingTime(0);
    
    // Navigate to call page with audio results if available
    navigate('/call', {
      state: {
        callData: {
          phoneNumber: '+1 (555) 123-4567',
          language: 'Spanish',
          priority: 'High',
          audioResults: audioResults, // Pass the processed audio data
          transcript: audioResults?.transcript || '',
          summary: audioResults?.summary || [],
          target_language: audioResults?.target_language || 'spanish'
        }
      }
    });
  };

  // Timer for waiting time
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (incomingCall) {
      interval = setInterval(() => {
        setWaitingTime(prev => prev + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [incomingCall]);

  const formatWaitingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-emergency text-emergency-foreground';
      case 'high': return 'bg-warning text-warning-foreground';
      case 'medium': return 'bg-info text-info-foreground';
      case 'low': return 'bg-success text-success-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-success text-success-foreground';
      case 'transferred': return 'bg-warning text-warning-foreground';
      case 'dropped': return 'bg-emergency text-emergency-foreground';
      default: return 'bg-muted text-muted-foreground';
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
      formData.append('target_language', 'spanish'); // Based on incoming call language

      const response = await fetch('http://localhost:8000/process-audio', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setAudioResults(result);
      
      // Clear the file after successful processing
      setAudioFile(null);
      
    } catch (error) {
      setAudioError(`Error processing audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploadingAudio(false);
    }
  };

  return (
    <div className="h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4 flex flex-col">
      <div className="w-full flex-1 flex flex-col">
        <header className="mb-6">
          <div className="flex items-center justify-between bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 backdrop-blur-sm border rounded-xl p-6 shadow-lg">
            <div>
              <h1 className="text-4xl font-bold text-white">Emergency Agent Dashboard</h1>
              <p className="text-blue-100 mt-1">Emergency call center operations</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-400 animate-pulse shadow-lg shadow-green-400/50' : 'bg-red-400'}`}></div>
                <span className={`text-sm font-medium text-white`}>
                  {isOnline ? 'Online' : 'Offline'}
                </span>
              </div>
              <Button
                onClick={isOnline ? handleGoOffline : handleGoOnline}
                variant="ghost"
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 border border-white/20 shadow-sm text-white hover:text-white"
              >
                <Power className="w-4 h-4" />
                {isOnline ? 'Go Offline' : 'Go Online'}
              </Button>
            </div>
          </div>
        </header>

        {/* Incoming Call Alert */}
        {incomingCall && (
          <Card className="mb-6 border-emergency bg-emergency/5">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emergency text-emergency-foreground rounded-full flex items-center justify-center animate-pulse">
                    <PhoneIncoming className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">Incoming Emergency Call</h3>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>+1 (555) 123-4567 • Spanish • High Priority</span>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>Waiting: {formatWaitingTime(waitingTime)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Bot className="w-4 h-4 text-info" />
                      <span className="text-sm text-info">AI Agent currently assisting</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {/* Audio Upload Section */}
                  <div className="flex flex-col items-center gap-2">
                    <Input
                      id="dashboard-audio-file"
                      type="file"
                      accept=".mp3,.wav,.m4a,.ogg,.flac,audio/mpeg,audio/wav,audio/mp4,audio/ogg,audio/flac"
                      onChange={handleAudioFileChange}
                      className="hidden"
                    />
                    <label htmlFor="dashboard-audio-file">
                      <Button
                        variant="outline"
                        size="sm"
                        className="cursor-pointer"
                        disabled={uploadingAudio}
                        asChild
                      >
                        <span>
                          {uploadingAudio ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              Upload Audio
                            </>
                          )}
                        </span>
                      </Button>
                    </label>
                    {audioFile && (
                      <Button
                        onClick={processAudioFile}
                        size="sm"
                        disabled={uploadingAudio}
                        className="text-xs"
                      >
                        <FileAudio className="w-3 h-3 mr-1" />
                        Process
                      </Button>
                    )}
                    {audioError && (
                      <span className="text-xs text-red-500">{audioError}</span>
                    )}
                    {audioResults && (
                      <div className="text-xs text-green-600 max-w-xs">
                        ✓ Audio processed successfully
                      </div>
                    )}
                  </div>
                  
                  <Button onClick={handleAnswerCall} className="bg-active hover:bg-active/90">
                    <Phone className="w-4 h-4 mr-2" />
                    Take Over Call
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Status Cards */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <PhoneCall className="w-5 h-5" />
                Today's Calls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground mb-2">12</div>
              <p className="text-sm text-muted-foreground">3 critical, 5 high priority</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Online Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground mb-2">06:42:30</div>
              <p className="text-sm text-muted-foreground">Average call: 8 minutes</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Response Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground mb-2">2.3s</div>
              <p className="text-sm text-muted-foreground">Below 3s target</p>
            </CardContent>
          </Card>
        </div>

        {/* Previous Calls */}
        <Card className="mt-6 flex-1 flex flex-col">
          <CardHeader>
            <CardTitle>Recent Calls</CardTitle>
          </CardHeader>
          <CardContent className="flex-1">
            <ScrollArea className="h-full">
              <div className="space-y-3">
                {previousCalls.map((call) => (
                  <div
                    key={call.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => navigate('/call')}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                        <Phone className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{call.phoneNumber}</span>
                          <Badge variant="outline" className={getPriorityColor(call.priority)}>
                            {call.priority}
                          </Badge>
                          <Badge variant="outline" className={getStatusColor(call.status)}>
                            {call.status}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {call.callerLocation}
                          </div>
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {call.callerGender}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {call.duration}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1 italic">{call.caseSummary}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">{call.timestamp}</div>
                      <div className="text-sm text-muted-foreground">{call.detectedLanguage}</div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};