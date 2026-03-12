import json
import logging
from pathlib import Path

# Setup logging
LOG_DIR = Path("logs")
LOG_DIR.mkdir(exist_ok=True)
logging.basicConfig(
    filename=LOG_DIR / "processing.log",
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

SECTOR_KEYWORDS = {
    "agriculture": ["farmer", "crop", "irrigation", "agriculture", "fertilizer", "msp", "fci", "harvest"],
    "infrastructure": ["road", "highway", "bridge", "railway", "airport", "port", "transport", "smart city", "metro"],
    "health": ["hospital", "medical", "doctor", "health", "vaccine", "medicine", "ayurveda", "disease", "wellness"],
    "education": ["school", "college", "university", "student", "teacher", "education", "skill", "madrasa", "academic"],
    "economy": ["tax", "fdi", "gdp", "economy", "finance", "banking", "gst", "inflation", "price rise", "investment"],
    "technology": ["it", "digital", "internet", "tech", "software", "innovation", "science", "isro", "broadband"],
    "social_welfare": ["poor", "poverty", "women", "children", "sc", "st", "obc", "tribal", "dalit", "pension"],
    "law_and_order": ["police", "court", "justice", "law", "crime", "terrorism", "security", "ipc", "crpc", "judicial"]
}

def classify_sector(text):
    if not text:
        return "general"
    
    text = text.lower()
    scores = {sector: 0 for sector in SECTOR_KEYWORDS}
    
    for sector, keywords in SECTOR_KEYWORDS.items():
        for kw in keywords:
            if kw in text:
                scores[sector] += 1
    
    best_sector = max(scores, key=scores.get)
    if scores[best_sector] == 0:
        return "general"
    return best_sector

def classify_all():
    try:
        cleaned_dir = Path("data/cleaned")
        for file_path in cleaned_dir.glob("*.json"):
            logging.info(f"Classifying sectors for {file_path.name}...")
            with open(file_path, "r", encoding="utf-8") as f:
                records = json.load(f)
            
            for record in records:
                # Use cleaned_text and title
                text = (record.get("cleaned_text", "") + " " + (record.get("headline") or record.get("title", ""))).lower()
                record["sector"] = classify_sector(text)
            
            # Save back
            with open(file_path, "w", encoding="utf-8") as f:
                json.dump(records, f, indent=4, ensure_ascii=False)
                
        logging.info("Sector classification complete.")
        print("Sector classification complete for all records.")

    except Exception as e:
        logging.error(f"Error in sector classification: {e}")

if __name__ == "__main__":
    classify_all()
