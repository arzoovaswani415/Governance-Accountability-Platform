import requests
import json
import logging
import os
from config.settings import LOG_FILE, DATASETS_DIR, DATA_GOV_API_KEY, REQUEST_TIMEOUT

# Setup logging
logging.basicConfig(filename=LOG_FILE, level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')

def fetch_gov_datasets():
    """
    Fetch datasets from Data.gov.in API.
    """
    if not DATA_GOV_API_KEY or DATA_GOV_API_KEY == "your_datagov_api_key":
        logging.warning("DATA_GOV_API_KEY not set. Skipping Gov Data fetching.")
        return

    # List of resource IDs related to categories (These are examples)
    RESOURCE_IDS = [
        "859735a1-795f-4851-9173-fdc3d3145d15", # Economy example
        "d048d2bc-6860-4b1a-9653-60589d1b0d2d"  # Health example
    ]
    
    all_datasets = []
    
    for resource_id in RESOURCE_IDS:
        url = f"https://api.data.gov.in/resource/{resource_id}?api-key={DATA_GOV_API_KEY}&format=json"
        
        try:
            logging.info(f"Fetching dataset from resource: {resource_id}")
            response = requests.get(url, timeout=REQUEST_TIMEOUT)
            response.raise_for_status()
            
            data = response.json()
            
            # Structure from Data.gov.in
            dataset_info = {
                "dataset_name": data.get("title", f"Dataset {resource_id}"),
                "department": data.get("org_type", "Unknown"),
                "description": data.get("desc", ""),
                "tags": data.get("sector", []),
                "dataset_url": url,
                "records": data.get("records", [])
            }
            all_datasets.append(dataset_info)
            
        except Exception as e:
            logging.error(f"Error fetching resource {resource_id}: {e}")

    # Save to JSON
    output_file = DATASETS_DIR / "gov_datasets.json"
    with open(output_file, "w", encoding="utf-8") as f:
        json.dump(all_datasets, f, indent=4, ensure_ascii=False)
        
    logging.info(f"Successfully fetched {len(all_datasets)} datasets from Data.gov.in.")

if __name__ == "__main__":
    fetch_gov_datasets()