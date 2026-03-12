import os
import json
import re
import logging
from bs4 import BeautifulSoup
from pathlib import Path

# Setup logging
LOG_DIR = Path("logs")
LOG_DIR.mkdir(exist_ok=True)
logging.basicConfig(
    filename=LOG_DIR / "processing.log",
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def clean_text(text):
    if not text:
        return ""
    # remove HTML
    text = BeautifulSoup(text, "html.parser").get_text()
    # remove newline characters and tabs
    text = re.sub(r'[\r\n\t]+', ' ', text)
    # normalize spaces
    text = re.sub(r'\s+', ' ', text).strip()
    return text

def process_file(file_path, output_dir):
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
        
        cleaned_records = []
        seen = set()

        # Some files might be lists, some might be dicts with lists (like news.json structure)
        records = data if isinstance(data, list) else data.get("articles", [])
        
        for record in records:
            # Task: remove empty or duplicate records
            # We define duplicate by the content (cleaned_text) and title/party
            
            # Extract content field based on category
            content_keys = ["promise_text", "content", "description", "summary", "text"]
            text_content = ""
            for k in content_keys:
                if k in record and record[k]:
                    text_content = record[k]
                    break
            
            # Fallback to title/name if content is empty
            if not text_content:
                title_keys = ["headline", "bill_name", "title", "policy_name", "party_name"]
                for k in title_keys:
                    if k in record and record[k]:
                        text_content = record[k]
                        break
            
            cleaned_content = clean_text(text_content)
            if not cleaned_content:
                continue
            
            # Create a unique key for deduplication
            title = record.get("title", record.get("party_name", ""))
            unique_key = f"{title}_{cleaned_content[:200]}" # Simple hash-like key
            
            if unique_key in seen:
                continue
            seen.add(unique_key)
            
            # Ensure standardized fields
            title_keys = ["title", "headline", "bill_title", "policy_name", "party_name", "bill_name"]
            final_title = ""
            for k in title_keys:
                if record.get(k):
                    final_title = record[k]
                    break
            
            record["title"] = clean_text(final_title) if final_title else "Untitled Record"
            record["cleaned_text"] = cleaned_content
            
            # Ensure sector
            record["sector"] = clean_text(record.get("sector") or record.get("query_sector") or record.get("category") or "General")
            
            # Ensure source
            if "news" in file_path.name:
                record["source"] = "NewsAPI"
            elif "bills" in file_path.name:
                record["source"] = "PRS Legislative Research"
            elif "pib" in file_path.name or "policies" in file_path.name:
                record["source"] = "Press Information Bureau"
            elif "datasets" in file_path.name:
                record["source"] = "data.gov.in"
            elif "manifestos" in file_path.name:
                record["source"] = "Party Manifesto"
            else:
                record["source"] = record.get("source") or record.get("source_url") or "Unknown Data Source"
                
            # Ensure year
            year_val = record.get("year") or record.get("election_year")
            if not year_val and record.get("published_at"):
                year_val = record["published_at"][:4]
            if not year_val and record.get("date"):
                year_val = record["date"][:4]
                
            if str(year_val).startswith("2004-2025") or (isinstance(year_val, str) and "-" in year_val and len(year_val) != 10):
                match = re.search(r'\b(19\d{2}|20\d{2})\b', record.get("title", ""))
                if match:
                    year_val = match.group(0)
                    
            if year_val and str(year_val)[:4].isdigit():
                record["year"] = int(str(year_val)[:4])
            else:
                match = re.search(r'\b(19\d{2}|20\d{2})\b', record.get("title", ""))
                if match:
                    record["year"] = int(match.group(0))
                else:
                    record["year"] = 2026  # Safe integer fallback

            # Remove old redundant title keys if desired, but keeping them is fine.
            # We just add standardized ones.
            
            cleaned_records.append(record)
        
        # Save
        output_path = output_dir / f"{file_path.stem}_cleaned.json"
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(cleaned_records, f, indent=4, ensure_ascii=False)
        
        logging.info(f"Cleaned {file_path.name}: {len(cleaned_records)} records saved to {output_path.name}")
        return len(cleaned_records)

    except Exception as e:
        logging.error(f"Error processing {file_path}: {e}")
        return 0

def run_cleaning():
    data_root = Path("data")
    output_dir = Path("data/cleaned")
    output_dir.mkdir(parents=True, exist_ok=True)
    
    # Relevant subdirectories containing raw data
    source_dirs = ["processed", "bills", "news", "datasets", "policies"]
    
    total_processed = 0
    for s_dir in source_dirs:
        dir_path = data_root / s_dir
        if not dir_path.exists():
            continue
            
        for file_path in dir_path.rglob("*.json"):
            if file_path.is_file():
                count = process_file(file_path, output_dir)
                total_processed += count
            
    print(f"Data cleaning complete. Total records: {total_processed}")

if __name__ == "__main__":
    run_cleaning()
