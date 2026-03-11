import requests
from bs4 import BeautifulSoup
import json
import logging
from config.settings import LOG_FILE, BILLS_DIR, REQUEST_TIMEOUT, USER_AGENT
from pipelines.data_cleaner import clean_text

# Setup logging
logging.basicConfig(filename=LOG_FILE, level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')

def scrape_prs_bills():
    """
    Scrape legislative bills from PRS India.
    """
    url = "https://prsindia.org/billtrack"
    headers = {"User-Agent": USER_AGENT}
    
    bills = []
    
    try:
        response = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, "html.parser")
        
        # PRS Bill Tracker usually has a table or a list of bills
        bill_entries = soup.select(".bill-tracker-list-item") or soup.select("table tr")
        
        for entry in bill_entries:
            # Logic depends on the exact HTML; PRS changes structure occasionally.
            # Example heuristic for table rows:
            cols = entry.find_all("td")
            if len(cols) >= 3:
                bill_name = clean_text(cols[0].text)
                ministry = clean_text(cols[1].text)
                status = clean_text(cols[2].text)
                
                link = ""
                a_tag = cols[0].find("a")
                if a_tag:
                    link = "https://prsindia.org" + a_tag.get("href")
                
                bill_data = {
                    "bill_name": bill_name,
                    "ministry": ministry,
                    "bill_status": status,
                    "introduced_date": "", # Would be in detail page
                    "summary": "", # Would be in detail page
                    "source_url": link
                }
                bills.append(bill_data)
        
        # Save to JSON
        output_file = BILLS_DIR / "bills.json"
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(bills, f, indent=4, ensure_ascii=False)
            
        logging.info(f"Successfully scraped {len(bills)} bills from PRS India.")
        
    except Exception as e:
        logging.error(f"Error scraping PRS India: {e}")

if __name__ == "__main__":
    scrape_prs_bills()