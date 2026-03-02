from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from app.models.resource import ResourceResponse
from app.services.faiss_index import search_resources, build_faiss_index
from app.services.ingestion import ingest_resources_for_query

router = APIRouter()

class RecommendRequest(BaseModel):
    summary: str

class RecommendResponse(BaseModel):
    recommended_resources: List[ResourceResponse]

@router.post("/recommend", response_model=RecommendResponse)
async def recommend_resources(request: RecommendRequest):
    try:
        results = search_resources(query=request.summary, top_k=5)
        
        # Ensure we filter out internal fields like embeddings for the response
        clean_results = []
        for res in results:
            clean_res = ResourceResponse(**res)
            clean_results.append(clean_res)
            
        return RecommendResponse(recommended_resources=clean_results)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

class IngestRequest(BaseModel):
    query: str
    max_per_source: int = 3
    
@router.post("/ingest")
async def ingest_resources(request: IngestRequest):
    """
    Ingest resources from external APIs (YouTube, Google Books, arXiv) for a given query.
    Note: Requires YOUTUBE_API_KEY environment variable.
    After ingestion, rebuilds the FAISS index to include new vectors.
    """
    try:
        result = await ingest_resources_for_query(request.query, request.max_per_source)
        # Rebuild FAISS index to reflect newly inserted resources
        build_faiss_index()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
