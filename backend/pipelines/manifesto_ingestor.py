"""
Manifesto Ingestion Pipeline
----------------------------
Reads raw manifesto PDFs from the teammate's scraper output,
uses Gemini to extract individual governance promises, and
saves them into the Supabase DB.

Usage:
    cd backend/
    python -m pipelines.manifesto_ingestor
"""
import sys
import os
import json
import re
from pathlib import Path

# Allow running as: python -m pipelines.manifesto_ingestor
sys.path.insert(0, str(Path(__file__).parent.parent))

import fitz  # PyMuPDF
import google.generativeai as genai
from sqlalchemy.orm import Session

from app.database import SessionLocal, engine
from app.models import Promise, Sector, ElectionCycle
from app.config import settings

# ─────────────────────────────────────────
# CONFIGURATION
# ─────────────────────────────────────────
MANIFESTO_DIR = Path(__file__).parent.parent.parent / "governance-platform" / "data" / "raw" / "manifestos"

SECTOR_KEYWORDS = {
    "Healthcare": ["health", "hospital", "medical", "doctor", "ayushman", "insurance", "medicine", "nutrition", "sanitation"],
    "Education": ["education", "school", "university", "student", "literacy", "teacher", "skill", "training", "scholarship"],
    "Energy": ["energy", "power", "electricity", "solar", "renewable", "coal", "grid", "fuel", "gas", "petroleum"],
    "Agriculture": ["agriculture", "farmer", "crop", "irrigation", "fertilizer", "kisan", "rural", "harvest", "soil", "msp"],
    "Infrastructure": ["road", "highway", "railway", "bridge", "airport", "port", "housing", "urban", "smart city", "metro"],
    "Environment": ["environment", "climate", "forest", "pollution", "ecology", "green", "carbon", "biodiversity", "water"],
}

# ─────────────────────────────────────────
# HELPERS
# ─────────────────────────────────────────

def extract_text_from_pdf(pdf_path: Path) -> str:
    """Extract raw text from a PDF using PyMuPDF."""
    try:
        doc = fitz.open(str(pdf_path))
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text
    except Exception as e:
        print(f"  ✗ Could not read {pdf_path.name}: {e}")
        return ""


def classify_sector(promise_text: str) -> str:
    """Classify a promise into one of our 6 sectors based on keyword matching."""
    text_lower = promise_text.lower()
    scores = {}
    for sector, keywords in SECTOR_KEYWORDS.items():
        scores[sector] = sum(1 for kw in keywords if kw in text_lower)
    best = max(scores, key=scores.get)
    return best if scores[best] > 0 else "Infrastructure"  # default


def extract_promises_with_gemini(manifesto_text: str, year: int) -> list[dict]:
    """Use Gemini to extract individual governance promises from the manifesto text."""
    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-2.0-flash")

    # Truncate to ~20k chars to avoid token limits
    chunk = manifesto_text[:20000]

    prompt = f"""You are analyzing an Indian election manifesto from {year}.

Extract EXACTLY 15 specific, actionable governance promises from the text below.
Focus on concrete commitments (not vague aspirations) related to:
- Healthcare, Education, Energy, Agriculture, Infrastructure, or Environment

Return ONLY a valid JSON array (no markdown, no explanation), like:
[
  {{
    "text": "Provide free health insurance of ₹5 lakhs per family under a national scheme",
    "sector": "Healthcare"
  }},
  ...
]

MANIFESTO TEXT:
{chunk}
"""
    try:
        response = model.generate_content(prompt)
        raw = response.text.strip()
        # Strip markdown code blocks if present
        raw = re.sub(r"^```[a-z]*\n?", "", raw)
        raw = re.sub(r"\n?```$", "", raw)
        promises = json.loads(raw)
        return promises[:15]
    except Exception as e:
        print(f"  ✗ Gemini extraction failed: {e}")
        return []


def get_or_create_election_cycle(db: Session, year: int) -> ElectionCycle:
    """Get or create an election cycle for a given year."""
    if year <= 2019:
        name = "2014-2019"
        start, end = 2014, 2019
    else:
        name = "2019-2024"
        start, end = 2019, 2024

    cycle = db.query(ElectionCycle).filter(ElectionCycle.name == name).first()
    if not cycle:
        cycle = ElectionCycle(name=name, start_year=start, end_year=end)
        db.add(cycle)
        db.flush()
    return cycle


def get_sector(db: Session, name: str) -> Sector:
    """Fetch the sector by name."""
    return db.query(Sector).filter(Sector.name == name).first()


# ─────────────────────────────────────────
# MAIN INGESTION
# ─────────────────────────────────────────

def ingest_manifestos():
    """Main entry point: scan PDFs → extract promises via Gemini → save to DB."""
    print("\n🚀 Manifesto Ingestion Pipeline Starting...")
    print(f"   Looking for PDFs in: {MANIFESTO_DIR}\n")

    db: Session = SessionLocal()
    total_saved = 0

    try:
        # Check if we have sectors in DB
        sector_count = db.query(Sector).count()
        if sector_count == 0:
            print("  ✗ No sectors found in DB. Run seed_data.py first!")
            return

        for year_dir in sorted(MANIFESTO_DIR.iterdir()):
            if not year_dir.is_dir():
                continue
            year = int(year_dir.name)
            print(f"📂 Processing year: {year}")

            for pdf_file in year_dir.glob("*.pdf"):
                print(f"   📄 Reading: {pdf_file.name}")

                raw_text = extract_text_from_pdf(pdf_file)
                if not raw_text.strip():
                    print(f"   ✗ Empty text, skipping.")
                    continue

                print(f"   🤖 Calling Gemini to extract promises...")
                promises = extract_promises_with_gemini(raw_text, year)
                print(f"   ✓ Extracted {len(promises)} promises")

                election_cycle = get_or_create_election_cycle(db, year)

                for p in promises:
                    promise_text = p.get("text", "").strip()
                    sector_name = p.get("sector", "Infrastructure")

                    if not promise_text or len(promise_text) < 20:
                        continue

                    # Validate sector
                    if sector_name not in SECTOR_KEYWORDS:
                        sector_name = classify_sector(promise_text)

                    sector = get_sector(db, sector_name)
                    if not sector:
                        print(f"   ✗ Sector '{sector_name}' not found, skipping promise.")
                        continue

                    # Skip duplicates
                    existing = db.query(Promise).filter(
                        Promise.text.ilike(f"%{promise_text[:50]}%")
                    ).first()
                    if existing:
                        continue

                    new_promise = Promise(
                        text=promise_text,
                        sector_id=sector.id,
                        election_cycle_id=election_cycle.id,
                        status="in_progress",
                        fulfillment_score=0.0,
                        source_document=f"manifesto_{year}.pdf",
                    )
                    db.add(new_promise)
                    total_saved += 1

                db.commit()
                print(f"   ✓ Saved {total_saved} total promises so far\n")
                
                import time
                time.sleep(5)  # Avoid Gemini free tier rate limit

        print(f"\n✅ Ingestion complete! Total new promises saved: {total_saved}")

    except Exception as e:
        db.rollback()
        print(f"\n✗ Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    ingest_manifestos()
