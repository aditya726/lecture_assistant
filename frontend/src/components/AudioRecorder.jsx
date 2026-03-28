import { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Loader2, Square } from 'lucide-react';
import { API_BASE_URL } from '../config/apiBaseUrl';

export default function AudioRecorder({ onTranscriptionComplete, onError }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/wav' });
        setAudioBlob(audioBlob);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());

        // Auto-transcribe
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      if (onError) {
        onError('Could not access microphone. Please check permissions.');
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  const transcribeAudio = async (blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append('audio_file', blob, 'recording.wav');

      const response = await fetch(`${API_BASE_URL}/ai/transcribe-audio`, {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Transcription failed');
      }

      const data = await response.json();

      if (onTranscriptionComplete) {
        onTranscriptionComplete(data.transcription, data);
      }
    } catch (error) {
      console.error('Transcription error:', error);
      if (onError) {
        onError('Failed to transcribe audio. Please try again.');
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 text-foreground dark:text-white">
      {!isRecording ? (
        <button
          onClick={startRecording}
          disabled={isProcessing}
          className="modern-button flex items-center gap-2 px-5 py-2.5 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm font-semibold"
          title="Start recording"
        >
          <Mic className="w-4 h-4" />
          <span className="text-sm">Record</span>
        </button>
      ) : (
        <button
          onClick={stopRecording}
          className="modern-button flex items-center gap-2 px-5 py-2.5 rounded-full bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 transition-all animate-pulse shadow-sm font-semibold"
          title="Stop recording"
        >
          <Square className="w-4 h-4 fill-current" />
          <span className="text-sm">{formatTime(recordingTime)}</span>
        </button>
      )}

      {isProcessing && (
        <div className="flex items-center gap-2 text-foreground dark:text-white/80">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Transcribing...</span>
        </div>
      )}
    </div>
  );
}
