import os
import faiss
import json
import pickle
import numpy as np
from typing import List, Dict, Any, Set
from collections import defaultdict
from rank_bm25 import BM25Okapi
from sentence_transformers import CrossEncoder

from app.crud.resource import get_all_embeddings, get_resources_by_ids
from app.services.embedding import embed_text

INDEX_DIR = "data"
FAISS_INDEX_PATH = os.path.join(INDEX_DIR, "faiss.index")
MAPPING_PATH = os.path.join(INDEX_DIR, "index_mapping.json")
BM25_PATH = os.path.join(INDEX_DIR, "bm25_index.pkl")
CHUNKS_PATH = os.path.join(INDEX_DIR, "chunks_mapping.json")

dimension = 384
index = faiss.IndexFlatIP(dimension)
index_to_mongo_id: Dict[int, str] = {}
index_to_chunk: Dict[int, str] = {}

bm25_index: Any = None
bm25_mapping: List[int] = []

cross_encoder = None

def load_cross_encoder():
    global cross_encoder
    if cross_encoder is None:
        print("Loading CrossEncoder model...")
        cross_encoder = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')
        print("CrossEncoder loaded successfully.")

def build_faiss_index(force_rebuild: bool = False):
    global index, index_to_mongo_id, index_to_chunk, bm25_index, bm25_mapping
    os.makedirs(INDEX_DIR, exist_ok=True)
    
    if not force_rebuild and os.path.exists(FAISS_INDEX_PATH) and os.path.exists(MAPPING_PATH) and os.path.exists(BM25_PATH) and os.path.exists(CHUNKS_PATH):
        print("Loading FAISS and BM25 indices from disk...")
        index = faiss.read_index(FAISS_INDEX_PATH)
        with open(MAPPING_PATH, 'r') as f:
            mapping_str = json.load(f)
            index_to_mongo_id = {int(k): v for k, v in mapping_str.items()}
        with open(CHUNKS_PATH, 'r') as f:
            chunks_str = json.load(f)
            index_to_chunk = {int(k): v for k, v in chunks_str.items()}
        with open(BM25_PATH, 'rb') as f:
            bm25_data = pickle.load(f)
            bm25_index = bm25_data["bm25"]
            bm25_mapping = bm25_data["mapping"]
        return

    print("Fetching embeddings from MongoDB and building indices...")
    index = faiss.IndexFlatIP(dimension)
    index_to_mongo_id = {}
    index_to_chunk = {}
    bm25_mapping = []
    
    resources = get_all_embeddings()
    if not resources:
        print("No resources found to index.")
        return
        
    vectors = []
    corpus = []
    current_idx = 0
    
    for doc in resources:
        embeddings = doc.get("embeddings", [])
        chunks = doc.get("chunks", [])
        
        # Legacy fallback if embedding (singular) exists
        if not embeddings and doc.get("embedding"):
            embeddings = [doc["embedding"]]
            chunks = [" ".join(doc.get("description", "").split())] # Approximation
            
        doc_id = str(doc["_id"])
        
        for emb, text_chunk in zip(embeddings, chunks):
            vectors.append(emb)
            index_to_mongo_id[current_idx] = doc_id
            index_to_chunk[current_idx] = text_chunk
            
            # BM25 uses simple tokenization
            tokenized_chunk = text_chunk.lower().split()
            corpus.append(tokenized_chunk)
            bm25_mapping.append(current_idx)
            
            current_idx += 1
            
    if vectors:
        vectors_np = np.array(vectors).astype('float32')
        index.add(vectors_np)
        
        bm25_index = BM25Okapi(corpus)
        
        # Save to disk
        faiss.write_index(index, FAISS_INDEX_PATH)
        with open(MAPPING_PATH, 'w') as f:
            json.dump(index_to_mongo_id, f)
        with open(CHUNKS_PATH, 'w') as f:
            json.dump(index_to_chunk, f)
        with open(BM25_PATH, 'wb') as f:
            pickle.dump({"bm25": bm25_index, "mapping": bm25_mapping}, f)
            
        print(f"Successfully built indices with {index.ntotal} vectors.")
    else:
        print("No valid embeddings found in the database.")


def search_resources(query: str, top_k: int = 5) -> List[Dict[str, Any]]:
    global index, index_to_mongo_id, index_to_chunk, bm25_index, bm25_mapping, cross_encoder
    
    if index.ntotal == 0:
        return []
        
    # Lazy load cross encoder
    load_cross_encoder()

    # 1. FAISS Search
    query_vector = embed_text(query)
    query_vector_np = np.array([query_vector]).astype('float32')
    
    k_candidates = top_k * 3
    faiss_distances, faiss_indices = index.search(query_vector_np, min(index.ntotal, k_candidates))
    
    candidate_faiss_idx = []
    faiss_scores = {}
    for dist, idx in zip(faiss_distances[0], faiss_indices[0]):
        if idx != -1:
            candidate_faiss_idx.append(idx)
            faiss_scores[idx] = dist
            
    # 2. BM25 Search
    tokenized_query = query.lower().split()
    bm25_scores = {}
    if bm25_index:
        doc_scores = bm25_index.get_scores(tokenized_query)
        # Sort and get top
        top_bm25_indices = np.argsort(doc_scores)[::-1][:min(len(doc_scores), k_candidates)]
        for i in top_bm25_indices:
            global_idx = bm25_mapping[i]
            bm25_scores[global_idx] = doc_scores[i]
            if global_idx not in candidate_faiss_idx:
                candidate_faiss_idx.append(global_idx)

    if not candidate_faiss_idx:
        return []

    # 3. Reciprocal Rank Fusion (RRF)
    # RRF Score = 1 / (k + rank)
    k_rrf = 60
    rrf_scores = defaultdict(float)
    
    # Sort candidates for RRF FAISS
    sorted_faiss = sorted(faiss_scores.items(), key=lambda x: x[1], reverse=True)
    for rank, (idx, score) in enumerate(sorted_faiss):
        rrf_scores[idx] += 1.0 / (k_rrf + rank + 1)
        
    # Sort candidates for RRF BM25
    sorted_bm25 = sorted(bm25_scores.items(), key=lambda x: x[1], reverse=True)
    for rank, (idx, score) in enumerate(sorted_bm25):
        rrf_scores[idx] += 1.0 / (k_rrf + rank + 1)
        
    # Get top candidates from RRF for CrossEncoder re-ranking
    sorted_rrf = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)
    top_candidates = sorted_rrf[:top_k * 2]
    
    # 4. CrossEncoder Re-ranking
    cross_encoder_inputs = []
    candidate_indices = []
    
    for idx, _ in top_candidates:
        chunk_text = index_to_chunk.get(idx, "")
        cross_encoder_inputs.append([query, chunk_text])
        candidate_indices.append(idx)
        
    final_mongo_ids_with_scores = []
    if cross_encoder and cross_encoder_inputs:
        cross_scores = cross_encoder.predict(cross_encoder_inputs)
        
        # Sort by cross encoder score
        scored_candidates = sorted(zip(candidate_indices, cross_scores), key=lambda x: x[1], reverse=True)
        
        seen_mongo_ids = set()
        for idx, score in scored_candidates:
            # Similarity threshold (e.g., minimum logits score of -2.0 depending on model)
            if score < -2.0: # lenient threshold based on logits
                continue
                
            mongo_id = index_to_mongo_id[idx]
            if mongo_id not in seen_mongo_ids:
                seen_mongo_ids.add(mongo_id)
                final_mongo_ids_with_scores.append(mongo_id)
                if len(final_mongo_ids_with_scores) >= top_k:
                    break
                    
    # 5. Fetch resources from MongoDB
    if not final_mongo_ids_with_scores:
        return []
        
    resources = get_resources_by_ids(final_mongo_ids_with_scores)
    id_to_resource = {str(res["_id"]): res for res in resources}
    
    sorted_resources = [
        id_to_resource[m_id] for m_id in final_mongo_ids_with_scores if m_id in id_to_resource
    ]
    
    return sorted_resources
