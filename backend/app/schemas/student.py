from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class StudentBase(BaseModel):
    name: str
    email: EmailStr

class StudentCreate(StudentBase):
    pass

class StudentUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None

class Student(StudentBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
