import json
import logging
import numpy as np
from pathlib import Path
from processing.vector_store import VectorStore

# Setup logging
LOG_DIR = Path("logs")
LOG_DIR.mkdir(exist_ok=True)
logging.basicConfig(
    filename=LOG_DIR / "processing.log",
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def calculate_entity_overlap(entities1, entities2):
    """
    entities1, entities2: Can be lists or dicts of lists
    """
    set1 = set()
    if isinstance(entities1, dict):
        for val in entities1.values():
            if isinstance(val, list): set1.update(val)
    elif isinstance(entities1, list):
        set1.update(entities1)
        
    set2 = set()
    if isinstance(entities2, dict):
        for val in entities2.values():
            if isinstance(val, list): set2.update(val)
    elif isinstance(entities2, list):
        set2.update(entities2)
        
    if not set1 or not set2:
        return 0.0
    
    intersection = set1.intersection(set2)
    return len(intersection) / min(len(set1), len(set2))

def map_relationships():
    try:
        store = VectorStore(dimension=384)
        if not store.load():
            logging.error("Could not load vector store index.")
            return

        relationships = []
        seen_pairs = set()
        logging.info("Starting relationship mapping for all records...")
        neighbors_searched = 0
        
        cleaned_dir = Path("data/cleaned")
        embeddings_dir = Path("data/embeddings")
        
        for clean_file in cleaned_dir.glob("*.json"):
            category = clean_file.stem.replace("_cleaned", "")
            embed_file = embeddings_dir / f"{category}_embeddings.npy"
            
            if not embed_file.exists():
                continue
                
            embeddings = np.load(embed_file)
            with open(clean_file, "r", encoding="utf-8") as f:
                records = json.load(f)
                
            for i, record in enumerate(records):
                vec = embeddings[i]
                
                source_title = (record.get("headline") or record.get("bill_title") or 
                                record.get("policy_name") or record.get("title") or record.get("bill_name"))
                
                if category == "manifestos":
                    source_id = f"manifestos_{record.get('party_name')}_{record.get('election_year')}"
                else:
                    source_id = f"{category}_{source_title}"
                
                # Search top 10 matches
                matches = store.search(vec, k=10)
                neighbors_searched += len(matches)
                
                for match in matches:
                    target_title = (match.get("headline") or match.get("bill_title") or 
                                    match.get("policy_name") or match.get("title") or match.get("bill_name"))
                    
                    target_category = match.get('category_type')
                    if target_category == "manifestos":
                        target_id = f"manifestos_{match.get('party_name')}_{match.get('election_year')}"
                    else:
                        target_id = f"{target_category}_{target_title}"
                    
                    # Avoid self-links
                    if source_id == target_id:
                        continue
                        
                    # Prevent duplicate relationships (undirected)
                    pair_key = tuple(sorted([source_id, target_id]))
                    if pair_key in seen_pairs:
                        continue
                    
                    # Hybrid Scoring
                    semantic_sim = match['similarity']
                    ent_overlap = calculate_entity_overlap(record.get('entities', []), match.get('entities', []))
                    
                    source_sector = record.get('sector', '').lower()
                    target_sector = match.get('sector', '').lower()
                    sector_match = 1.0 if source_sector == target_sector and source_sector != 'general' else 0.0
                    
                    # Formula: 0.6*Sim + 0.2*Entities + 0.2*Sector
                    confidence = (semantic_sim * 0.6) + (ent_overlap * 0.2) + (sector_match * 0.2)
                    
                    # User requirement: similarity > 0.75
                    if semantic_sim > 0.75:
                        seen_pairs.add(pair_key)
                        
                        reason = []
                        if semantic_sim > 0.7: reason.append("Strong semantic similarity")
                        elif semantic_sim > 0.45: reason.append("Moderate semantic similarity")
                        if ent_overlap > 0.3: reason.append(f"Entity overlap: {int(ent_overlap*100)}%")
                        if sector_match > 0: reason.append(f"Sector match: {source_sector}")
                        
                        rel = {
                            "source_id": source_id,
                            "target_id": target_id,
                            "semantic_similarity": round(semantic_sim, 3),
                            "entity_overlap": round(ent_overlap, 3),
                            "sector_match": sector_match,
                            "confidence_score": round(confidence, 3),
                            "link_reason": "; ".join(reason) if reason else "Semantic connection"
                        }
                        relationships.append(rel)

        # Save relationships
        output_file = Path("data/relationships.json")
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(relationships, f, indent=4, ensure_ascii=False)
            
        logging.info(f"Number of neighbors searched: {neighbors_searched}")
        logging.info(f"Generated {len(relationships)} relationships with confidence > 0.45")
        logging.info(f"Relationships discovered: {len(relationships)}")
        print(f"Relationship Mapping: Searched {neighbors_searched} neighbors, found {len(relationships)} links.")

    except Exception as e:
        logging.error(f"Error in relationship mapping: {e}")

if __name__ == "__main__":
    map_relationships()
