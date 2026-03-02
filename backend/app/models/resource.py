from pydantic import BaseModel, HttpUrl, Field
from typing import List, Optional, Literal

class ResourceBase(BaseModel):
    title: str = Field(..., description="Title of the learning resource")
    type: Literal["video", "book", "article", "paper"] = Field(..., description="Type of the resource")
    url: str = Field(..., description="URL to access the resource")
    description: str = Field(..., description="Description or summary of the resource")
    difficulty: Literal["beginner", "intermediate", "advanced"] = Field(..., description="Difficulty level")
    domain: str = Field(..., description="Subject domain of the resource")

class ResourceCreate(ResourceBase):
    pass

class ResourceInDB(ResourceBase):
    embedding: List[float] = Field(..., description="Vector embedding of the resource content")

class ResourceResponse(ResourceBase):
    # Same as ResourceBase, excluding the embedding for the API response
    pass
