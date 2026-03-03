from typing import List, Optional, Dict, Any
from app.db.mongodb import get_mongo_db
from app.models.resource import ResourceInDB
from bson.objectid import ObjectId

# Collection name
COLLECTION_NAME = "resources"

def get_resources_collection():
    db = get_mongo_db()
    return db[COLLECTION_NAME]

def insert_resource(resource: ResourceInDB) -> str:
    """Insert a single resource into MongoDB"""
    collection = get_resources_collection()
    resource_dict = resource.model_dump()
    result = collection.insert_one(resource_dict)
    return str(result.inserted_id)

def get_all_embeddings() -> List[Dict[str, Any]]:
    """Retrieve all embeddings, chunks, and document IDs for FAISS indexing"""
    collection = get_resources_collection()
    # Only projection id, embeddings, and chunks to save memory and bandwidth
    cursor = collection.find({}, {"embeddings": 1, "chunks": 1})
    return list(cursor)

def get_resources_by_ids(ids: List[str]) -> List[Dict[str, Any]]:
    """Retrieve multiple resources by their ObjectIds"""
    collection = get_resources_collection()
    object_ids = [ObjectId(_id) for _id in ids]
    cursor = collection.find({"_id": {"$in": object_ids}})
    # Convert cursor to list and stringify ObjectId
    resources = []
    for doc in cursor:
        doc["_id"] = str(doc["_id"])
        resources.append(doc)
    return resources
