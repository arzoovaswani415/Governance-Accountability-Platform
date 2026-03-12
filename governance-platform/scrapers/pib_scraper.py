import requests
from bs4 import BeautifulSoup
import json
import logging
import time
import datetime
from pathlib import Path
from config.settings import LOG_FILE, PIB_DIR, REQUEST_TIMEOUT, USER_AGENT

# Setup logging
logging.basicConfig(filename=LOG_FILE, level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')

def scrape_pib_releases(limit=500, years=None):
    """
    Scrape Press Information Bureau releases with year-based iteration if provided, otherwise sample history.
    """
    headers = {"User-Agent": USER_AGENT}
    releases = []
    
    # Load existing to avoid duplicates as per Step 6
    output_file = PIB_DIR / "pib_releases.json"
    seen_urls = set()
    seen_titles = set()
    if output_file.exists():
        try:
            with open(output_file, "r", encoding="utf-8") as f:
                existing = json.load(f)
                for r in existing:
                    seen_urls.add(r.get("source_url"))
                    seen_titles.add(r.get("title", "").lower().strip())
                    releases.append(r)
        except Exception: pass
    
    # Use range from 2004 to present
    target_years = years or range(2004, datetime.date.today().year + 1)
    
    try:
        logging.info(f"Starting PIB scraping for years: {list(target_years)}")
        
        for year in target_years:
            # PIB allRel.aspx usually allows browsing by month/day/year
            # Sampling key days (1st and 15th) for efficiency
            for month in range(1, 13):
                for day in [1, 15]: 
                    if year == datetime.date.today().year and month > datetime.date.today().month:
                        continue
                        
                    pib_url = f"https://pib.gov.in/allRel.aspx?d={day}&m={month}&y={year}"
                    logging.info(f"Fetching PIB releases for {day}/{month}/{year}")
                    
                    try:
                        response = requests.get(pib_url, headers=headers, timeout=REQUEST_TIMEOUT)
                        if response.status_code != 200: continue
                        
                        soup = BeautifulSoup(response.content, "html.parser")
                        rel_links = soup.select('a[href*="PressReleasePage.aspx?PRID="]')
                        
                        count = 0
                        for link_tag in rel_links:
                            title = link_tag.text.strip()
                            if not title or len(title) < 10: continue
                            
                            href = link_tag.get("href")
                            prid = href.split("PRID=")[1].split("&")[0] if "PRID=" in href else ""
                            if not prid: continue
                            
                            full_url = f"https://pib.gov.in/PressReleasePage.aspx?PRID={prid}"
                            
                            # Deduplication Step 6
                            if full_url in seen_urls or title.lower().strip() in seen_titles: continue
                            seen_urls.add(full_url)
                            seen_titles.add(title.lower().strip())

                            releases.append({
                                "title": title,
                                "ministry": "Various", 
                                "date": f"{year}-{month:02d}-{day:02d}",
                                "year": year,
                                "source_url": full_url,
                                "content": f"PIB Press Release: {title}. PRID: {prid}."
                            })
                            count += 1
                            if len(releases) >= limit: break
                        
                        logging.info(f"Collected {count} releases for {day}/{month}/{year}")
                        time.sleep(0.5)
                        
                    except Exception as e:
                        logging.error(f"Error fetching PIB for {day}/{month}/{year}: {e}")
                    
                    if len(releases) >= limit: break
                if len(releases) >= limit: break
            if len(releases) >= limit: break
        
        # Save to JSON
        output_file = PIB_DIR / "pib_releases.json"
        with open(output_file, "w", encoding="utf-8") as f:
            json.dump(releases, f, indent=4, ensure_ascii=False)
            
        logging.info(f"Successfully scraped {len(releases)} PIB releases.")
        print(f"PIB Scraper: Collected {len(releases)} records.")

    except Exception as e:
        logging.error(f"Critical error in PIB scraper: {e}")

if __name__ == "__main__":
    scrape_pib_releases()
