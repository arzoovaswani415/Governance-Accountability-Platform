# Governance Intelligence Platform - Module 1: Data Collection

This module implements a robust data collection pipeline for analyzing the relationship between election manifestos, government policies, parliamentary bills, public datasets, and news coverage in India.

## Project Structure

- `scrapers/`: Individual scrapers for manifestos, PIB, PRS India, Data.gov.in, and NewsAPI.
- `pipelines/`: Data cleaning and normalization logic.
- `scheduler/`: Orchestration logic to run the sequence.
- `data/`: Local storage for raw and processed JSON data.
- `config/`: Environment configuration and paths.
- `logs/`: Scraper logs.

## Setup

1. **Environment Variables**:
   Update the `.env` file with your API keys:
   - `NEWS_API_KEY`: Get from [NewsAPI.org](https://newsapi.org/)
   - `DATA_GOV_API_KEY`: Get from [Data.gov.in](https://data.gov.in/)

2. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

## Usage

Run the entire pipeline:
```bash
python main.py
```

Or run individual scrapers:
```bash
python scrapers/manifesto_scraper.py
python scrapers/manifesto_pdf_parser.py
```

## Data Sources

1. **Election Manifestos**: Downloads PDFs for BJP and INC (2004, 2009, 2014, 2019, 2024) and parses them into structured JSON using PyMuPDF.
2. **Government Policies**: Scrapes latest policy announcements from Press Information Bureau (PIB).
3. **Parliamentary Bills**: Scrapes legislative bills from PRS India.
4. **Government Open Data**: Fetches datasets related to economy, health, etc., from Data.gov.in API.
5. **News Data**: Fetches recent news articles related to Indian government policies from NewsAPI.

## Data Cleaning
Scraped text is cleaned to remove extra whitespace, newlines, and HTML tags using the `pipelines/data_cleaner.py` utility.

## Error Handling
All scrapers include robust `try/except` blocks and log failures to `logs/scraper.log`.
