from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional
from app.services.ollama_service import ollama_service
from app.schemas.llm import (
    LLMRequest, LLMResponse, TaskType, InputType,
    SummarizationResponse, DoubtExplanationResponse,
    TopicExtractionResponse, DifficultyClassificationResponse,
    KeywordExtractionResponse
)
import base64

router = APIRouter()

class PromptRequest(BaseModel):
    prompt: str

class ChatRequest(BaseModel):
    messages: list

class SummarizeRequest(BaseModel):
    text: str
    context: Optional[str] = None

class ExplainRequest(BaseModel):
    text: str
    context: Optional[str] = None

class TextRequest(BaseModel):
    text: str

@router.post("/generate")
async def generate(request: PromptRequest):
    """Generate AI response"""
    try:
        response = await ollama_service.generate_response(request.prompt)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat")
async def chat(request: ChatRequest):
    """Chat with AI"""
    try:
        response = await ollama_service.chat(request.messages)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/process", response_model=LLMResponse)
async def process_with_llm(request: LLMRequest):
    """
    Process text/audio with LLM for various tasks:
    - Summarization
    - Doubt explanation
    - Topic extraction
    - Difficulty classification
    - Keyword extraction
    
    Supports both text and audio input (audio requires base64 encoded string)
    """
    try:
        # Get input text
        if request.input_type == InputType.TEXT:
            if not request.text:
                raise HTTPException(status_code=400, detail="Text input is required when input_type is 'text'")
            input_text = request.text
        elif request.input_type == InputType.AUDIO:
            if not request.audio_base64:
                raise HTTPException(status_code=400, detail="Audio input is required when input_type is 'audio'")
            # Note: For audio, you would need to implement audio transcription here
            # For now, returning an error message
            raise HTTPException(
                status_code=501, 
                detail="Audio transcription not yet implemented. Please use a speech-to-text service like Whisper first."
            )
        else:
            raise HTTPException(status_code=400, detail="Invalid input type")
        
        # Process based on task type
        result = {}
        if request.task == TaskType.SUMMARIZATION:
            result = await ollama_service.summarize_text(input_text, request.context)
        
        elif request.task == TaskType.DOUBT_EXPLANATION:
            result = await ollama_service.explain_doubt(input_text, request.context)
        
        elif request.task == TaskType.TOPIC_EXTRACTION:
            result = await ollama_service.extract_topics(input_text)
        
        elif request.task == TaskType.DIFFICULTY_CLASSIFICATION:
            result = await ollama_service.classify_difficulty(input_text)
        
        elif request.task == TaskType.KEYWORD_EXTRACTION:
            result = await ollama_service.extract_keywords(input_text)
        
        else:
            raise HTTPException(status_code=400, detail="Invalid task type")
        
        return LLMResponse(
            task=request.task,
            result=result,
            raw_output=str(result)
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing request: {str(e)}")

@router.post("/summarize")
async def summarize(request: SummarizeRequest):
    """Summarize text"""
    try:
        result = await ollama_service.summarize_text(request.text, request.context)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/explain-doubt")
async def explain_doubt(request: ExplainRequest):
    """Explain a doubt or question"""
    try:
        result = await ollama_service.explain_doubt(request.text, request.context)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/extract-topics")
async def extract_topics(request: TextRequest):
    """Extract topics from text"""
    try:
        result = await ollama_service.extract_topics(request.text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/classify-difficulty")
async def classify_difficulty(request: TextRequest):
    """Classify difficulty level of content"""
    try:
        result = await ollama_service.classify_difficulty(request.text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/extract-keywords")
async def extract_keywords(request: TextRequest):
    """Extract keywords from text"""
    try:
        result = await ollama_service.extract_keywords(request.text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
