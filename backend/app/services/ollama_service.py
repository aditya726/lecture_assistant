import ollama
from app.core.config import settings

class OllamaService:
    def __init__(self):
        self.client = ollama.Client(host=settings.OLLAMA_HOST)
        self.model = settings.OLLAMA_MODEL
    
    async def generate_response(self, prompt: str) -> str:
        """Generate AI response using Ollama"""
        try:
            response = self.client.generate(
                model=self.model,
                prompt=prompt
            )
            return response['response']
        except Exception as e:
            raise Exception(f"Ollama error: {str(e)}")
    
    async def chat(self, messages: list) -> str:
        """Chat with AI using conversation history"""
        try:
            response = self.client.chat(
                model=self.model,
                messages=messages
            )
            return response['message']['content']
        except Exception as e:
            raise Exception(f"Ollama chat error: {str(e)}")

ollama_service = OllamaService()
