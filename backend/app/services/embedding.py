from sentence_transformers import SentenceTransformer
from typing import List, Tuple

# Global model instance
model = None

def load_embedding_model():
    """Load the sentence-transformers model into memory"""
    global model
    if model is None:
        print("Loading embedding model all-MiniLM-L6-v2...")
        model = SentenceTransformer('all-MiniLM-L6-v2')
        print("Model loaded successfully.")

def chunk_text(text: str, chunk_size: int = 500, overlap: int = 50) -> List[str]:
    """Split text into overlapping chunks of characters."""
    if not text:
        return []
    chunks = []
    start = 0
    text_len = len(text)
    while start < text_len:
        end = min(start + chunk_size, text_len)
        chunks.append(text[start:end])
        if end == text_len:
            break
        start += (chunk_size - overlap)
    return chunks

def embed_texts(texts: List[str]) -> List[List[float]]:
    """
    Generate normalized embeddings for given texts.
    """
    if model is None:
        raise RuntimeError("Model is not loaded. Call load_embedding_model() first.")
    if not texts:
        return []
    # Generate the embeddings. normalize_embeddings=True ensures we can use cosine similarity via dot product (IndexFlatIP)
    embeddings = model.encode(texts, normalize_embeddings=True)
    return embeddings.tolist()

def embed_text(text: str) -> List[float]:
    """
    Generate a normalized embedding for a single text.
    """
    res = embed_texts([text])
    return res[0] if res else []

def generate_resource_embeddings(title: str, description: str, domain: str) -> Tuple[List[str], List[List[float]]]:
    """
    Chunk the combined resource metadata and generate embeddings for each chunk.
    """
    combined_text = f"{title}. {description}. Domain: {domain}"
    chunks = chunk_text(combined_text)
    embeddings = embed_texts(chunks)
    return chunks, embeddings
