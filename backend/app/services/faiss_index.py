import faiss
import numpy as np
from typing import List, Dict, Any

from app.crud.resource import get_all_embeddings, get_resources_by_ids
from app.services.embedding import embed_text

# In-memory FAISS index and mapping
dimension = 384  # all-MiniLM-L6-v2 outputs 384 dims
index = faiss.IndexFlatL2(dimension)
# Mapping from FAISS integer index to MongoDB ObjectId (string)
index_to_mongo_id: Dict[int, str] = {}

def build_faiss_index():
    """
    Fetch all embeddings from MongoDB and build the FAISS index.
    Should be called on FastAPI startup.
    """
    global index, index_to_mongo_id
    
    # Reset index in case this is called during reload
    index = faiss.IndexFlatL2(dimension)
    index_to_mongo_id = {}
    
    print("Fetching embeddings from MongoDB...")
    resources_with_embeddings = get_all_embeddings()
    
    if not resources_with_embeddings:
        print("No resources found to index.")
        return
        
    print(f"Adding {len(resources_with_embeddings)} vectors to FAISS...")
    
    # Separate vectors and IDs
    vectors = []
    vector_ids = []
    
    for doc in resources_with_embeddings:
        if "embedding" in doc and doc["embedding"]:
            vectors.append(doc["embedding"])
            vector_ids.append(str(doc["_id"]))
            
    if vectors:
        vectors_np = np.array(vectors).astype('float32')
        # Add to FAISS index
        index.add(vectors_np)
        
        # Populate mapping
        for i, doc_id in enumerate(vector_ids):
            index_to_mongo_id[i] = doc_id
            
        print(f"Successfully built FAISS index with {index.ntotal} vectors.")
    else:
        print("No valid embeddings found in the database.")


def search_resources(query: str, top_k: int = 5) -> List[Dict[str, Any]]:
    """
    Search for resources similar to the query summary.
    """
    # 1. Convert query to embedding
    query_vector = embed_text(query)
    query_vector_np = np.array([query_vector]).astype('float32')
    
    # 2. Search FAISS index
    if index.ntotal == 0:
        return []
        
    distances, indices = index.search(query_vector_np, top_k)
    
    # 3. Retrieve mapping
    matching_mongo_ids = []
    for i in indices[0]:
        if i != -1 and i in index_to_mongo_id:
            matching_mongo_ids.append(index_to_mongo_id[i])
            
    # 4. Map results back to MongoDB documents
    if not matching_mongo_ids:
        return []
        
    resources = get_resources_by_ids(matching_mongo_ids)
    
    # Optionally, we sort the resources to match the order of FAISS distances
    id_to_resource = {str(res["_id"]): res for res in resources}
    sorted_resources = [
        id_to_resource[m_id] for m_id in matching_mongo_ids if m_id in id_to_resource
    ]
    
    return sorted_resources

