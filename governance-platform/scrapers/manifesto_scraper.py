import requests
import os
import logging
from config.settings import LOG_FILE, RAW_MANIFESTO_DIR, REQUEST_TIMEOUT, USER_AGENT

# Setup logging
logging.basicConfig(filename=LOG_FILE, level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')

MANIFESTO_URLS = {
    2024: {
        "BJP": "https://www.bjp.org/files/2024-04/BJP%20Sankalp%20Patra%202024%20English.pdf",
        "INC": "https://manifesto.inc.in/assets/Congress_Manifesto_2024_EN.pdf"
    },
    2019: {
        "BJP": "https://ia801004.us.archive.org/33/items/sankalp_patra_english_2019/Sankalp_Patra_English_2019.pdf",
        "INC": "https://ia802804.us.archive.org/30/items/congress_manifesto_2019_english/congress_manifesto_2019_english.pdf"
    },
    2014: {
        "BJP": "https://archive.org/download/BjpElectionManifestoEnglish2014/bjp_election_manifesto_english_2014.pdf",
        "INC": "https://archive.org/download/IndianNationalCongressCongressManifesto2014/congress_manifesto_2014.pdf"
    },
    2009: {
        "BJP": "https://archive.org/download/BjpManifesto2009/BJP_Manifesto_2009.pdf",
        "INC": "https://archive.org/download/CongressManifesto2009/Congress_Manifesto_2009.pdf"
    },
    2004: {
        "BJP": "https://archive.org/download/BjpManifesto2004/BJP_Vision_Document_2004.pdf",
        "INC": "https://archive.org/download/CongressManifesto2004/Congress_Manifesto_2004.pdf"
    }
}

def download_manifestos():
    headers = {"User-Agent": USER_AGENT}
    
    for year, parties in MANIFESTO_URLS.items():
        year_dir = RAW_MANIFESTO_DIR / str(year)
        year_dir.mkdir(parents=True, exist_ok=True)
        
        for party, url in parties.items():
            filename = f"{party}_{year}_manifesto.pdf"
            filepath = year_dir / filename
            
            if filepath.exists():
                logging.info(f"File already exists: {filepath}")
                continue
                
            try:
                logging.info(f"Downloading {party} manifesto for {year} from {url}")
                response = requests.get(url, headers=headers, timeout=REQUEST_TIMEOUT)
                response.raise_for_status()
                
                with open(filepath, "wb") as f:
                    f.write(response.content)
                logging.info(f"Successfully downloaded {filename}")
                
            except Exception as e:
                logging.error(f"Failed to download {party} manifesto for {year}: {e}")

if __name__ == "__main__":
    download_manifestos()