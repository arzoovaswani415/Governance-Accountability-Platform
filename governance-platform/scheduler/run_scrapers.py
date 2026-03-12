import logging
import sys
from pathlib import Path

# Add current directory to path
sys.path.append(str(Path(__file__).parent.parent))

from scrapers.manifesto_scraper import download_manifestos
from scrapers.manifesto_pdf_parser import parse_manifestos
from scrapers.bills_scraper import scrape_prs_bills_enriched
from scrapers.opengov_scraper import fetch_gov_datasets_enriched
from scrapers.news_api import fetch_news_enriched
from scrapers.pib_scraper import scrape_pib_releases
from config.settings import LOG_FILE

# Setup logging
logging.basicConfig(filename=LOG_FILE, level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')

def run_all_scrapers():
    """
    Orchestrate all scrapers to reach 1000+ records.
    """
    logging.info("Starting Expanded Data Collection Pipeline...")
    print("--- Starting Data Collection (Goal: 1000+ Records) ---")
    
    # Step 1: Manifestos (usually pre-existing or slow)
    print("Step 1: Parsing Manifestos...")
    try:
        parse_manifestos()
    except Exception as e:
        print(f"Manifesto parsing failed: {e}")
    
    # Step 2: PRS Bills (PRS Legislative Research)
    print("Step 2: Scraping Parliamentary Bills (PRS)...")
    scrape_prs_bills_enriched(limit=1000)
    
    # Step 3: PIB Press Releases
    print("Step 3: Scraping Government Press Releases (PIB)...")
    scrape_pib_releases(limit=500)
    
    # Step 4: Government Datasets (Data.gov.in)
    print("Step 4: Fetching Government Datasets (Data.gov.in)...")
    fetch_gov_datasets_enriched()
    
    # Step 5: News Articles (NewsAPI)
    print("Step 5: Fetching News Articles...")
    fetch_news_enriched(target_count=1000)
    
    logging.info("Expanded Data Collection Pipeline Completed.")
    print("--- Data Collection Finished ---")

if __name__ == "__main__":
    run_all_scrapers()