from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.postgres import get_db
from app.models.student import Student
from app.schemas.student import Student as StudentSchema, StudentCreate, StudentUpdate

router = APIRouter()

@router.post("/", response_model=StudentSchema)
def create_student(student: StudentCreate, db: Session = Depends(get_db)):
    """Create a new student"""
    db_student = Student(**student.dict())
    db.add(db_student)
    db.commit()
    db.refresh(db_student)
    return db_student

@router.get("/", response_model=List[StudentSchema])
def get_students(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all students"""
    students = db.query(Student).offset(skip).limit(limit).all()
    return students

@router.get("/{student_id}", response_model=StudentSchema)
def get_student(student_id: int, db: Session = Depends(get_db)):
    """Get a specific student"""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    return student
