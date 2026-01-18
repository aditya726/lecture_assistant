from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.ollama_service import ollama_service

router = APIRouter()

class PromptRequest(BaseModel):
    prompt: str

class ChatRequest(BaseModel):
    messages: list

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
