# 🇮🇳 Governance Intelligence Platform - Data Engine

This module is the "Brain" of the platform. It handles everything from collecting raw government data to understanding it using AI and storing it in a high-speed database.

## 🚀 What has been implemented? (Easy Language)

1. **Smart Data Collectors (Scrapers)**: 
   - We built "robots" that visit official websites (PIB, PRS India, NewsAPI) to collect records on government bills, news, and policies from 2004 to today.
   - **No Duplicates**: The system is smart enough to skip records it has already seen.

2. **Data Cleaning**: 
   - Raw text is often messy. We have a "laundry" script that scrubs the data, removes HTML junk, and ensures everything is in a clean, readable format for the AI.

3. **AI Understanding (Embeddings & Entities)**: 
   - We don't just store text; we understand it. Using AI (Embeddings), we convert text into "math" that represents its meaning.
   - We automatically identify important people, organizations, and places mentioned in the documents.

4. **Connecting the Dots (Knowledge Graph)**: 
   - The system automatically links different pieces of data. For example, if a "Manifesto" promised free health insurance and a "Bill" was later passed about it, the system creates a link between them.
   - **Similarity Threshold**: We only create links when the AI is 75% sure they are related.

5. **Direct Database Sync**:
   - Everything we process is automatically uploaded to a **PostgreSQL (Supabase)** database.
   - This keeps the backend and the website perfectly in sync with the latest data.

6. **Automatic Quality Guard (Validator)**:
   - We have a script that checks our progress. If we have fewer than 1000 records or missing years, it automatically triggers the scrapers to find more.

---

## 📂 Project Structure

- `scrapers/`: The "robots" that collect data from the web.
- `processing/`: The AI logic that cleans, understands, and links data.
- `database/`: Scripts to create tables and sync data to your live database.
- `scheduler/`: Orchestrates all scrapers to run at once.
- `data/`: Local storage for the Knowledge Graph and processed files.

## 🛠️ How to use it

### 1. Initial Setup
Install the necessary libraries:
```bash
pip install -r requirements.txt
python -m spacy download en_core_web_sm
```

### 2. Run the Full Engine
This will validate your data, scrape more if needed, process it with AI, and upload it to your database:
```bash
python processing/validate_dataset.py
```

### 3. Check the Status
Run this to see how much data you have in your live database:
```bash
python database/check_schema.py
```

## 📊 Performance Tracking
The system generates a `data/dataset_report.txt` after every run, showing:
- Total nodes (records)
- Total relationships (connections)
- Year-by-year data distribution

---
**Status**: Data is currently being uploaded correctly to the PostgreSQL database.

## 🤝 For Collaborators (Working with the DB)

If you are joining this project, **you do not need to re-scrape the data**. Most governance records (bills, news, policies) are already stored in the shared Supabase database.

### 1. Skip Scraping
Instead of running `python main.py` or `run_scrapers.py`, you can directly query the PostgreSQL tables:
- `bills`: Latest legislation.
- `news`: Relevant media coverage.
- `promises`: Manifesto items & progress.

### 2. Required Setup
Ensure your `.env` file has the shared database credentials (DB_HOST, DB_USER, etc.). If you don't have them, ask for the Supabase access keys.

### 3. When SHOULD you scrape?
Only run the scrapers if:
- You need to update the data with newer 2025/2026 records.
- You are adding a new source (e.g., a new government portal).
- The `validate_dataset.py` report shows a coverage gap.

