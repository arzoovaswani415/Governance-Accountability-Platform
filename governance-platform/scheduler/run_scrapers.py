from scrapers.manifesto_scraper import download_manifestos
from scrapers.manifesto_pdf_parser import parse_manifestos
from scrapers.policy_scraper import scrape_pib_policies
from scrapers.bills_scraper import scrape_prs_bills
from scrapers.opengov_scraper import fetch_gov_datasets
from scrapers.news_api import fetch_news
import logging
from config.settings import LOG_FILE

# Setup logging
logging.basicConfig(filename=LOG_FILE, level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')

def run_all_scrapers():
    """
    Sequence:
    1. scrape_manifestos() -> download_manifestos()
    2. parse_manifestos()
    3. scrape_policies() -> scrape_pib_policies()
    4. scrape_bills() -> scrape_prs_bills()
    5. scrape_datasets() -> fetch_gov_datasets()
    6. fetch_news()
    """
    logging.info("Starting Data Collection Pipeline...")
    
    print("Step 1: Downloading Manifestos...")
    download_manifestos()
    
    print("Step 2: Parsing Manifestos...")
    parse_manifestos()
    
    print("Step 3: Scraping Government Policies...")
    scrape_pib_policies()
    
    print("Step 4: Scraping Parliamentary Bills...")
    scrape_prs_bills()
    
    print("Step 5: Fetching Government Datasets...")
    fetch_gov_datasets()
    
    print("Step 6: Fetching Recent News...")
    fetch_news()
    
    logging.info("Data Collection Pipeline Completed.")
    print("Pipeline Execution Finished. Check logs/scraper.log for details.")

if __name__ == "__main__":
    run_all_scrapers()