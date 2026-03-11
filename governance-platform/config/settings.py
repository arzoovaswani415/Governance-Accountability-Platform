import os
from pathlib import Path
from dotenv import load_dotenv

# Base directory
BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables
load_dotenv(BASE_DIR / ".env")

# API Keys
NEWS_API_KEY = os.getenv("NEWS_API_KEY")
DATA_GOV_API_KEY = os.getenv("DATA_GOV_API_KEY")

# Data Paths
DATA_DIR = BASE_DIR / "data"
RAW_MANIFESTO_DIR = DATA_DIR / "raw" / "manifestos"
PROCESSED_MANIFESTO_DIR = DATA_DIR / "processed" / "manifestos"
POLICIES_DIR = DATA_DIR / "policies"
BILLS_DIR = DATA_DIR / "bills"
NEWS_DIR = DATA_DIR / "news"
DATASETS_DIR = DATA_DIR / "datasets"

# Ensure directories exist
for path in [RAW_MANIFESTO_DIR, PROCESSED_MANIFESTO_DIR, POLICIES_DIR, BILLS_DIR, NEWS_DIR, DATASETS_DIR]:
    path.mkdir(parents=True, exist_ok=True)

# Logs
LOG_DIR = BASE_DIR / "logs"
LOG_DIR.mkdir(exist_ok=True)
LOG_FILE = LOG_DIR / "scraper.log"

# Scraper Settings
REQUEST_TIMEOUT = 30
USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"

# URLs
SOURCES = {
    "BJP_MANIFESTO_LIST": "https://www.bjp.org/manifesto", # Placeholder for real source logic
    "INC_MANIFESTO_LIST": "https://www.inc.in/media/manifesto", # Placeholder
    "PIB_DATA": "https://pib.gov.in/PressReleasePage.aspx",
    "PRS_BILLS": "https://prsindia.org/billtrack"
}

# Manifesto Election Years
ELECTION_YEARS = [2004, 2009, 2014, 2019, 2024]