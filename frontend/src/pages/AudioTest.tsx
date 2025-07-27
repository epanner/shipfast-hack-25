import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Mic, FileAudio, Globe, MessageSquare, Phone } from 'lucide-react';
import EmergencyCallModal from '@/components/EmergencyCallModal';

const AudioTest = () => {
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [sessionId, setSessionId] = useState<string>('');
  const [targetLanguage, setTargetLanguage] = useState<string>('french');
  const [textToTranslate, setTextToTranslate] = useState<string>('');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [showCallModal, setShowCallModal] = useState<boolean>(false);
  const [callData, setCallData] = useState<any>(null);

  const API_BASE = 'https://api-shipfast2025.naurzalinov.me';
  
  // Debug: Log when component mounts
  React.useEffect(() => {
    console.log('AudioTest component mounted');
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log('File input changed:', e.target.files);
    const file = e.target.files?.[0];
    
    if (!file) {
      console.log('No file selected');
      return;
    }
    
    console.log('File details:', {
      name: file.name,
      type: file.type,
      size: file.size,
      lastModified: file.lastModified
    });
    
    // Validate file type - be more permissive
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const audioExtensions = ['.mp3', '.wav', '.m4a', '.ogg', '.flac'];
    const isAudioExtension = audioExtensions.includes(fileExtension);
    const isAudioMimeType = file.type.startsWith('audio/') || file.type === '';
    
    if (!isAudioExtension && !isAudioMimeType) {
      setError(`Invalid file type. Selected: ${file.type || 'unknown'}, Extension: ${fileExtension}. Please select: MP3, WAV, M4A, OGG, FLAC`);
      setAudioFile(null);
      return;
    }
    
    // Validate file size (50MB max)
    const maxSize = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > maxSize) {
      setError('File size must be less than 50MB');
      setAudioFile(null);
      return;
    }
    
    setAudioFile(file);
    setError('');
    console.log(`✅ Audio file accepted: ${file.name} (${file.type || 'unknown type'}), Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);
  };

  const processAudio = async () => {
    if (!audioFile) {
      setError('Please select an audio file');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('audio_file', audioFile);
      if (sessionId) formData.append('session_id', sessionId);
      formData.append('target_language', targetLanguage);

      const response = await fetch(`${API_BASE}/process-audio`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setResults(result);
      
      // Trigger call simulation if processing was successful
      if (result.transcript && result.summary) {
        setCallData({
          transcript: result.transcript,
          summary: result.summary,
          target_language: result.target_language,
          audioFile: audioFile
        });
        setShowCallModal(true);
      }
    } catch (err) {
      setError(`Error processing audio: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const transcribeOnly = async () => {
    if (!audioFile) {
      setError('Please select an audio file');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const formData = new FormData();
      formData.append('audio_file', audioFile);

      const response = await fetch(`${API_BASE}/transcribe-only`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setResults({ transcript: result.transcript, type: 'transcription' });
    } catch (err) {
      setError(`Error transcribing audio: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const translateText = async () => {
    if (!textToTranslate.trim()) {
      setError('Please enter text to translate');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE}/translate-text?text=${encodeURIComponent(textToTranslate)}&target_language=${targetLanguage}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setResults({ ...result, type: 'translation' });
    } catch (err) {
      setError(`Error translating text: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const testBackendConnection = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE}/test-backend`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setResults({ ...result, type: 'backend_test' });
    } catch (err) {
      setError(`Backend connection error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const createTestSession = async () => {
    setLoading(true);
    setError('');
    
    try {
      const sessionData = {
        fullname: "Test User",
        phone_number: "+1234567890",
        language: "english",
        location: "Test Location",
        sex: "male"
      };

      const response = await fetch(`${API_BASE}/start-call`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sessionData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setSessionId(result.session_id.toString());
      setResults({ ...result, type: 'session' });
    } catch (err) {
      setError(`Error creating session: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Audio Processing Test UI</h1>
        <p className="text-gray-600">Test your backend audio processing endpoints</p>
      </div>

      <div className="grid gap-6">
        {/* Audio Processing Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileAudio className="h-5 w-5" />
              Audio Processing
            </CardTitle>
            <CardDescription>
              Upload an audio file to transcribe and summarize
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="audio-file">Audio File (MP3, WAV, M4A)</Label>
              <div className="mt-1">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <Upload className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="mt-4">
                    <label htmlFor="audio-file" className="cursor-pointer">
                      <span className="mt-2 block text-sm font-medium text-gray-900">
                        {audioFile ? audioFile.name : 'Click to upload or drag and drop'}
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">
                        MP3, WAV, M4A, OGG, FLAC up to 50MB
                      </span>
                    </label>
                    <Input
                      id="audio-file"
                      type="file"
                      accept=".mp3,.wav,.m4a,.ogg,.flac,audio/mpeg,audio/wav,audio/mp4,audio/ogg,audio/flac"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>
              {audioFile && (
                <p className="text-sm text-gray-600 mt-1">
                  Selected: {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="session-id">Session ID (optional)</Label>
              <Input
                id="session-id"
                type="number"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                placeholder="Leave empty for standalone processing"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="target-language">Target Language</Label>
              <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="french">French</SelectItem>
                  <SelectItem value="spanish">Spanish</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="german">German</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button onClick={processAudio} disabled={loading} className="flex-1">
                <Mic className="h-4 w-4 mr-2" />
                {loading ? 'Processing...' : 'Process Audio (Full)'}
              </Button>
              <Button onClick={transcribeOnly} disabled={loading} variant="outline" className="flex-1">
                <Upload className="h-4 w-4 mr-2" />
                {loading ? 'Processing...' : 'Transcribe Only'}
              </Button>
            </div>
            
            {results && results.transcript && (
              <Button 
                onClick={() => setShowCallModal(true)} 
                variant="secondary" 
                className="w-full mt-2"
              >
                <Phone className="h-4 w-4 mr-2" />
                Simulate Emergency Call
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Text Translation Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Text Translation
            </CardTitle>
            <CardDescription>
              Translate text using Claude
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="text-translate">Text to Translate</Label>
              <Textarea
                id="text-translate"
                value={textToTranslate}
                onChange={(e) => setTextToTranslate(e.target.value)}
                placeholder="Enter text to translate..."
                className="mt-1"
              />
            </div>

            <Button onClick={translateText} disabled={loading} className="w-full">
              <MessageSquare className="h-4 w-4 mr-2" />
              {loading ? 'Translating...' : 'Translate Text'}
            </Button>
          </CardContent>
        </Card>

        {/* Backend Connection Test */}
        <Card>
          <CardHeader>
            <CardTitle>Backend Connection Test</CardTitle>
            <CardDescription>
              Test if the backend is responding
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={testBackendConnection} disabled={loading} className="w-full" variant="outline">
              {loading ? 'Testing...' : 'Test Backend Connection'}
            </Button>
          </CardContent>
        </Card>

        {/* Session Management */}
        <Card>
          <CardHeader>
            <CardTitle>Session Management</CardTitle>
            <CardDescription>
              Create a test emergency call session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={createTestSession} disabled={loading} className="w-full">
              {loading ? 'Creating...' : 'Create Test Session'}
            </Button>
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Results Display */}
        {results && (
          <Card>
            <CardHeader>
              <CardTitle>Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {results.type === 'backend_test' && (
                  <div>
                    <h3 className="font-semibold">Backend Connection ✅</h3>
                    <p><strong>Status:</strong> {results.status}</p>
                    <p><strong>Timestamp:</strong> {results.timestamp}</p>
                  </div>
                )}

                {results.type === 'session' && (
                  <div>
                    <h3 className="font-semibold">Session Created</h3>
                    <p><strong>Session ID:</strong> {results.session_id}</p>
                    <p><strong>Agent:</strong> {results.agent_name}</p>
                    <p><strong>Caller:</strong> {results.caller_name}</p>
                  </div>
                )}

                {results.type === 'translation' && (
                  <div>
                    <h3 className="font-semibold">Translation Result</h3>
                    <p><strong>Original:</strong> {results.original}</p>
                    <p><strong>Translated:</strong> {Array.isArray(results.translated) ? results.translated.join(', ') : results.translated}</p>
                    <p><strong>Target Language:</strong> {results.target_language}</p>
                  </div>
                )}

                {results.transcript && (
                  <div>
                    <h3 className="font-semibold">Transcript</h3>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p>{results.transcript}</p>
                    </div>
                  </div>
                )}

                {results.summary && (
                  <div>
                    <h3 className="font-semibold">Summary ({results.target_language})</h3>
                    <div className="bg-blue-50 p-3 rounded-md">
                      <ul className="list-disc list-inside space-y-1">
                        {results.summary.map((point: string, index: number) => (
                          <li key={index}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {results.message && (
                  <div>
                    <h3 className="font-semibold">Status</h3>
                    <p className="text-green-600">{results.message}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="mt-8 p-4 bg-gray-50 rounded-md">
        <h3 className="font-semibold mb-2">Backend Status</h3>
        <p className="text-sm text-gray-600">
          Make sure your backend is running at: <code className="bg-white px-1 rounded">http://localhost:8000</code>
        </p>
        <p className="text-sm text-gray-600 mt-1">
          Start with: <code className="bg-white px-1 rounded">cd emergency-call-backend && python main.py</code>
        </p>
      </div>

      {/* Emergency Call Simulation Modal */}
      <EmergencyCallModal
        isOpen={showCallModal}
        onClose={() => setShowCallModal(false)}
        callData={callData}
      />
    </div>
  );
};

export default AudioTest;