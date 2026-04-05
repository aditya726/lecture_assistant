from faster_whisper import WhisperModel
import tempfile
import base64
import os
from typing import Optional
import torch

class TranscriptionService:
    def __init__(self):
        # Check if CUDA is available
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.compute_type = "float16" if self.device == "cuda" else "int8"
        # Load Whisper model (base model for balanced speed/accuracy)
        # Options: tiny, base, small, medium, large
        self.model = None
        self.model_size = "base"
    
    def _load_model(self):
        """Lazy load the model when first needed"""
        if self.model is None:
            print(f"Loading Faster-Whisper {self.model_size} model on {self.device}...")
            self.model = WhisperModel(self.model_size, device=self.device, compute_type=self.compute_type)
    
    def _sync_transcribe(self, audio_path: str, language: Optional[str] = None) -> dict:
        self._load_model()
        # Transcribe
        segments, info = self.model.transcribe(
            audio_path,
            language=language,
            beam_size=5
        )
        
        # Evaluate the generator to get all segments
        segments_list = list(segments)
        full_text = " ".join([seg.text.strip() for seg in segments_list])
        
        return {
            "text": full_text.strip(),
            "language": info.language,
            "segments": [
                {
                    "text": seg.text.strip(),
                    "start": seg.start,
                    "end": seg.end
                }
                for seg in segments_list
            ]
        }

    async def transcribe_audio_file(self, audio_path: str, language: Optional[str] = None) -> dict:
        """
        Transcribe audio file to text
        
        Args:
            audio_path: Path to audio file
            language: Optional language code (e.g., 'en', 'es', 'fr')
        
        Returns:
            dict with 'text', 'language', and 'segments' keys
        """
        import asyncio
        try:
            return await asyncio.to_thread(self._sync_transcribe, audio_path, language)
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
