import ollama
import json
import re
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
    
    async def summarize_text(self, text: str, context: str = None) -> dict:
        """Summarize the given text"""
        prompt = f"""Analyze the following text and provide:
1. A concise summary (2-3 sentences)
2. Key points (3-5 bullet points)

Text: {text}
{f'Context: {context}' if context else ''}

Respond in JSON format:
{{
    "summary": "...",
    "key_points": ["point1", "point2", "point3"]
}}"""
        
        response = await self.generate_response(prompt)
        return self._parse_json_response(response)
    
    async def explain_doubt(self, text: str, context: str = None) -> dict:
        """Explain a doubt or concept"""
        prompt = f"""Explain the following doubt/question clearly:

Question/Doubt: {text}
{f'Context: {context}' if context else ''}

Provide:
1. A clear explanation
2. 2-3 practical examples
3. Related concepts to explore

Respond in JSON format:
{{
    "explanation": "...",
    "examples": ["example1", "example2"],
    "related_concepts": ["concept1", "concept2"]
}}"""
        
        response = await self.generate_response(prompt)
        return self._parse_json_response(response)
    
    async def extract_topics(self, text: str) -> dict:
        """Extract main topics and subtopics from text"""
        prompt = f"""Analyze the following text and extract:
1. Main topics (3-5 topics)
2. Subtopics under each main topic

Text: {text}

Respond in JSON format:
{{
    "main_topics": ["topic1", "topic2", "topic3"],
    "subtopics": ["subtopic1", "subtopic2", "subtopic3"]
}}"""
        
        response = await self.generate_response(prompt)
        return self._parse_json_response(response)
    
    async def classify_difficulty(self, text: str) -> dict:
        """Classify the difficulty level of content"""
        prompt = f"""Analyze the following content and classify its difficulty level:

Content: {text}

Classify as: beginner, intermediate, advanced, or expert
Provide reasoning and list prerequisites needed.

Respond in JSON format:
{{
    "difficulty_level": "intermediate",
    "reasoning": "...",
    "prerequisites": ["prerequisite1", "prerequisite2"]
}}"""
        
        response = await self.generate_response(prompt)
        return self._parse_json_response(response)
    
    async def extract_keywords(self, text: str) -> dict:
        """Extract keywords and key phrases from text"""
        prompt = f"""Extract important keywords and key phrases from the following text:

Text: {text}

Identify:
1. Single-word keywords (5-10 words)
2. Key phrases (3-5 phrases)

Respond in JSON format:
{{
    "keywords": ["keyword1", "keyword2", "keyword3"],
    "phrases": ["phrase1", "phrase2", "phrase3"]
}}"""
        
        response = await self.generate_response(prompt)
        return self._parse_json_response(response)
    
    def _parse_json_response(self, response: str) -> dict:
        """Parse JSON from LLM response"""
        try:
            # Try to find JSON in the response
            json_match = re.search(r'\{.*\}', response, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            # If no JSON found, try parsing the whole response
            return json.loads(response)
        except json.JSONDecodeError:
            # If parsing fails, return a structured error
            return {
                "error": "Failed to parse response",
                "raw_response": response
            }

ollama_service = OllamaService()
