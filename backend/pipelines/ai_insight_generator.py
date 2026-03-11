"""
AI Insight Generator
---------------------
Uses Gemini to generate:
1. ai_insight for each Promise — a 2-3 sentence summary of governance progress
2. ai_summary for each Policy — a plain-language description of what the policy does

Usage:
    cd backend/
    python -m pipelines.ai_insight_generator
"""
import sys
import re
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import google.generativeai as genai
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Promise, Policy, PromisePolicyMapping
from app.config import settings


def generate_promise_insight(promise: Promise, related_policies: list) -> str:
    """Generate an AI governance insight for a specific promise."""
    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-2.0-flash")

    policies_text = "\n".join(
        [f"- {p.name} ({p.status}, {p.year_introduced})" for p in related_policies]
    ) or "No directly linked policies found."

    prompt = f"""You are a governance analyst.

MANIFESTO PROMISE: {promise.text}
SECTOR: {promise.sector.name}
CURRENT STATUS: {promise.status}
FULFILLMENT SCORE: {promise.fulfillment_score * 100:.0f}%

RELATED GOVERNMENT POLICIES:
{policies_text}

Write a 2-3 sentence plain-English insight describing:
- Whether this promise shows evidence of progress
- Why (based on the linked policies)
- Any notable gaps

Be factual and concise. Do not use bullet points."""

    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"  ⚠️  Gemini failed for promise {promise.id}: {e}")
        return None


def generate_policy_summary(policy: Policy) -> str:
    """Generate a plain-language AI summary for a government policy."""
    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-2.0-flash")

    prompt = f"""You are a governance analyst helping ordinary citizens understand government policies.

POLICY NAME: {policy.name}
SECTOR: {policy.sector.name}
STATUS: {policy.status}
YEAR INTRODUCED: {policy.year_introduced}
DESCRIPTION: {policy.description or 'Not available.'}

Write 2-3 plain-English sentences explaining:
- What this policy actually does
- Who it benefits
- Its current stage

Assume the reader has no background in law or policy. Be concise and clear."""

    try:
        response = model.generate_content(prompt)
        return response.text.strip()
    except Exception as e:
        print(f"  ⚠️  Gemini failed for policy {policy.id}: {e}")
        return None


def run_insight_generator(regen: bool = False):
    """
    Generate AI insights for promises and summaries for policies.
    Set regen=True to regenerate even if insight already exists.
    """
    print("\n✨ AI Insight Generator Starting...\n")

    db: Session = SessionLocal()
    promise_updates = 0
    policy_updates = 0

    try:
        # --- Promises ---
        promises = db.query(Promise).all()
        print(f"  📊 Processing {len(promises)} promises...")

        for i, promise in enumerate(promises):
            if promise.ai_insight and not regen:
                continue  # Already has an insight

            # Get related policies via mappings
            mappings = (
                db.query(PromisePolicyMapping)
                .filter(PromisePolicyMapping.promise_id == promise.id)
                .all()
            )
            related_policies = [m.policy for m in mappings]

            print(f"  [{i+1}/{len(promises)}] Generating insight for: {promise.text[:60]}...")
            insight = generate_promise_insight(promise, related_policies)

            if insight:
                promise.ai_insight = insight
                promise_updates += 1

        db.commit()
        print(f"  ✓ Updated {promise_updates} promise insights\n")

        # --- Policies ---
        policies = db.query(Policy).all()
        print(f"  📊 Processing {len(policies)} policies...")

        for i, policy in enumerate(policies):
            if policy.ai_summary and not regen:
                continue  # Already has a summary

            print(f"  [{i+1}/{len(policies)}] Generating summary for: {policy.name}...")
            summary = generate_policy_summary(policy)

            if summary:
                policy.ai_summary = summary
                policy_updates += 1

        db.commit()
        print(f"  ✓ Updated {policy_updates} policy summaries\n")

        print(f"✅ Done! Promises updated: {promise_updates}, Policies updated: {policy_updates}")

    except Exception as e:
        db.rollback()
        print(f"\n✗ Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--regen", action="store_true", help="Regenerate even existing insights")
    args = parser.parse_args()
    run_insight_generator(regen=args.regen)
