import logging
import sys
from pathlib import Path

# Add current directory to path
sys.path.append(str(Path(__file__).parent))

import text_cleaner
import entity_extractor
import sector_classifier
import embeddings_generator
import vector_store
import relationship_mapper
import build_knowledge_graph
sys.path.append(str(Path(__file__).parent.parent / "database"))
import db_uploader

def run_module_2():
    # 1. Clean Data
    print("Step 1/8: Cleaning raw data...")
    text_cleaner.run_cleaning()
    
    # 2. Extract Entities
    print("Step 2/8: Extracting entities using spaCy...")
    entity_extractor.extract_entities()
    
    # 3. Classify Sectors
    print("Step 3/8: Classifying sectors...")
    sector_classifier.classify_all()
    
    # 4. Generate Embeddings
    print("Step 4/8: Generating semantic embeddings...")
    embeddings_generator.run_embedding_pipeline()
    
    # 5. Build FAISS Index
    print("Step 5/8: Building vector index...")
    vector_store.build_index()
    
    # 6. Map Relationships
    print("Step 6/8: Mapping hybrid relationships...")
    relationship_mapper.map_relationships()
    
    # 7. Build Knowledge Graph
    print("Step 7/8: Constructing final knowledge graph...")
    build_knowledge_graph.build_graph()
    
    # 8. Upload to PostgreSQL
    print("Step 8/8: Syncing data to PostgreSQL...")
    db_uploader.upload_kg_to_postgres()
    
    print("--- Module 2 Pipeline Complete ---")

if __name__ == "__main__":
    run_module_2()
