import fitz  # PyMuPDF
import json
import logging
import os
from pathlib import Path
from config.settings import RAW_MANIFESTO_DIR, PROCESSED_MANIFESTO_DIR, LOG_FILE
from pipelines.data_cleaner import clean_text

# Setup logging
logging.basicConfig(filename=LOG_FILE, level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')

def parse_manifestos():
    all_manifestos = []
    
    # Iterate through year directories
    for year_dir in RAW_MANIFESTO_DIR.iterdir():
        if year_dir.is_dir():
            year = year_dir.name
            for pdf_file in year_dir.glob("*.pdf"):
                party_name = pdf_file.name.split("_")[0].split(".")[0]
                
                logging.info(f"Parsing {pdf_file}")
                try:
                    doc = fitz.open(pdf_file)
                    text = ""
                    for page in doc:
                        text += page.get_text()
                    doc.close()
                    
                    cleaned_text = clean_text(text)
                    
                    manifesto_data = {
                        "party_name": party_name,
                        "election_year": int(year),
                        "promise_text": cleaned_text,
                        "category": "General", # Simple extraction for now
                        "source_url": "", # Would be stored if fetched dynamically
                        "manifesto_file": str(pdf_file.name)
                    }
                    all_manifestos.append(manifesto_data)
                    
                except Exception as e:
                    logging.error(f"Error parsing {pdf_file}: {e}")

    # Save to processed JSON
    output_file = PROCESSED_MANIFESTO_DIR / "manifestos.json"
    try:
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(all_manifestos, f, indent=4, ensure_ascii=False)
        logging.info(f"Successfully saved parsed manifestos to {output_file}")
    except Exception as e:
        logging.error(f"Failed to save manifestos.json: {e}")

if __name__ == "__main__":
    parse_manifestos()
