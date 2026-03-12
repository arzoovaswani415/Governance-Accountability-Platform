"""
Real Data Extraction Pipeline
============================
Reads BJP manifesto PDFs for 2014, 2019, and 2024.
Uses Gemini AI to extract structured promises per sector.
Clears fake seed data and populates Supabase with real data.

Run from backend/: python3 scripts/extract_real_promises.py
"""

import sys
import os
import json
import time
import fitz  # PyMuPDF
import google.generativeai as genai
from pathlib import Path
from sqlalchemy.orm import Session

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import engine, SessionLocal, Base
from app.models import (
    ElectionCycle, Sector, Promise, Policy,
    BudgetAllocation, TimelineEvent, PromisePolicyMapping
)

# ─── CONFIG ───────────────────────────────────────────────────────────────────

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "AIzaSyB3zRmqdiy_Nscfh0PN6YxiF7U1c3DH4qM")
genai.configure(api_key=GEMINI_API_KEY)
model = genai.GenerativeModel("gemini-2.5-flash")

MANIFESTO_DIR = Path(__file__).parent.parent.parent / "governance-platform/data/raw/manifestos"

SECTORS = [
    ("Healthcare", "Public health, hospitals, medical infrastructure, and health insurance"),
    ("Energy", "Power generation, renewable energy, electrification, and energy access"),
    ("Education", "Schools, universities, skill development, and digital education"),
    ("Agriculture", "Farming, irrigation, crop insurance, and rural development"),
    ("Infrastructure", "Roads, railways, ports, airports, and urban development"),
    ("Environment", "Climate policy, forest conservation, pollution control, and sustainability"),
    ("Economy", "GDP growth, taxation, trade, employment, and fiscal policy"),
    ("Defence", "Military, national security, border protection, and veterans"),
    ("Social Welfare", "Women empowerment, minority welfare, poverty alleviation, and housing"),
    ("Technology", "Digital India, startup ecosystem, IT, and innovation"),
]

CYCLE_MAP = {
    "2014": ("2014-2019", 2014, 2019),
    "2019": ("2019-2024", 2019, 2024),
    "2024": ("2024-2029", 2024, 2029),
}

# ─── PDF TEXT EXTRACTION ──────────────────────────────────────────────────────

def extract_pdf_text(pdf_path: Path, max_chars: int = 80000) -> str:
    """Extract text from PDF, capped to avoid token limits."""
    doc = fitz.open(pdf_path)
    text = ""
    for page in doc:
        text += page.get_text()
        if len(text) > max_chars:
            break
    doc.close()
    return text[:max_chars]

# ─── GEMINI PROMISE EXTRACTION ────────────────────────────────────────────────

def extract_promises_with_gemini(manifesto_text: str, year: str, sector: str) -> list[dict]:
    """Use Gemini to extract promises for a specific sector from manifesto text."""
    prompt = f"""You are analyzing the BJP (Bharatiya Janata Party) election manifesto from {year}.

Extract ALL specific, concrete election promises related to **{sector}** from this manifesto text.

For each promise:
1. Write the promise clearly and specifically (not paraphrased vaguely)
2. Include any specific targets, numbers, schemes, or timelines mentioned
3. Assign a fulfillment status based on what you know happened after {year}:
   - "fulfilled": Clearly implemented
   - "in_progress": Partially implemented or ongoing
   - "partial": Started but incomplete
   - "no_progress": Not implemented

Return ONLY a valid JSON array like this (no other text):
[
  {{
    "text": "Specific promise text here...",
    "status": "fulfilled|in_progress|partial|no_progress",
    "fulfillment_score": 0.0-1.0,
    "ai_insight": "1-2 sentence explanation of current status with specific facts"
  }}
]

Return between 8-15 promises for this sector. If fewer are mentioned in the document, return only those found.

MANIFESTO TEXT (first portion):
{manifesto_text[:60000]}
"""

    try:
        response = model.generate_content(prompt)
        raw = response.text.strip()
        # Clean markdown code blocks if present
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        promises = json.loads(raw.strip())
        return promises if isinstance(promises, list) else []
    except json.JSONDecodeError as e:
        print(f"    ⚠️  JSON parse error for {sector}/{year}: {e}")
        return []
    except Exception as e:
        print(f"    ⚠️  Gemini error for {sector}/{year}: {e}")
        return []

# ─── POLICY EXTRACTION ────────────────────────────────────────────────────────

def extract_policies_with_gemini(manifesto_text: str, year: str, sector: str) -> list[dict]:
    """Extract government policies/schemes mentioned in the manifesto."""
    prompt = f"""From this BJP {year} manifesto, extract specific government POLICIES, SCHEMES, and PROGRAMS related to **{sector}**.

These should be named initiatives (like "Ayushman Bharat", "PM-KISAN", "Jal Jeevan Mission", "PM Awas Yojana", etc.)

Return ONLY a valid JSON array with 3-6 items:
[
  {{
    "name": "Official scheme/policy name",
    "description": "What this policy does and its key targets",
    "status": "active|implemented|announced",
    "year_introduced": {year},
    "ministry": "Relevant ministry name"
  }}
]

Only include named schemes — not generic promises.

MANIFESTO TEXT:
{manifesto_text[:40000]}
"""
    try:
        response = model.generate_content(prompt)
        raw = response.text.strip()
        if raw.startswith("```"):
            raw = raw.split("```")[1]
            if raw.startswith("json"):
                raw = raw[4:]
        policies = json.loads(raw.strip())
        return policies if isinstance(policies, list) else []
    except Exception as e:
        print(f"    ⚠️  Policy extraction error for {sector}/{year}: {e}")
        return []

# ─── MAIN PIPELINE ────────────────────────────────────────────────────────────

def run():
    db: Session = SessionLocal()

    try:
        print("=" * 60)
        print("  BJP MANIFESTO → REAL DATA EXTRACTION PIPELINE")
        print("=" * 60)

        # ── STEP 1: Clear old seed data ──
        print("\n[1/5] Clearing old promises/policies data...")
        db.query(PromisePolicyMapping).delete()
        db.query(TimelineEvent).delete()
        db.query(BudgetAllocation).delete()
        db.query(Promise).delete()
        db.query(Policy).delete()
        db.commit()
        print("      ✓ Cleared promises and policies")

        # ── STEP 2: Fetch/Create sectors ──
        print("\n[2/5] Preparing sectors...")
        sector_map = {}
        for name, desc in SECTORS:
            s = db.query(Sector).filter(Sector.name == name).first()
            if not s:
                s = Sector(name=name, description=desc)
                db.add(s)
                db.flush()
            sector_map[name] = s
            print(f"      + {name}")
        db.commit()

        # ── STEP 3: Fetch/Create election cycles ──
        print("\n[3/5] Preparing election cycles...")
        cycle_map = {}
        for year_str, (name, start, end) in CYCLE_MAP.items():
            c = db.query(ElectionCycle).filter(ElectionCycle.name == name).first()
            if not c:
                c = ElectionCycle(name=name, start_year=start, end_year=end)
                db.add(c)
                db.flush()
            cycle_map[year_str] = c
            print(f"      + {name}")
        db.commit()

        # ── STEP 4: Extract promises from each PDF ──
        print("\n[4/5] Extracting promises from BJP Manifesto PDFs using Gemini AI...")
        total_promises = 0
        total_policies = 0

        for year_str, cycle in cycle_map.items():
            year_dir = MANIFESTO_DIR / year_str
            pdfs = list(year_dir.glob("*.pdf"))
            if not pdfs:
                print(f"  ⚠️  No PDF found in {year_dir}")
                continue

            pdf_path = pdfs[0]
            print(f"\n  📄 Processing {year_str}: {pdf_path.name} ({pdf_path.stat().st_size // 1024 // 1024}MB)")
            manifesto_text = extract_pdf_text(pdf_path)
            print(f"     Extracted {len(manifesto_text):,} characters of text")

            # Focus on the most impactful sectors to keep API calls reasonable
            priority_sectors = ["Healthcare", "Energy", "Education", "Agriculture",
                                 "Infrastructure", "Environment", "Economy",
                                 "Social Welfare", "Technology", "Defence"]

            for sector_name in priority_sectors:
                sector = sector_map[sector_name]
                print(f"     → Sector: {sector_name}...", end=" ", flush=True)

                # Extract promises
                promises = extract_promises_with_gemini(manifesto_text, year_str, sector_name)
                for p_data in promises:
                    p = Promise(
                        text=p_data.get("text", ""),
                        status=p_data.get("status", "no_progress"),
                        fulfillment_score=float(p_data.get("fulfillment_score", 0.0)),
                        ai_insight=p_data.get("ai_insight"),
                        source_document=f"BJP Manifesto {year_str}",
                        sector_id=sector.id,
                        election_cycle_id=cycle.id,
                    )
                    db.add(p)
                total_promises += len(promises)

                # Extract policies (only for 2019 to avoid duplicates)
                if year_str == "2019":
                    policies = extract_policies_with_gemini(manifesto_text, year_str, sector_name)
                    for pol_data in policies:
                        pol = Policy(
                            name=pol_data.get("name", ""),
                            description=pol_data.get("description"),
                            status=pol_data.get("status", "announced"),
                            year_introduced=pol_data.get("year_introduced"),
                            ministry=pol_data.get("ministry"),
                            ai_summary=pol_data.get("description"),
                            sector_id=sector.id,
                        )
                        db.add(pol)
                    total_policies += len(policies)

                db.commit()
                print(f"{len(promises)} promises", end="")
                if year_str == "2019":
                    print(f", {len(policies) if 'policies' in dir() else 0} policies", end="")
                print()

                # Rate limit: avoid hitting Gemini quota
                time.sleep(1)

        # ── STEP 5: Summary ──
        print("\n[5/5] Verification...")
        final_promises = db.query(Promise).count()
        final_policies = db.query(Policy).count()
        print(f"\n{'=' * 60}")
        print(f"  ✅ EXTRACTION COMPLETE")
        print(f"  📊 Total Promises in DB: {final_promises}")
        print(f"  📋 Total Policies in DB: {final_policies}")
        print(f"  🗳️  Sources: BJP Manifestos 2014, 2019, 2024 (real PDFs)")
        print(f"{'=' * 60}")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    run()
