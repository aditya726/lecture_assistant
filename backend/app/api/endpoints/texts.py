from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from app.db.mongodb import get_mongo_db

router = APIRouter()

class TextDocument(BaseModel):
    title: str
    content: str

@router.post("/")
async def create_text(document: TextDocument):
    """Create a new text document in MongoDB"""
    db = get_mongo_db()
    doc = {
        "title": document.title,
        "content": document.content,
        "created_at": datetime.utcnow()
    }
    result = db.texts.insert_one(doc)
    return {"id": str(result.inserted_id), "message": "Document created"}

@router.get("/")
async def get_texts(skip: int = 0, limit: int = 100):
    """Get all text documents"""
    db = get_mongo_db()
    texts = list(db.texts.find().skip(skip).limit(limit))
    for text in texts:
        text['_id'] = str(text['_id'])
    return texts

@router.get("/{text_id}")
async def get_text(text_id: str):
    """Get a specific text document"""
    from bson import ObjectId
    db = get_mongo_db()
    text = db.texts.find_one({"_id": ObjectId(text_id)})
    if not text:
        raise HTTPException(status_code=404, detail="Document not found")
    text['_id'] = str(text['_id'])
    return text
