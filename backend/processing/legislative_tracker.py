"""
Legislative Evolution Tracker
==============================
Detects how a bill evolves through the legislative process by matching
news articles to bills using sentence-transformer embeddings, then
identifying legislative stage keywords in the relevant articles.

Pipeline:
  1. Load bills from the `bills` table.
  2. Load news articles from the `news` table.
  3. Embed bill names + articles with all-MiniLM-L6-v2.
  4. For each bill, keep news articles with cosine similarity > 0.65.
  5. Search those articles for stage keywords (INTRODUCED, AMENDMENT, etc.)
  6. Insert detected events into `bill_timelines`.
  7. Export full timeline data to data/bill_evolution.json.

Usage:
  cd backend
  python processing/legislative_tracker.py
"""

import json
import logging
import os
import re
import sys
from collections import defaultdict
from pathlib import Path

# ── Path setup ─────────────────────────────────────────────────────────────
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

import psycopg2
from psycopg2.extras import RealDictCursor
from sentence_transformers import SentenceTransformer, util

from app.config import settings

# ── Logging ─────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("legislative_tracker")

# ── Output path ─────────────────────────────────────────────────────────────
DATA_DIR = BACKEND_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_JSON = DATA_DIR / "bill_evolution.json"

# ── Stage keyword dictionary ─────────────────────────────────────────────────
STAGE_KEYWORDS: dict[str, list[str]] = {
    "INTRODUCED": [
        "bill introduced",
        "introduced in parliament",
        "tabled in lok sabha",
        "tabled in rajya sabha",
        "introduced in lok sabha",
    ],
    "AMENDMENT": [
        "bill amended",
        "amendment proposed",
        "amendment approved",
        "amendment moved",
        "amendment passed",
    ],
    "COMMITTEE_REVIEW": [
        "committee review",
        "sent to standing committee",
        "parliamentary committee",
        "referred to committee",
        "select committee",
        "joint committee",
    ],
    "PASSED": [
        "bill passed",
        "approved by parliament",
        "passed both houses",
        "passed in lok sabha",
        "passed in rajya sabha",
        "bill cleared",
    ],
    "IMPLEMENTED": [
        "act notified",
        "law came into force",
        "implementation started",
        "enacted into law",
        "gazette notified",
        "gazette notification",
    ],
}

SIMILARITY_THRESHOLD = 0.65


# ── DB helpers (raw psycopg2 for reads from governance-platform tables) ────

def _get_raw_conn():
    """Open a raw psycopg2 connection from the DATABASE_URL setting."""
    return psycopg2.connect(settings.DATABASE_URL, cursor_factory=RealDictCursor)


def ensure_bill_timelines_table():
    """Create bill_timelines table if it doesn't already exist."""
    ddl = """
    CREATE TABLE IF NOT EXISTS bill_timelines(
        id          SERIAL PRIMARY KEY,
        bill_id     INT REFERENCES bills(id),
        stage       TEXT,
        event_date  DATE,
        description TEXT,
        source_url  TEXT,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """
    conn = _get_raw_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(ddl)
        conn.commit()
        logger.info("bill_timelines table ensured.")
    finally:
        conn.close()


# ── STEP 3: Load bills ───────────────────────────────────────────────────────

def load_bills() -> list[dict]:
    """Query bills table and return list of bill dicts."""
    sql = "SELECT id, name AS bill_name, ministry, introduced_date FROM bills ORDER BY id"
    conn = _get_raw_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(sql)
            rows = cur.fetchall()
    finally:
        conn.close()

    bills = [dict(r) for r in rows]
    logger.info(f"Loaded {len(bills)} bills.")
    return bills


# ── STEP 4: Load news articles ────────────────────────────────────────────────

def load_news_articles() -> list[dict]:
    """Query news table and return list of article dicts with combined content."""
    sql = """
        SELECT
            id,
            headline,
            description,
            article_url,
            published_at
        FROM news
        WHERE headline IS NOT NULL
        ORDER BY published_at DESC
    """
    conn = _get_raw_conn()
    try:
        with conn.cursor() as cur:
            cur.execute(sql)
            rows = cur.fetchall()
    finally:
        conn.close()

    articles = []
    for r in rows:
        row = dict(r)
        # Combine headline + description into a single text for analysis
        combined = f"{row.get('headline', '')} {row.get('description', '') or ''}".strip()
        row["content"] = combined
        articles.append(row)

    logger.info(f"Loaded {len(articles)} news articles.")
    return articles


# ── STEP 5 + 6: Detect legislative stage events ──────────────────────────────

def _find_keyword_sentence(text: str, keywords: list[str]) -> str | None:
    """Return the first sentence in `text` containing any of the keywords."""
    sentences = re.split(r'(?<=[.!?])\s+', text)
    for sentence in sentences:
        for kw in keywords:
            if kw.lower() in sentence.lower():
                return sentence.strip()
    return None


def detect_events(
    bills: list[dict],
    articles: list[dict],
    model: SentenceTransformer,
) -> dict[int, list[dict]]:
    """
    For each bill, find relevant articles (similarity > 0.65) and detect
    legislative stage keywords.

    Returns:
        bill_events: { bill_id: [event_dict, ...] }
    """
    bill_events: dict[int, list[dict]] = defaultdict(list)

    if not bills or not articles:
        logger.warning("No bills or articles to process.")
        return bill_events

    # ── Encode all articles once ──────────────────────────────────────────
    logger.info("Encoding article texts …")
    article_texts = [a["content"] for a in articles]
    article_embeddings = model.encode(article_texts, convert_to_tensor=True, batch_size=64)

    for bill in bills:
        bill_id   = bill["bill_id"]  if "bill_id" in bill else bill["id"]
        bill_id   = bill.get("id", bill_id)
        bill_name = bill.get("bill_name", "")
        ministry  = bill.get("ministry", "") or ""

        query_text = f"{bill_name} {ministry}".strip()
        if not query_text:
            continue

        # Embed the bill query
        bill_embedding = model.encode(query_text, convert_to_tensor=True)

        # Cosine similarity with all articles
        scores = util.cos_sim(bill_embedding, article_embeddings)[0]

        for i, score in enumerate(scores):
            if score.item() < SIMILARITY_THRESHOLD:
                continue

            article = articles[i]
            content = article["content"]

            # Check each stage
            for stage, keywords in STAGE_KEYWORDS.items():
                sentence = _find_keyword_sentence(content, keywords)
                if sentence:
                    event_date = None
                    if article.get("published_at"):
                        pa = article["published_at"]
                        event_date = pa.date() if hasattr(pa, "date") else str(pa)[:10]

                    bill_events[bill.get("id")].append({
                        "bill_id":     bill.get("id"),
                        "stage":       stage,
                        "event_date":  str(event_date) if event_date else None,
                        "description": sentence[:500],     # cap at 500 chars
                        "source_url":  article.get("article_url", ""),
                    })

    logger.info(f"Detected events for {len(bill_events)} bills.")
    return bill_events


# ── STEP 8: Store in database ─────────────────────────────────────────────────

def store_events(bill_events: dict[int, list[dict]]) -> int:
    """
    Insert detected events into bill_timelines.

    Duplicates are avoided by checking (bill_id, stage, event_date).

    Returns:
        Number of rows inserted.
    """
    insert_sql = """
        INSERT INTO bill_timelines (bill_id, stage, event_date, description, source_url)
        VALUES (%(bill_id)s, %(stage)s, %(event_date)s, %(description)s, %(source_url)s)
    """
    exists_sql = """
        SELECT 1 FROM bill_timelines
        WHERE bill_id = %(bill_id)s
          AND stage   = %(stage)s
          AND event_date IS NOT DISTINCT FROM %(event_date)s
        LIMIT 1
    """

    conn = _get_raw_conn()
    inserted = 0
    skipped  = 0

    try:
        with conn.cursor() as cur:
            for events in bill_events.values():
                for ev in events:
                    cur.execute(exists_sql, ev)
                    if cur.fetchone():
                        skipped += 1
                        continue
                    cur.execute(insert_sql, ev)
                    inserted += 1
        conn.commit()
    except Exception as e:
        conn.rollback()
        logger.error(f"DB error while storing events: {e}")
        raise
    finally:
        conn.close()

    logger.info(f"DB: {inserted} inserted, {skipped} skipped (duplicates).")
    return inserted


# ── STEP 9: Save JSON output ──────────────────────────────────────────────────

def save_json(bill_events: dict[int, list[dict]]):
    """Export timeline data to data/bill_evolution.json."""
    output = []
    for bill_id, events in bill_events.items():
        output.append({
            "bill_id":  bill_id,
            "timeline": [
                {
                    "date":        ev["event_date"],
                    "stage":       ev["stage"],
                    "description": ev["description"],
                    "source_url":  ev["source_url"],
                }
                for ev in sorted(events, key=lambda e: e.get("event_date") or "")
            ],
        })

    with open(OUTPUT_JSON, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=4, ensure_ascii=False)

    logger.info(f"JSON saved → {OUTPUT_JSON}  ({len(output)} bills)")


# ── STEP 11: Pipeline runner ──────────────────────────────────────────────────

def run_legislative_tracker():
    """Orchestrate the full legislative evolution tracking pipeline."""
    logger.info("═" * 60)
    logger.info("Legislative Evolution Tracker — Start")
    logger.info("═" * 60)

    # Ensure table exists (idempotent)
    ensure_bill_timelines_table()

    bills    = load_bills()
    articles = load_news_articles()

    if not bills:
        logger.warning("No bills found in database. Exiting.")
        return
    if not articles:
        logger.warning("No news articles found in database. Exiting.")
        return

    logger.info("Loading sentence-transformer model …")
    model = SentenceTransformer("all-MiniLM-L6-v2")

    bill_events = detect_events(bills, articles, model)
    store_events(bill_events)
    save_json(bill_events)

    logger.info("Legislative tracker finished successfully.")


if __name__ == "__main__":
    run_legislative_tracker()
