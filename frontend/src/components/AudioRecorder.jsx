import { useEffect, useRef, useState } from "react";
import { Loader2, Mic, Square } from "lucide-react";

import { API_BASE_URL } from "../config/apiBaseUrl";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";

export default function AudioRecorder({ onTranscriptionComplete, onError }) {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && isRecording) mediaRecorderRef.current.stop();
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/wav" });
        stream.getTracks().forEach((track) => track.stop());
        await transcribeAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (error) {
      onError?.("Microphone access is blocked. Please allow microphone permissions.");
    }
  };

  const stopRecording = () => {
    if (!mediaRecorderRef.current || !isRecording) return;
    mediaRecorderRef.current.stop();
    setIsRecording(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const transcribeAudio = async (blob) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("audio_file", blob, "recording.wav");

      const response = await fetch(`${API_BASE_URL}/ai/transcribe-audio`, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) throw new Error("Transcription failed");

      const data = await response.json();
      onTranscriptionComplete?.(data.transcription, data);
    } catch (error) {
      onError?.("Failed to transcribe audio. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex items-center gap-2">
      {!isRecording ? (
        <Button type="button" variant="secondary" onClick={startRecording} disabled={isProcessing}>
          <Mic className="mr-2 h-4 w-4" />
          Record
        </Button>
      ) : (
        <Button type="button" variant="destructive" onClick={stopRecording}>
          <Square className="mr-2 h-3.5 w-3.5 fill-current" />
          {formatTime(recordingTime)}
        </Button>
      )}

      {isProcessing && (
        <Badge variant="outline" className="gap-1">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Transcribing
        </Badge>
      )}
    </div>
  );
}
