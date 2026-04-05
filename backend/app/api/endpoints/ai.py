from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional
from app.services.ollama_service import ollama_service
from app.services.transcription_service import transcription_service
from app.services.file_processing_service import file_processing_service
from app.services.ocr_service import ocr_service
from app.schemas.llm import (
    LLMRequest, LLMResponse, TaskType, InputType,
    SummarizationResponse, DoubtExplanationResponse,
    TopicExtractionResponse, DifficultyClassificationResponse,
    KeywordExtractionResponse, DraftNotesResponse,
    MicronoteRequest, MicronoteResponse
)
from app.db.mongodb import get_mongo_db
from datetime import datetime
import base64
import tempfile
import os
import aiofiles

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

class ProcessLectureRequest(BaseModel):
    text: str
    context: Optional[str] = None

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

@router.post("/process-lecture")
async def process_lecture(request: ProcessLectureRequest):
    """Unified endpoint for processing a lecture transcript."""
    try:
        result = await ollama_service.process_lecture(request.text, request.context)
        return result
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

@router.post("/transcribe-audio")
async def transcribe_audio(
    audio_file: UploadFile = File(...),
    language: Optional[str] = Form(None)
):
    """
    Transcribe audio file to text using Whisper
    Supports: mp3, wav, m4a, ogg, etc.
    """
    try:
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(audio_file.filename)[1]) as temp_file:
            content = await audio_file.read()
            temp_file.write(content)
            temp_path = temp_file.name
        
        try:
            # Transcribe
            result = await transcription_service.transcribe_audio_file(temp_path, language)
            return {
                "success": True,
                "transcription": result["text"],
                "language": result["language"],
                "segments": result["segments"]
            }
        finally:
            # Clean up
            if os.path.exists(temp_path):
                os.remove(temp_path)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription error: {str(e)}")

@router.post("/transcribe-audio-base64")
async def transcribe_audio_base64(request: dict):
    """
    Transcribe base64 encoded audio to text
    Request body: {"audio_base64": "...", "language": "en" (optional)}
    """
    try:
        audio_base64 = request.get("audio_base64")
        language = request.get("language")
        
        if not audio_base64:
            raise HTTPException(status_code=400, detail="audio_base64 is required")
        
        result = await transcription_service.transcribe_audio_base64(audio_base64, language)
        return {
            "success": True,
            "transcription": result["text"],
            "language": result["language"],
            "segments": result["segments"]
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transcription error: {str(e)}")

@router.post("/upload-file")
async def upload_file(
    file: UploadFile = File(...),
    task: str = Form("summarization")  # summarization, topic_extraction, etc.
):
    """
    Upload and process files (images, PDFs, DOCX, videos)
    Then use AI to analyze the content
    """
    try:
        # Get file extension
        file_extension = os.path.splitext(file.filename)[1].lower()
        
        # Create temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_path = temp_file.name
        
        try:
            # Process file based on type
            processed_data = await file_processing_service.process_file(temp_path, file_extension)
            
            # Extract text content for AI processing
            text_content = ""
            analysis_source = ""
            if processed_data["type"] in ["pdf", "docx", "text"]:
                text_content = processed_data["text"]
                analysis_source = processed_data["type"]
            elif processed_data["type"] == "image":
                # For images, prefer OCR text if available, else fallback to description
                ocr_text = (processed_data.get("ocr") or {}).get("text") or ""
                if ocr_text.strip():
                    text_content = ocr_text
                    analysis_source = "ocr"
                    try:
                        preview = (processed_data.get("ocr_preview") or "")[:200].replace("\n", " ")
                        print(f"[Upload] Using OCR text for '{file.filename}'. Preview: '{preview}'{'...' if processed_data.get('ocr_preview') and len(processed_data.get('ocr_preview')) > 200 else ''}")
                    except Exception:
                        pass
                else:
                    text_content = f"Image file uploaded: {processed_data['description']}"
                    analysis_source = "image_description"
                    try:
                        print(f"[Upload] OCR empty for '{file.filename}'. Fallback to description: {processed_data['description']}")
                    except Exception:
                        pass
            elif processed_data["type"] == "video":
                text_content = "Video file uploaded. Please extract audio for transcription."
                analysis_source = "video"
            
            # Process with AI based on task
            ai_result = None
            if text_content and task:
                if task == "summarization":
                    ai_result = await ollama_service.summarize_text(text_content)
                elif task == "topic_extraction":
                    ai_result = await ollama_service.extract_topics(text_content)
                elif task == "keyword_extraction":
                    ai_result = await ollama_service.extract_keywords(text_content)
                elif task == "difficulty_classification":
                    ai_result = await ollama_service.classify_difficulty(text_content)
            
            return {
                "success": True,
                "filename": file.filename,
                "file_type": processed_data["type"],
                "processed_data": processed_data,
                "ai_analysis": ai_result,
                "analysis_source": analysis_source
            }
        
        finally:
            # Clean up
            if os.path.exists(temp_path):
                os.remove(temp_path)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File processing error: {str(e)}")

@router.post("/ocr-analyze-image")
async def ocr_analyze_image(
    file: UploadFile = File(...),
    task: str = Form("summarization"),
    context: Optional[str] = Form(None)
):
    """
    Extract text from an image using PaddleOCR and run AI analysis on the extracted text.
    Returns OCR diagnostics and the LLM output for the selected task.
    """
    try:
        file_extension = os.path.splitext(file.filename)[1].lower()
        if file_extension not in [".png", ".jpg", ".jpeg", ".gif", ".bmp", ".webp"]:
            raise HTTPException(status_code=400, detail="Unsupported image format for OCR")

        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_path = temp_file.name

        try:
            import asyncio
            # Run OCR directly in background thread to prevent GUI freezing
            ocr_result = await asyncio.to_thread(ocr_service.extract_text_from_image, temp_path)
            ocr_text = (ocr_result or {}).get("text", "").strip()
            if not ocr_text:
                # Provide helpful diagnostics
                return {
                    "success": False,
                    "filename": file.filename,
                    "ocr": ocr_result,
                    "message": "No text detected by OCR. Try a clearer image or different angle."
                }

            # Feed OCR text to AI based on task
            ai_result = None
            if task == "summarization":
                ai_result = await ollama_service.summarize_text(ocr_text, context)
            elif task == "topic_extraction":
                ai_result = await ollama_service.extract_topics(ocr_text)
            elif task == "keyword_extraction":
                ai_result = await ollama_service.extract_keywords(ocr_text)
            elif task == "difficulty_classification":
                ai_result = await ollama_service.classify_difficulty(ocr_text)
            elif task == "doubt_explanation":
                ai_result = await ollama_service.explain_doubt(ocr_text, context)

            return {
                "success": True,
                "filename": file.filename,
                "ocr": ocr_result,
                "ai_analysis": ai_result
            }
        finally:
            if os.path.exists(temp_path):
                os.remove(temp_path)

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"OCR analysis error: {str(e)}")

@router.post("/analyze-with-context")
async def analyze_with_context(
    text: Optional[str] = Form(None),
    audio_file: Optional[UploadFile] = File(None),
    document_file: Optional[UploadFile] = File(None),
    task: str = Form("summarization"),
    context: Optional[str] = Form(None)
):
    """
    Multi-modal analysis endpoint
    - Can accept text, audio, or document
    - Transcribes audio if provided
    - Extracts text from documents
    - Performs AI analysis based on task
    """
    try:
        content_text = text or ""
        
        # Process audio if provided
        if audio_file:
            with tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(audio_file.filename)[1]) as temp_file:
                audio_content = await audio_file.read()
                temp_file.write(audio_content)
                temp_path = temp_file.name
            
            try:
                transcription_result = await transcription_service.transcribe_audio_file(temp_path)
                content_text += "\n\n" + transcription_result["text"]
            finally:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
        
        # Process document if provided
        if document_file:
            file_extension = os.path.splitext(document_file.filename)[1].lower()
            with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
                doc_content = await document_file.read()
                temp_file.write(doc_content)
                temp_path = temp_file.name
            
            try:
                processed_data = await file_processing_service.process_file(temp_path, file_extension)
                if processed_data.get("text"):
                    content_text += "\n\n" + processed_data["text"]
            finally:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
        
        if not content_text.strip():
            raise HTTPException(status_code=400, detail="No content provided")
        
        # Perform AI analysis
        ai_result = None
        if task == "summarization":
            ai_result = await ollama_service.summarize_text(content_text, context)
        elif task == "topic_extraction":
            ai_result = await ollama_service.extract_topics(content_text)
        elif task == "keyword_extraction":
            ai_result = await ollama_service.extract_keywords(content_text)
        elif task == "difficulty_classification":
            ai_result = await ollama_service.classify_difficulty(content_text)
        elif task == "doubt_explanation":
            ai_result = await ollama_service.explain_doubt(content_text, context)
        
        return {
            "success": True,
            "content": content_text[:500] + "..." if len(content_text) > 500 else content_text,
            "full_content_length": len(content_text),
            "analysis": ai_result
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")

@router.post("/generate-draft-notes")
async def generate_draft_notes(request: TextRequest):
    """Generate structured draft notes requiring user editing"""
    try:
        result = await ollama_service.generate_draft_notes(request.text)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/save-edited-notes")
async def save_edited_notes(
    title: str = Form(...),
    content: str = Form(...),
    original_draft: Optional[str] = Form(None),
    user_id: Optional[str] = Form(None)
):
    """Save user-edited notes to MongoDB"""
    try:
        db = get_mongo_db()
        doc = {
            "user_id": user_id,
            "title": title,
            "content": content,
            "original_draft": original_draft,
            "edited": True,
            "created_at": datetime.utcnow()
        }
        result = db.draft_notes.insert_one(doc)
        return {"id": str(result.inserted_id), "message": "Notes saved successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save notes: {str(e)}")

@router.post("/expand-micronote")
async def expand_micronote(request: MicronoteRequest):
    """Expand a micronote key phrase using transcript context"""
    try:
        result = await ollama_service.expand_micronote(
            request.key_phrase,
            request.transcript_context,
            request.style_preference
        )
        
        # Check if parsing failed
        if "error" in result:
            # Return a fallback response with error details
            return {
                "original_phrase": request.key_phrase,
                "expanded_content": f"Unable to parse AI response. Please try again.\n\nRaw content: {result.get('raw_response', '')[:500]}",
                "relevant_quotes": [],
                "timestamp_references": []
            }
        
        # Ensure all required fields exist with defaults
        response_data = {
            "original_phrase": result.get("original_phrase", request.key_phrase),
            "expanded_content": result.get("expanded_content", "No expansion generated"),
            "relevant_quotes": result.get("relevant_quotes", []),
            "timestamp_references": result.get("timestamp_references", [])
        }
        
        # Optionally save to database
        if request.user_id:
            db = get_mongo_db()
            db.micronotes.insert_one({
                "user_id": request.user_id,
                "key_phrase": request.key_phrase,
                "expanded_content": response_data["expanded_content"],
                "style": request.style_preference,
                "created_at": datetime.utcnow()
            })
        
        return response_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Micronote expansion error: {str(e)}")

@router.get("/draft-notes")
async def get_draft_notes(user_id: Optional[str] = None, skip: int = 0, limit: int = 50):
    """Get all draft notes for a user"""
    try:
        db = get_mongo_db()
        query = {"user_id": user_id} if user_id else {}
        notes = list(db.draft_notes.find(query).sort("created_at", -1).skip(skip).limit(limit))
        for note in notes:
            note['_id'] = str(note['_id'])
        return {"notes": notes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/micronotes")
async def get_micronotes(user_id: Optional[str] = None, skip: int = 0, limit: int = 50):
    """Get all micronotes for a user"""
    try:
        db = get_mongo_db()
        query = {"user_id": user_id} if user_id else {}
        notes = list(db.micronotes.find(query).sort("created_at", -1).skip(skip).limit(limit))
        for note in notes:
            note['_id'] = str(note['_id'])
        return {"notes": notes}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
