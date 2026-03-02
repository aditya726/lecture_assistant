import os
import httpx
import urllib.parse
import xml.etree.ElementTree as ET
from googleapiclient.discovery import build
from typing import List, Optional
from app.core.config import settings

from app.models.resource import ResourceInDB
from app.crud.resource import insert_resource
from app.services.embedding import generate_resource_embedding

# Setup Youtube client (Requires API key in .env)
# YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY")

def fetch_youtube_videos(query: str, max_results: int = 3) -> List[ResourceInDB]:
    """Fetch videos from YouTube Data API v3 and convert to ResourceInDB"""
    api_key = settings.YOUTUBE_API_KEY
    if not api_key:
        print("YOUTUBE_API_KEY not set. Skipping YouTube search.")
        return []
        
    try:
        youtube = build('youtube', 'v3', developerKey=api_key)
        
        request = youtube.search().list(
            part="snippet",
            q=query,
            maxResults=max_results,
            type="video"
        )
        response = request.execute()
        
        resources = []
        for item in response.get("items", []):
            title = item["snippet"]["title"]
            description = item["snippet"]["description"]
            video_id = item["id"]["videoId"]
            url = f"https://www.youtube.com/watch?v={video_id}"
            
            embedding = generate_resource_embedding(title, description, query)
            
            res = ResourceInDB(
                title=title,
                type="video",
                url=url,
                description=description,
                difficulty="beginner", # Defaulting to beginner for videos
                domain=query,
                embedding=embedding
            )
            resources.append(res)
        return resources
    except Exception as e:
        print(f"Error fetching YouTube videos: {e}")
        return []

async def fetch_google_books(query: str, max_results: int = 3) -> List[ResourceInDB]:
    """Fetch books from Google Books API and convert to ResourceInDB"""
    url = f"https://www.googleapis.com/books/v1/volumes"
    params = {
        "q": query,
        "maxResults": max_results
    }
    
    # Can optionally use an API key for higher quotas
    api_key = settings.GOOGLE_BOOKS_API_KEY
    if api_key:
        params["key"] = api_key
        # Ensure that it's using an authorized request URL
        url = f"https://www.googleapis.com/books/v1/volumes"
        
    resources = []
    async with httpx.AsyncClient(verify=False) as client:
        try:
            response = await client.get(url, params=params)
            response.raise_for_status()
            data = response.json()
            
            for item in data.get("items", []):
                volume_info = item.get("volumeInfo", {})
                title = volume_info.get("title", "Unknown Title")
                description = volume_info.get("description", "No description available")
                book_url = volume_info.get("infoLink", "")
                
                embedding = generate_resource_embedding(title, description, query)
                
                res = ResourceInDB(
                    title=title,
                    type="book",
                    url=book_url,
                    description=description,
                    difficulty="intermediate",
                    domain=query,
                    embedding=embedding
                )
                resources.append(res)
        except Exception as e:
            print(f"Error fetching Google Books: {e}")
            
    return resources

async def fetch_arxiv_papers(query: str, max_results: int = 3) -> List[ResourceInDB]:
    """Fetch papers from arXiv API and convert to ResourceInDB"""
    url = f"http://export.arxiv.org/api/query"
    params = {
        "search_query": f"all:{query}",
        "start": 0,
        "max_results": max_results
    }
    
    resources = []
    # arXiv requires following redirects (301 Moved Permanently)
    async with httpx.AsyncClient(follow_redirects=True) as client:
        try:
            # We must encode the search_query properly because arXiv can be picky
            encoded_query = urllib.parse.quote(query)
            params["search_query"] = f"all:{encoded_query}"
            
            response = await client.get(url, params=params)
            response.raise_for_status()
            
            # Parse XML response
            root = ET.fromstring(response.text)
            namespace = {'atom': 'http://www.w3.org/2005/Atom'}
            
            for entry in root.findall('atom:entry', namespace):
                title = entry.find('atom:title', namespace).text.strip().replace('\n', ' ')
                summary = entry.find('atom:summary', namespace).text.strip().replace('\n', ' ')
                paper_url = entry.find('atom:id', namespace).text
                
                embedding = generate_resource_embedding(title, summary, query)
                
                res = ResourceInDB(
                    title=title,
                    type="paper",
                    url=paper_url,
                    description=summary,
                    difficulty="advanced",
                    domain=query,
                    embedding=embedding
                )
                resources.append(res)
        except Exception as e:
            print(f"Error fetching arXiv papers: {e}")
            
    return resources

async def ingest_resources_for_query(query: str, max_per_source: int = 3) -> dict:
    """Ingest resources from all sources for a given query and save them to MongoDB"""
    youtube_resources = fetch_youtube_videos(query, max_results=max_per_source)
    book_resources = await fetch_google_books(query, max_results=max_per_source)
    arxiv_resources = await fetch_arxiv_papers(query, max_results=max_per_source)
    
    all_resources = youtube_resources + book_resources + arxiv_resources
    
    inserted_ids = []
    for res in all_resources:
        inserted_id = insert_resource(res)
        inserted_ids.append(inserted_id)
        
    return {
        "status": "success",
        "query": query,
        "total_ingested": len(inserted_ids),
        "breakdown": {
            "youtube": len(youtube_resources),
            "books": len(book_resources),
            "arxiv": len(arxiv_resources)
        }
    }
