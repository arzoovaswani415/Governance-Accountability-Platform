import os
import json
import numpy as np
import logging
from pathlib import Path
from sentence_transformers import SentenceTransformer

# Setup logging
LOG_DIR = Path("logs")
LOG_DIR.mkdir(exist_ok=True)
logging.basicConfig(
    filename=LOG_DIR / "processing.log",
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

class EmbeddingGenerator:
    def __init__(self, model_name='all-MiniLM-L6-v2'):
        logging.info(f"Loading embedding model: {model_name}")
        self.model = SentenceTransformer(model_name)
        self.embeddings_dir = Path("data/embeddings")
        self.embeddings_dir.mkdir(parents=True, exist_ok=True)

    def generate_embeddings(self, data_file, batch_size=64):
        """
        Generate embeddings in batches for efficiency.
        """
        try:
            with open(data_file, "r", encoding="utf-8") as f:
                records = json.load(f)
            
            if not records:
                logging.warning(f"No records found in {data_file}")
                return None
            
            texts = []
            for record in records:
                # Use richer title combinations
                title = (record.get("headline") or record.get("title") or 
                         record.get("bill_title") or record.get("policy_name") or 
                         record.get("party_name", ""))
                
                content = (record.get("cleaned_text") or record.get("description") or 
                           record.get("summary") or record.get("content", ""))
                
                full_text = f"{title}. {content}"
                texts.append(full_text if full_text.strip() else "Empty Record")
            
            logging.info(f"Generating embeddings for {len(texts)} records from {data_file.name} (Batch Size: {batch_size})...")
            
            # Use batch encoding with normalization
            embeddings = self.model.encode(
                texts, 
                batch_size=batch_size, 
                show_progress_bar=True, 
                convert_to_numpy=True,
                normalize_embeddings=True # Normalizing for better cosine similarity in FAISS
            )
            
            # Save embeddings separate by category
            category = data_file.stem.replace("_cleaned", "")
            save_path = self.embeddings_dir / f"{category}_embeddings.npy"
            np.save(save_path, embeddings)
            
            logging.info(f"Saved {len(embeddings)} embeddings to {save_path}")
            return save_path

        except Exception as e:
            logging.error(f"Error generating embeddings for {data_file}: {e}")
            return None

def run_embedding_pipeline():
    cleaned_dir = Path("data/cleaned")
    generator = EmbeddingGenerator()
    
    file_count = 0
    total_records = 0
    
    # Process cleaned records by category
    for file_path in cleaned_dir.glob("*.json"):
        logging.info(f"Processing category file: {file_path.name}")
        path = generator.generate_embeddings(file_path, batch_size=64)
        if path:
            file_count += 1
            # Get record count for logging
            with open(file_path, "r", encoding="utf-8") as f:
                total_records += len(json.load(f))
                
    logging.info(f"Embedding generation complete. {file_count} categories processed, {total_records} total embeddings created.")
    print(f"Embedding Pipeline: Processed {file_count} categories, {total_records} records.")

if __name__ == "__main__":
    run_embedding_pipeline()
