import requests
from bs4 import BeautifulSoup
import json
import logging
import time
import re
import datetime
from pathlib import Path
from config.settings import LOG_FILE, BILLS_DIR, REQUEST_TIMEOUT, USER_AGENT

# Setup logging
logging.basicConfig(filename=LOG_FILE, level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')

def scrape_prs_bills_enriched(limit=1000, years=None):
    """
    Scrape legislative bills from PRS India using year-based filtering.
    """
    headers = {"User-Agent": USER_AGENT}
    bills = []
    
    # Load existing to avoid duplicates as per Step 6
    output_file = BILLS_DIR / "bills.json"
    seen_urls = set()
    seen_titles = set()
    if output_file.exists():
        try:
            with open(output_file, "r", encoding="utf-8") as f:
                existing = json.load(f)
                for b in existing:
                    seen_urls.add(b.get("source_url"))
                    seen_titles.add(b.get("bill_title", "").lower().strip())
                    bills.append(b)
        except Exception: pass
    
    # Range from 2004 to present as per user preference
    target_years = years or range(2004, datetime.datetime.now().year + 1)
    
    try:
        logging.info(f"Starting PRS Bill scraping for years: {list(target_years)}")
        
        for year in target_years:
            # Browser investigation found this URL pattern
            url = f"https://prsindia.org/billtrack/category/billtrack?BillActsBillsParliamentSearch[date_of_introduction]={year}"
            logging.info(f"Fetching PRS bills for year: {year}")
            
            try:
                response = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT)
                if response.status_code != 200: continue
                
                soup = BeautifulSoup(response.content, "html.parser")
                bill_links = soup.select('div.views-row a[href^="/billtrack/"]')
                
                if not bill_links:
                    bill_links = soup.find_all("a", href=lambda h: h and "/billtrack/" in h and "/category/" not in h)

                for link_tag in bill_links:
                    title = link_tag.text.strip()
                    if not title or len(title) < 5: continue
                    
                    href = link_tag.get("href")
                    link = "https://prsindia.org" + href if href.startswith("/") else href
                    
                    # Deduplication Step 6
                    if link in seen_urls or title.lower().strip() in seen_titles: continue
                    seen_urls.add(link)
                    seen_titles.add(title.lower().strip())

                    # Extract year from title if possible, otherwise use the loop year
                    match = re.search(r'\b(19\d{2}|20\d{2})\b', title)
                    bill_year = int(match.group(0)) if match else year

                    bill_data = {
                        "bill_title": title,
                        "ministry": "Legislative Research",
                        "bill_status": "Tracked",
                        "year": bill_year,
                        "summary": f"Bill summary for {title}. Tracked via PRS Legislative Research.",
                        "source_url": link,
                        "category": "Legislative"
                    }
                    bills.append(bill_data)
                    
                    if len(bills) >= limit:
                        break
            except Exception as e:
                logging.error(f"Error fetching bills for {year}: {e}")
            
            if len(bills) >= limit:
                break
            time.sleep(1)
        
        # Save to JSON
        output_file = BILLS_DIR / "bills.json"
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(bills, f, indent=4, ensure_ascii=False)
            
        logging.info(f"Successfully scraped {len(bills)} bills from PRS India.")
        print(f"PRS Scraper: Collected {len(bills)} bills.")

    except Exception as e:
        logging.error(f"Critical error in PRS scraper: {e}")

if __name__ == "__main__":
    scrape_prs_bills_enriched()