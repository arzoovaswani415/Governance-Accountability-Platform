import requests
from bs4 import BeautifulSoup
import json
import logging
import time
import datetime
import random
from pathlib import Path
import sys
import os

# Add project root to path for imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from config.settings import LOG_FILE, DATA_DIR, REQUEST_TIMEOUT, USER_AGENT
except ImportError:
    # Fallback default values
    BASE_DIR = Path(__file__).resolve().parent.parent
    DATA_DIR = BASE_DIR / "data"
    LOG_FILE = BASE_DIR / "logs" / "pib_scraper.log"
    REQUEST_TIMEOUT = 30
    USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"

# Setup logging
Path(LOG_FILE).parent.mkdir(parents=True, exist_ok=True)
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(LOG_FILE, encoding='utf-8'),
        logging.StreamHandler(sys.stdout)
    ]
)

class PIBScraper:
    """
    A robust scraper for the Press Information Bureau (PIB) website.
    Collects press release metadata and performs deep scraping of article content.
    """

    def __init__(self, output_filename="pib_articles.json"):
        self.headers = {"User-Agent": USER_AGENT}
        self.output_file = DATA_DIR / output_filename
        self.base_url = "https://pib.gov.in"
        self.session = requests.Session()
        self.session.headers.update(self.headers)
        
        # Ensure data directory exists
        self.output_file.parent.mkdir(parents=True, exist_ok=True)

    def fetch_page(self, url, retries=3, backoff=2):
        """Fetch a URL with retry logic and error handling."""
        for i in range(retries):
            try:
                response = self.session.get(url, timeout=REQUEST_TIMEOUT)
                response.raise_for_status()
                return response
            except requests.RequestException as e:
                wait_time = (backoff ** i) + random.uniform(0, 1)
                logging.warning(f"Attempt {i+1} failed for {url}: {e}. Retrying in {wait_time:.2f}s...")
                time.sleep(wait_time)
        
        logging.error(f"Failed to fetch {url} after {retries} attempts.")
        return None

    def scrape_article_details(self, url):
        """
        Visits a specific press release page and extracts deep details.
        Returns a dictionary with title, date, ministry, full_text, and article_url.
        """
        logging.info(f"Deep scraping article: {url}")
        response = self.fetch_page(url)
        if not response:
            return None

        try:
            soup = BeautifulSoup(response.content, "html.parser")
            
            # 1. Extract Title
            title = ""
            title_div = soup.find("div", class_="Release_Heding")
            if title_div:
                title = title_div.get_text(strip=True)
            else:
                h2 = soup.find("h2")
                title = h2.get_text(strip=True) if h2 else "No Title Found"

            # 2. Extract Ministry and Date from the metadata section
            ministry = "Various"
            date_str = ""
            meta_div = soup.find("div", class_="Release_Date_Time")
            
            if meta_div:
                # PIB metadata often contains multiple lines: Ministry, Date/Time, and Location
                meta_text = meta_div.get_text(separator="|", strip=True)
                parts = [p.strip() for p in meta_text.split("|") if p.strip()]
                
                # Heuristic: Ministry usually contains "Ministry of" or is the first part
                for part in parts:
                    if "Ministry of" in part:
                        ministry = part
                        break
                
                # Date extraction: looks for "Posted On:"
                for part in parts:
                    if "Posted On:" in part:
                        date_str = part.replace("Posted On:", "").strip()
                        break
                
                # If ministry still "Various", take the first part if it's not the date line
                if ministry == "Various" and parts and "Posted On" not in parts[0]:
                    ministry = parts[0]

            # 3. Extract Full Text
            full_text = ""
            content_div = soup.find("div", class_="ReleaseText")
            if not content_div:
                # Fallback to general content container
                content_div = soup.find("div", id="form1")
                
            if content_div:
                # Clean HTML: remove scripts, styles, and non-content tags
                for tag in content_div(["script", "style", "iframe", "form", "footer"]):
                    tag.decompose()
                
                # Extract text while preserving some structure with newlines
                full_text = content_div.get_text(separator="\n", strip=True)
            
            # 4. Optional: Newspaper3k enhancement if BS4 fails to find meaningful text
            if len(full_text) < 100:
                try:
                    from newspaper import Article
                    article = Article(url)
                    article.download()
                    article.parse()
                    if len(article.text) > len(full_text):
                        full_text = article.text
                except ImportError:
                    pass # newspaper3k not installed
                except Exception as e:
                    logging.debug(f"Newspaper3k extraction failed: {e}")

            return {
                "title": title,
                "date": date_str,
                "ministry": ministry,
                "full_text": full_text,
                "article_url": url
            }

        except Exception as e:
            logging.error(f"Error parsing content for {url}: {e}")
            return None

    def get_links_from_day(self, day, month, year):
        """Scrapes the PIB index page for a specific day to find all press release links."""
        url = f"{self.base_url}/allRel.aspx?d={day}&m={month}&y={year}"
        logging.info(f"Checking index: {day}/{month}/{year}")
        
        response = self.fetch_page(url)
        if not response:
            return []

        soup = BeautifulSoup(response.content, "html.parser")
        # PIB release links typically contain PRID
        rel_links = soup.select('a[href*="PressReleasePage.aspx?PRID="]')
        
        unique_urls = set()
        for link in rel_links:
            href = link.get("href")
            # Construct full URL
            if "PRID=" in href:
                prid = href.split("PRID=")[1].split("&")[0]
                full_url = f"{self.base_url}/PressReleasePage.aspx?PRID={prid}"
                unique_urls.add(full_url)
        
        return list(unique_urls)

    def run(self, days=None, months=None, years=None, limit=None):
        """
        Orchestrates the scraping process.
        - days/months/years: lists of integers to scrape. Defaults to current date.
        - limit: maximum number of articles to scrape in this run.
        """
        today = datetime.date.today()
        target_days = days or [today.day]
        target_months = months or [today.month]
        target_years = years or [today.year]
        
        # Load existing data to avoid duplicates
        existing_data = []
        if self.output_file.exists():
            try:
                with open(self.output_file, "r", encoding="utf-8") as f:
                    existing_data = json.load(f)
            except Exception as e:
                logging.error(f"Error loading existing data: {e}")
        
        seen_urls = {item["article_url"] for item in existing_data}
        scraped_count = 0
        
        logging.info(f"Starting PIB Scraper run. Output: {self.output_file}")

        try:
            for year in target_years:
                for month in target_months:
                    for day in target_days:
                        article_urls = self.get_links_from_day(day, month, year)
                        
                        for url in article_urls:
                            if url in seen_urls:
                                continue
                            
                            details = self.scrape_article_details(url)
                            if details:
                                existing_data.append(details)
                                seen_urls.add(url)
                                scraped_count += 1
                                
                                # Incremental save to prevent data loss on crash
                                self._save_json(existing_data)
                                
                                # Respectful throttling
                                time.sleep(random.uniform(1.0, 2.5))
                                
                            if limit and scraped_count >= limit:
                                logging.info(f"Reached limit of {limit} articles.")
                                break
                        
                        if limit and scraped_count >= limit: break
                    if limit and scraped_count >= limit: break
                if limit and scraped_count >= limit: break

        except KeyboardInterrupt:
            logging.info("Scraping interrupted by user.")
        finally:
            self._save_json(existing_data)
            logging.info(f"Run completed. Scraped {scraped_count} new articles. Total in file: {len(existing_data)}")

    def _save_json(self, data):
        """Helper to save data to the JSON output file."""
        try:
            with open(self.output_file, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=4, ensure_ascii=False)
        except Exception as e:
            logging.error(f"Failed to save data to {self.output_file}: {e}")

if __name__ == "__main__":
    # Example usage: scrape recent releases
    scraper = PIBScraper()
    
    # Scrape today's releases
    # To scrape a historical range, you could pass specific years/months/days
    # Example: scraper.run(years=[2024], months=[3], days=list(range(1, 15)), limit=20)
    scraper.run(limit=10)

