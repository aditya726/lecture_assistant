from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId
from app.db.mongodb import get_mongo_db
from app.core.security import get_current_user

router = APIRouter()

class SessionCreate(BaseModel):
    title: str
    transcript: str
    summary: Optional[str] = None
    key_points: Optional[List[str]] = []
    tags: Optional[Dict[str, Any]] = {}
    related_resources: Optional[List[str]] = []

class SessionUpdate(BaseModel):
    title: Optional[str] = None
    transcript: Optional[str] = None
    summary: Optional[str] = None
    key_points: Optional[List[str]] = None
    tags: Optional[Dict[str, Any]] = None
    related_resources: Optional[List[str]] = None

@router.post("/")
async def create_session(session: SessionCreate, current_user: dict = Depends(get_current_user)):
    """Save a new lecture session to the database."""
    db = get_mongo_db()
    
    # We construct the document first
    doc = {
        "user_id": current_user["user_id"],
        "title": session.title,
        "transcript": session.transcript,
        "summary": session.summary,
        "key_points": session.key_points,
        "tags": session.tags,
        "related_resources": session.related_resources,
        "created_at": datetime.utcnow(),
        "updated_at": datetime.utcnow()
    }
    
    result = db.sessions.insert_one(doc)
    doc["_id"] = str(result.inserted_id)
    return doc

@router.get("/")
async def get_sessions(skip: int = 0, limit: int = 100, current_user: dict = Depends(get_current_user)):
    """Get all past sessions for the authenticated user."""
    db = get_mongo_db()
    sessions = list(db.sessions.find({"user_id": current_user["user_id"]}).sort("created_at", -1).skip(skip).limit(limit))
    
    # Format ObjectId for JSON serialization
    for session in sessions:
        session['_id'] = str(session['_id'])
        
    return sessions

@router.get("/{session_id}")
async def get_session(session_id: str, current_user: dict = Depends(get_current_user)):
    """Get a specific session by ID."""
    db = get_mongo_db()
    try:
        session = db.sessions.find_one({
            "_id": ObjectId(session_id), 
            "user_id": current_user["user_id"]
        })
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid session ID format")
        
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    session['_id'] = str(session['_id'])
    return session

@router.put("/{session_id}")
async def update_session(session_id: str, session: SessionUpdate, current_user: dict = Depends(get_current_user)):
    """Update an existing session."""
    db = get_mongo_db()
    try:
        obj_id = ObjectId(session_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid session ID format")

    update_data = {k: v for k, v in session.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()

    result = db.sessions.update_one(
        {"_id": obj_id, "user_id": current_user["user_id"]},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
        
    return {"message": "Session updated successfully"}

@router.delete("/{session_id}")
async def delete_session(session_id: str, current_user: dict = Depends(get_current_user)):
    """Delete a session."""
    db = get_mongo_db()
    try:
        obj_id = ObjectId(session_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid session ID format")

    result = db.sessions.delete_one({"_id": obj_id, "user_id": current_user["user_id"]})
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
        
    return {"message": "Session deleted successfully"}
