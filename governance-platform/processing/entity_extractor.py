import json
import spacy
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

def extract_entities():
    try:
        # Load spaCy model
        try:
            nlp = spacy.load("en_core_web_sm")
        except:
            logging.error("SpaCy model en_core_web_sm not found. Download it using: python -m spacy download en_core_web_sm")
            return

        cleaned_dir = Path("data/cleaned")
        for file_path in cleaned_dir.glob("*.json"):
            logging.info(f"Extracting entities from {file_path.name}...")
            with open(file_path, "r", encoding="utf-8") as f:
                records = json.load(f)
            
            for record in records:
                text = record.get("cleaned_text", "")
                if not text:
                    continue
                
                # spaCy has a limit on text length (1M chars). Manifestos might be close.
                # We process in chunks if needed or just truncate for entity extraction
                doc = nlp(text[:50000]) # 50k chars is plenty for basic entities
                
                entities = {
                    "organizations": [],
                    "ministries": [],
                    "locations": [],
                    "dates": [],
                    "laws": []
                }
                
                for ent in doc.ents:
                    label = ent.label_
                    text_val = ent.text
                    
                    category = None
                    if label == "ORG":
                        if "ministry" in text_val.lower() or "department" in text_val.lower():
                            category = "ministries"
                        else:
                            category = "organizations"
                    elif label in ["GPE", "LOC"]:
                        category = "locations"
                    elif label == "DATE":
                        category = "dates"
                    elif label == "LAW":
                        category = "laws"
                        
                    if category and text_val not in entities[category]:
                        entities[category].append(text_val)
                
                # Update record
                record["entities"] = entities
            
            # Save back (overwrite the cleaned file with entities)
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(records, f, indent=4, ensure_ascii=False)
                
        logging.info("Entity extraction complete.")
        print("Entity extraction complete for all records.")

    except Exception as e:
        logging.error(f"Error in entity extraction: {e}")

if __name__ == "__main__":
    extract_entities()
