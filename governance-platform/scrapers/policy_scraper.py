import requests
from bs4 import BeautifulSoup
import json
import logging
import time
from datetime import datetime
from config.settings import LOG_FILE, POLICIES_DIR, REQUEST_TIMEOUT, USER_AGENT
from pipelines.data_cleaner import clean_text

# Setup logging
logging.basicConfig(filename=LOG_FILE, level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')

def scrape_pib_policies():
    """
    Scrape policy announcements from Press Information Bureau.
    Note: Real-world scraping would use a date-range loop. 
    This implementation focuses on the latest announcements as a demonstration.
    """
    url = "https://pib.gov.in/allRel.aspx"
    headers = {"User-Agent": USER_AGENT}
    
    policies = []
    
    try:
        response = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, "html.parser")
        
        # PIB structure: Releases are usually in a <ul> with class 'release_list'
        # This is a sample logic; PIB structure is known to be complex and use dynamic loading/ASP.NET.
        release_items = soup.find_all("li")
        
        for item in release_items:
            link_tag = item.find("a")
            if link_tag and "PressReleasePage.aspx" in link_tag.get("href", ""):
                title = clean_text(link_tag.text)
                link = "https://pib.gov.in/" + link_tag.get("href").lstrip("/")
                
                # Further extraction: Ministry and Date (often in the text or surrounding tags)
                # Sample logic:
                policy_data = {
                    "policy_title": title,
                    "ministry": "Various", # Extractable from the full page
                    "policy_description": "", # Extractable by visiting the PRID page
                    "announcement_date": datetime.now().strftime("%Y-%m-%d"),
                    "source_url": link
                }
                policies.append(policy_data)
                
                if len(policies) >= 50: # Limit for demo
                    break
        
        # Save to JSON
        output_file = POLICIES_DIR / "policies.json"
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(policies, f, indent=4, ensure_ascii=False)
            
        logging.info(f"Successfully scraped {len(policies)} policies from PIB.")
        
    except Exception as e:
        logging.error(f"Error scraping PIB: {e}")

if __name__ == "__main__":
    scrape_pib_policies()