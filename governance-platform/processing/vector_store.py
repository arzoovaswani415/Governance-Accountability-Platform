import faiss
import numpy as np
import json
import logging
import os
from pathlib import Path

# Setup logging
LOG_DIR = Path("logs")
LOG_DIR.mkdir(exist_ok=True)
logging.basicConfig(
    filename=LOG_DIR / "processing.log",
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

class VectorStore:
    def __init__(self, dimension=384):
        # dimension for all-MiniLM-L6-v2 is 384
        self.dimension = dimension
        self.index = faiss.IndexFlatIP(dimension) # Inner Product on normalized vectors = Cosine Similarity
        self.metadata = []
        self.store_dir = Path("data/vector_index")
        self.store_dir.mkdir(parents=True, exist_ok=True)

    def add_data(self, embeddings, category_metadata):
        """
        embeddings: numpy array of shape (N, dimension)
        category_metadata: list of dicts (one for each embedding)
        """
        if len(embeddings) == 0:
            return
        
        # Normalize for Cosine Similarity
        faiss.normalize_L2(embeddings)
        
        start_id = len(self.metadata)
        self.index.add(embeddings)
        
        # Store metadata with index IDs
        for i, meta in enumerate(category_metadata):
            meta['index_id'] = start_id + i
            self.metadata.append(meta)
        
        logging.info(f"Added {len(embeddings)} vectors. Total: {self.index.ntotal}")

    def save(self):
        faiss.write_index(self.index, str(self.store_dir / "faiss_index.bin"))
        with open(self.store_dir / "metadata.json", "w", encoding="utf-8") as f:
            json.dump(self.metadata, f, indent=4)
        logging.info(f"Vector store saved to {self.store_dir}")

    def load(self):
        if (self.store_dir / "faiss_index.bin").exists():
            self.index = faiss.read_index(str(self.store_dir / "faiss_index.bin"))
            with open(self.store_dir / "metadata.json", "r", encoding="utf-8") as f:
                self.metadata = json.load(f)
            logging.info(f"Vector store loaded with {self.index.ntotal} vectors")
            return True
        return False

    def search(self, query_embedding, k=5):
        """
        query_embedding: numpy array of shape (1, dimension) or (dimension,)
        """
        if len(query_embedding.shape) == 1:
            query_embedding = query_embedding.reshape(1, -1)
        
        # Normalize
        faiss.normalize_L2(query_embedding)
        
        distances, indices = self.index.search(query_embedding, k)
        
        results = []
        for dist, idx in zip(distances[0], indices[0]):
            if idx != -1: # FAISS returns -1 if not enough results
                meta = self.metadata[idx].copy()
                meta['similarity'] = float(dist)
                results.append(meta)
        
        return results

def build_index():
    embeddings_dir = Path("data/embeddings")
    cleaned_dir = Path("data/cleaned")
    store = VectorStore(dimension=384)
    
    # Categories: manifestos, bills, news, datasets, policies
    for npy_file in embeddings_dir.glob("*_embeddings.npy"):
        category = npy_file.stem.replace("_embeddings", "")
        embeddings = np.load(npy_file)
        
        # Load corresponding metadata
        metadata_file = cleaned_dir / f"{category}_cleaned.json"
        if not metadata_file.exists():
            # Try without _cleaned
            metadata_file = cleaned_dir / f"{category}.json"
        
        if metadata_file.exists():
            with open(metadata_file, "r", encoding="utf-8") as f:
                records = json.load(f)
            
            # Category-specific metadata enhancement
            for r in records:
                r['category_type'] = category
            
            store.add_data(embeddings, records)
        else:
            logging.warning(f"Metadata file not found for {npy_file}")
            
    store.save()
    print("Vector index built successfully.")

if __name__ == "__main__":
    build_index()
