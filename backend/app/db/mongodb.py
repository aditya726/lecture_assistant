from pymongo.mongo_client import MongoClient
from pymongo.server_api import ServerApi
from app.core.config import settings

# Create a new client and connect to the server
client = MongoClient(settings.MONGODB_URL, server_api=ServerApi('1'))
db = client[settings.MONGODB_DB]

def get_mongo_db():
    """Get MongoDB database instance"""
    return db

def verify_connection():
    """Verify MongoDB connection"""
    try:
        client.admin.command('ping')
        print("✓ Successfully connected to MongoDB!")
        return True
    except Exception as e:
        print(f"✗ MongoDB connection failed: {e}")
        return False
