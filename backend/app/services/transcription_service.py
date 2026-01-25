import whisper
import tempfile
import base64
import os
from typing import Optional
import torch

class TranscriptionService:
    def __init__(self):
        # Check if CUDA is available
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        # Load Whisper model (base model for balanced speed/accuracy)
        # Options: tiny, base, small, medium, large
        self.model = None
        self.model_size = "base"
    
    def _load_model(self):
        """Lazy load the model when first needed"""
        if self.model is None:
            print(f"Loading Whisper {self.model_size} model on {self.device}...")
            self.model = whisper.load_model(self.model_size, device=self.device)
    
    async def transcribe_audio_file(self, audio_path: str, language: Optional[str] = None) -> dict:
        """
        Transcribe audio file to text
        
        Args:
            audio_path: Path to audio file
            language: Optional language code (e.g., 'en', 'es', 'fr')
        
        Returns:
            dict with 'text', 'language', and 'segments' keys
        """
        self._load_model()
        
        try:
            # Transcribe
            result = self.model.transcribe(
                audio_path,
                language=language,
                fp16=False if self.device == "cpu" else True
            )
            
            return {
                "text": result["text"].strip(),
                "language": result["language"],
                "segments": [
                    {
                        "text": seg["text"].strip(),
                        "start": seg["start"],
                        "end": seg["end"]
                    }
                    for seg in result.get("segments", [])
                ]
            }
        except Exception as e:
            raise Exception(f"Transcription error: {str(e)}")
    
    async def transcribe_audio_base64(self, audio_base64: str, language: Optional[str] = None) -> dict:
        """
        Transcribe base64 encoded audio to text
        
        Args:
            audio_base64: Base64 encoded audio data
            language: Optional language code
        
        Returns:
            dict with transcription results
        """
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
            # Decode base64 and write to temp file
            audio_data = base64.b64decode(audio_base64)
            temp_file.write(audio_data)
            temp_path = temp_file.name
        
        try:
            # Transcribe
            result = await self.transcribe_audio_file(temp_path, language)
            return result
        finally:
            # Clean up temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)
    
    async def transcribe_audio_bytes(self, audio_bytes: bytes, language: Optional[str] = None) -> dict:
        """
        Transcribe audio bytes to text
        
        Args:
            audio_bytes: Audio data as bytes
            language: Optional language code
        
        Returns:
            dict with transcription results
        """
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as temp_file:
            temp_file.write(audio_bytes)
            temp_path = temp_file.name
        
        try:
            # Transcribe
            result = await self.transcribe_audio_file(temp_path, language)
            return result
        finally:
            # Clean up temp file
            if os.path.exists(temp_path):
                os.remove(temp_path)

# Global instance
transcription_service = TranscriptionService()
