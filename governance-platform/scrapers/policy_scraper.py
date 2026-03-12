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
    # lang=1 is for English, reg=3 is a common region code for PIB
    url = "https://pib.gov.in/allRel.aspx?reg=3&lang=1"
    headers = {"User-Agent": USER_AGENT}
    
    policies = []
    
    try:
        logging.info(f"Scraping PIB from: {url}")
        response = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, "html.parser")
        
        # PIB structure: Releases are in <ul> with class 'release_list'
        release_lists = soup.find_all("ul", class_="release_list")
        
        for r_list in release_lists:
            items = r_list.find_all("li")
            for item in items:
                link_tag = item.find("a")
                if link_tag and "PressReleasePage.aspx" in link_tag.get("href", ""):
                    title = clean_text(link_tag.text)
                    href = link_tag.get("href")
                    # Handle relative vs absolute URLs
                    if href.startswith("http"):
                        link = href
                    else:
                        link = "https://pib.gov.in/" + href.lstrip("/")
                    
                    policy_data = {
                        "policy_title": title,
                        "ministry": "Search for Ministry", # In a more complex scraper, we'd find the preceding h3/h4
                        "policy_description": "",
                        "announcement_date": datetime.now().strftime("%Y-%m-%d"),
                        "source_url": link
                    }
                    policies.append(policy_data)
                    
                    if len(policies) >= 50:
                        break
            if len(policies) >= 50:
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