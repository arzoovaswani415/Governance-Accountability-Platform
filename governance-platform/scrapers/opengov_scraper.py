import requests
import json
import logging
import time
from pathlib import Path
from config.settings import LOG_FILE, DATASETS_DIR, DATA_GOV_API_KEY, REQUEST_TIMEOUT

# Setup logging
logging.basicConfig(filename=LOG_FILE, level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')

def fetch_gov_datasets_enriched():
    """
    Fetch more datasets from Data.gov.in API across multiple sectors.
    """
    if not DATA_GOV_API_KEY or DATA_GOV_API_KEY == "your_datagov_api_key":
        logging.warning("DATA_GOV_API_KEY not set. Skipping Gov Data fetching.")
        return

    # Map sectors to Resource IDs (approximate examples for each sector)
    SECTOR_RESOURCES = {
        "economy": ["859735a1-795f-4851-9173-fdc3d3145d15", "64344d18-9366-4c4f-9e73-b6059d1b0d2d"],
        "agriculture": ["9471f544-463e-43f0-8e45-12d83769910d", "d048d2bc-6860-4b1a-9653-60589d1b0d2d"],
        "healthcare": ["42b1f8f0-1e5b-4395-938b-6f4e8b39360c"],
        "infrastructure": ["b8770519-21c6-47c2-839f-a0c59d1b0d2d"],
        "education": ["ef399589-3221-4965-9856-11f2699910d6"]
    }
    
    all_datasets = []
    
    for sector, resource_list in SECTOR_RESOURCES.items():
        for resource_id in resource_list:
            # We use limit=50 to get more records per resource if available
            url = f"https://api.data.gov.in/resource/{resource_id}?api-key={DATA_GOV_API_KEY}&format=json&limit=50"
            
            try:
                logging.info(f"Fetching {sector} dataset from resource: {resource_id}")
                response = requests.get(url, timeout=60)
                response.raise_for_status()
                
                data = response.json()
                
                # Each record in the dataset is a potentially rich data point
                # We extract the metadata and individual records
                records = data.get("records", [])
                
                for i, rec in enumerate(records):
                    # Create a composite summary from the record data
                    rec_summary = ", ".join([f"{k}: {v}" for k, v in rec.items() if v])
                    
                    dataset_item = {
                        "title": f"{data.get('title', 'Dataset')} - Record {i+1}",
                        "department": data.get("org_type", "Government of India"),
                        "description": f"{data.get('desc', '')}. Details: {rec_summary}",
                        "sector": sector,
                        "resource_id": resource_id,
                        "dataset_url": url
                    }
                    all_datasets.append(dataset_item)
                
                logging.info(f"Added {len(records)} records from {resource_id}")
                time.sleep(1) # Rate limit protection

            except Exception as e:
                logging.error(f"Error fetching Gov Data resource {resource_id}: {e}")

    # Save to JSON
    output_file = DATASETS_DIR / "gov_datasets.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(all_datasets, f, indent=4, ensure_ascii=False)
        
    logging.info(f"Successfully fetched {len(all_datasets)} dataset records from Data.gov.in.")
    print(f"Gov Data Scraper: Collected {len(all_datasets)} records.")

if __name__ == "__main__":
    fetch_gov_datasets_enriched()