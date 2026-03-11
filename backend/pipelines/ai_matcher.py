"""
AI-Powered Promise ↔ Policy Matcher
-------------------------------------
Uses Google Gemini to semantically match manifesto promises
with government policies and compute similarity scores.
Updates the promise_policy_mappings table.

Usage:
    cd backend/
    python -m pipelines.ai_matcher
"""
import sys
import json
import re
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

import google.generativeai as genai
from sqlalchemy.orm import Session

from app.database import SessionLocal
from app.models import Promise, Policy, PromisePolicyMapping
from app.config import settings


# ─────────────────────────────────────────
# GEMINI COMPARISON
# ─────────────────────────────────────────

def compute_similarity_with_gemini(promise_text: str, policy_name: str, policy_description: str) -> float:
    """
    Use Gemini to assess how well a government policy fulfills a manifesto promise.
    Returns a similarity score between 0.0 and 1.0.
    """
    genai.configure(api_key=settings.GEMINI_API_KEY)
    model = genai.GenerativeModel("gemini-2.0-flash")

    prompt = f"""You are an expert in Indian governance and policy analysis.

MANIFESTO PROMISE:
"{promise_text}"

GOVERNMENT POLICY:
Name: {policy_name}
Description: {policy_description or 'No description available.'}

On a scale of 0.0 to 1.0, how well does this government policy FULFILL or ADDRESS the manifesto promise?

Score Guide:
- 0.9 to 1.0: Direct, explicit fulfillment of the promise
- 0.6 to 0.8: Strong connection, addressed the intent
- 0.3 to 0.5: Partial or indirect relevance
- 0.0 to 0.2: Little to no connection

Return ONLY a valid JSON object, nothing else:
{{"score": 0.75, "reason": "One sentence explanation"}}
"""
    try:
        response = model.generate_content(prompt)
        raw = response.text.strip()
        raw = re.sub(r"^```[a-z]*\n?", "", raw)
        raw = re.sub(r"\n?```$", "", raw)
        result = json.loads(raw)
        score = float(result.get("score", 0.0))
        return max(0.0, min(1.0, score))  # clamp to [0, 1]
    except Exception as e:
        print(f"     ⚠️  Gemini scoring failed: {e}")
        return 0.0


def fast_keyword_similarity(promise_text: str, policy_name: str, policy_description: str) -> float:
    """
    Fast keyword-based pre-filter: returns 0.0 if clearly unrelated.
    Reduces Gemini API calls by only sending likely matches.
    """
    combined = f"{policy_name} {policy_description or ''}".lower()
    words = set(re.findall(r'\b\w{4,}\b', promise_text.lower()))
    policy_words = set(re.findall(r'\b\w{4,}\b', combined))
    overlap = words & policy_words
    return len(overlap) / max(len(words), 1)


# ─────────────────────────────────────────
# MAIN MATCHER
# ─────────────────────────────────────────

def run_matcher(min_keyword_score: float = 0.05, min_similarity: float = 0.4):
    """
    For each promise, score it against every policy using Gemini.
    Only saves mappings where similarity >= min_similarity.
    """
    print("\n🤖 AI Promise ↔ Policy Matcher Starting...\n")

    db: Session = SessionLocal()
    total_mappings = 0
    total_updated = 0

    try:
        promises = db.query(Promise).all()
        policies = db.query(Policy).all()

        print(f"  📊 Found {len(promises)} promises and {len(policies)} policies to match\n")

        for i, promise in enumerate(promises):
            print(f"  [{i+1}/{len(promises)}] Promise: {promise.text[:70]}...")
            best_matches = []

            for policy in policies:
                # Fast pre-filter — skip clearly unrelated pairs
                kw_score = fast_keyword_similarity(
                    promise.text, policy.name, policy.description or ""
                )
                if kw_score < min_keyword_score:
                    continue

                # Use Gemini for actual semantic scoring
                score = compute_similarity_with_gemini(
                    promise.text, policy.name, policy.description or ""
                )

                if score >= min_similarity:
                    best_matches.append((policy, score))
                    print(f"     ✓ Match [{score:.2f}]: {policy.name}")

            # Save top 3 matches to the DB
            best_matches.sort(key=lambda x: x[1], reverse=True)
            for policy, score in best_matches[:3]:
                # Check if mapping already exists
                existing = db.query(PromisePolicyMapping).filter(
                    PromisePolicyMapping.promise_id == promise.id,
                    PromisePolicyMapping.policy_id == policy.id,
                ).first()

                if existing:
                    existing.similarity_score = score
                    total_updated += 1
                else:
                    new_mapping = PromisePolicyMapping(
                        promise_id=promise.id,
                        policy_id=policy.id,
                        similarity_score=score,
                    )
                    db.add(new_mapping)
                    total_mappings += 1

            db.commit()

        print(f"\n✅ Matching complete!")
        print(f"   New mappings created: {total_mappings}")
        print(f"   Existing mappings updated: {total_updated}")

    except Exception as e:
        db.rollback()
        print(f"\n✗ Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run_matcher()
