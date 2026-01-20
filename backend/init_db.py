"""
Database initialization script
Run this to create all database tables
"""
from app.db.postgres import engine, Base
from app.models.student import User

def init_db():
    """Create all database tables"""
    # Import all models here to ensure they are registered
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully!")

if __name__ == "__main__":
    init_db()
