from sentence_transformers import SentenceTransformer
from typing import List

# Global model instance
model = None

def load_embedding_model():
    """Load the sentence-transformers model into memory"""
    global model
    if model is None:
        print("Loading embedding model all-MiniLM-L6-v2...")
        model = SentenceTransformer('all-MiniLM-L6-v2')
        print("Model loaded successfully.")

def embed_text(text: str) -> List[float]:
    """
    Generate an embedding for the given text.
    Assumes the model is already loaded.
    """
    if model is None:
        raise RuntimeError("Model is not loaded. Call load_embedding_model() first.")
    
    # Generate the embedding. The output is a numpy array.
    embedding = model.encode(text)
    
    # Convert numpy array to list of floats for JSON/MongoDB compatibility
    return embedding.tolist()

def generate_resource_embedding(title: str, description: str, domain: str) -> List[float]:
    """
    Combine resource metadata and generate an embedding.
    """
    combined_text = f"{title}. {description}. Domain: {domain}"
    return embed_text(combined_text)
