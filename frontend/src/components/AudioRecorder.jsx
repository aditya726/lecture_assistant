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
    <div className="flex items-center gap-2">
      {!isRecording ? (
        <button
          id="audio-record-btn"
          onClick={startRecording}
          disabled={isProcessing}
          className="ws-toolbar-btn ws-toolbar-btn--record"
          title="Start recording"
        >
          <Mic size={14} />
          <span>Record</span>
        </button>
      ) : (
        <button
          id="audio-stop-btn"
          onClick={stopRecording}
          className="ws-toolbar-btn ws-toolbar-btn--recording"
          title="Stop recording"
        >
          <Square size={14} style={{ fill: 'currentColor' }} />
          <span>{formatTime(recordingTime)}</span>
        </button>
      )}

      {isProcessing && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: 'rgba(148,163,184,0.8)' }}>
          <Loader2 size={13} style={{ animation: 'ws-spin 0.75s linear infinite' }} />
          <span>Transcribing…</span>
        </div>
      )}
    </div>
  );
}
