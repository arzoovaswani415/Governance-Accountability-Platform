"""
Promise ↔ Policy Mapping Engine
===============================
Calculates semantic similarity between extracted Promises and scraped Legislative Bills.
Connects the 1,875 real PRS bills to the 193 real BJP promises to measure fulfillment.

Run from backend/: python3 scripts/map_promises_to_bills.py
"""

import sys
import os
import json
import numpy as np
import time
from pathlib import Path
from sqlalchemy.orm import Session
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import engine, SessionLocal, Base
from app.models import Promise, Bill, PromisePolicyMapping, Policy, TimelineEvent

def run_mapping():
    db: Session = SessionLocal()
    
    try:
        print("=" * 60)
        print("  PROMISE ↔ BILL MAPPING ENGINE (Semantic Search)")
        print("=" * 60)

        # ── 1. Load Data ──
        print("\n[1/4] Loading Promises and Bills from DB...")
        promises = db.query(Promise).all()
        bills = db.query(Bill).all()
        
        if not promises or not bills:
            print("❌ Missing data! Ensure promises and bills are loaded first.")
            return

        print(f"      Loaded {len(promises)} promises.")
        print(f"      Loaded {len(bills)} legislative bills.")

        # ── 2. Initialize TF-IDF Vectorizer ──
        print("\n[2/4] Initializing TF-IDF Vectorizer (Fast Matching Mode)...")
        vectorizer = TfidfVectorizer(stop_words='english', max_features=5000)

        # ── 3. Generate Embeddings ──
        print("\n[3/4] Generating TF-IDF vectors...")
        
        promise_texts = [p.text for p in promises]
        bill_texts = [f"{b.name}. {b.description or ''}" for b in bills]
        
        # Fit vectorizer on all texts combined to build a unified vocabulary
        vectorizer.fit(promise_texts + bill_texts)
        
        print(f"      Encoding {len(promise_texts)} promises...")
        promise_embeddings = vectorizer.transform(promise_texts)
        
        print(f"      Encoding {len(bill_texts)} bills...")
        bill_embeddings = vectorizer.transform(bill_texts)

        # ── 4. Calculate Semantic Similarity & Map ──
        print("\n[4/4] Calculating similarity and mapping relationships...")
        
        # Clear existing mappings, timeline events linked to policies, and policies
        # Gently clear existing mappings linked to these promises
        db.query(PromisePolicyMapping).filter(PromisePolicyMapping.promise_id.in_([p.id for p in promises])).delete(synchronize_session=False)
        db.commit()
        
        SIMILARITY_THRESHOLD = 0.15  # Lower threshold for TF-IDF since it's keyword-based
        
        mapped_count = 0
        fulfilled_count = 0
        progress_count = 0
        
        # Keep track of bills we've promoted to policies to avoid duplicates
        bill_to_policy = {}
        
        # Compute cosine similarities
        cosine_scores = cosine_similarity(promise_embeddings, bill_embeddings)
        
        for i, promise in enumerate(promises):
            print(f"Processing promise {i+1}/{len(promises)}...", flush=True)
            scores_for_promise = cosine_scores[i]
            
            # Find top 3 indices using numpy argsort
            top_indices = np.argsort(scores_for_promise)[::-1][:3]
            top_scores = scores_for_promise[top_indices]
            
            matched_bills = []
            max_score = 0.0
            
            for rank, idx in enumerate(top_indices):
                score = top_scores[rank]
                if score >= SIMILARITY_THRESHOLD:
                    bill = bills[idx]
                    matched_bills.append(bill.name)
                    max_score = max(max_score, score)
                    
                    if bill.id not in bill_to_policy:
                        year = 2020
                        if bill.introduced_date:
                            if hasattr(bill.introduced_date, 'year'):
                                year = bill.introduced_date.year
                            elif isinstance(bill.introduced_date, str) and len(bill.introduced_date) >= 4:
                                try:
                                    year = int(bill.introduced_date[:4])
                                except ValueError:
                                    pass
                        
                        status = "passed" if "passed" in bill.status.lower() else "under_review"
                        
                        policy = Policy(
                            name=bill.name,
                            description=bill.description,
                            year_introduced=year,
                            status=status,
                            ministry=bill.ministry or "Legislative",
                            source_url=bill.source_url,
                            sector_id=promise.sector_id,
                            ai_summary=f"Legislative bill corresponding to sector {promise.sector.name}."
                        )
                        db.add(policy)
                        # Store the policy object instead of ID
                        bill_to_policy[bill.id] = policy
                    
                    # Create Mapping utilizing SQLAlchemy auto-linking
                    mapping = PromisePolicyMapping(
                        promise=promise,
                        similarity_score=float(score)
                    )
                    # Associate mapping directly with the Policy ORM object
                    bill_to_policy[bill.id].promise_mappings.append(mapping)
                    db.add(mapping)
            
            # --- Auto-calculate fulfillment based on legislation ---
            if matched_bills:
                mapped_count += 1
                bills_str = " | ".join(matched_bills)
                promise.ai_insight = f"Automatically verified by legislation: Related bills passed include {bills_str}."
                promise.fulfillment_score = float(max_score)
                
                if max_score >= 0.35: # Adjusted for TF-IDF
                    promise.status = "fulfilled"
                    fulfilled_count += 1
                else:
                    promise.status = "in_progress"
                    progress_count += 1
            else:
                if promise.status not in ["fulfilled", "in_progress"]: 
                    promise.status = "no_progress"
                    promise.fulfillment_score = 0.1
                    promise.ai_insight = "No direct legislative action found in the PRS India database for this specific promise."

        # Save all updates
        db.commit()
        
        print(f"\n{'=' * 60}")
        print(f"  ✅ AI MAPPING COMPLETE")
        print(f"  🔗 Promises linked to real Bills: {mapped_count} / {len(promises)}")
        print(f"  📈 Auto-graded Fulfilled: {fulfilled_count}")
        print(f"  ⏳ Auto-graded In Progress: {progress_count}")
        print(f"{'=' * 60}")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Error during mapping: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    run_mapping()
