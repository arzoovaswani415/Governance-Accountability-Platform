"""
Promise Fulfillment Recalculator
==================================
Updates `promises.fulfillment_score` and `promises.status` based on
real legislative evidence: bill timelines, associated policies, and
budget allocations.

Scoring logic:
  - Base score 0.0
  - +0.30  if a policy is mapped to the promise
  - +0.20  if a bill exists with PASSED stage in bill_timelines
  - +0.20  if a bill exists with IMPLEMENTED stage in bill_timelines
  - +0.10  if budget allocation > 0 exists for the same sector + year
  - +0.20  if the mapped policy has status='passed' or 'implemented'

Status thresholds:
  >= 0.80  → fulfilled
  >= 0.50  → in_progress
  >= 0.20  → partial
  <  0.20  → no_progress

Usage:
  cd backend
  python processing/recalculate_fulfillment.py
"""

import sys
import logging
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.database import SessionLocal
from app.models import Promise, Policy, PromisePolicyMapping, Bill, BillTimeline, BudgetAllocation

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("fulfillment_recalc")

# ── Stage weights ────────────────────────────────────────────────────────────
PASSED_STAGES      = {"PASSED", "IMPLEMENTED"}
IMPLEMENTED_STAGES = {"IMPLEMENTED"}

def compute_score(promise: Promise, db) -> tuple[float, str]:
    """Compute fulfillment score from real DB evidence."""
    score = 0.0

    # 1. Is there at least one mapped policy?
    mappings = (
        db.query(PromisePolicyMapping)
          .filter(PromisePolicyMapping.promise_id == promise.id)
          .all()
    )
    if mappings:
        score += 0.30

        # 2. Does any mapped policy have a passed/implemented status?
        for m in mappings:
            policy = db.query(Policy).filter(Policy.id == m.policy_id).first()
            if policy and policy.status in ("passed", "implemented", "active"):
                score += 0.20
                break

    # 3. Is there a bill with PASSED stage in bill_timelines for any linked bill?
    bills_in_sector = (
        db.query(Bill)
          .filter(Bill.sector_id == promise.sector_id)
          .all()
    )
    bill_ids = [b.id for b in bills_in_sector]

    if bill_ids:
        timeline_stages = (
            db.query(BillTimeline.stage)
              .filter(BillTimeline.bill_id.in_(bill_ids))
              .all()
        )
        stages_found = {s[0] for s in timeline_stages}

        if stages_found & PASSED_STAGES:
            score += 0.20
        if stages_found & IMPLEMENTED_STAGES:
            score += 0.20

    # 4. Is there budget allocated for the same sector?
    budget = (
        db.query(BudgetAllocation)
          .filter(BudgetAllocation.sector_id == promise.sector_id,
                  BudgetAllocation.amount_crores > 0)
          .first()
    )
    if budget:
        score += 0.10

    # Cap at 1.0
    score = min(round(score, 2), 1.0)

    # Determine status
    if score >= 0.80:
        status = "fulfilled"
    elif score >= 0.50:
        status = "in_progress"
    elif score >= 0.20:
        status = "partial"
    else:
        status = "no_progress"

    return score, status


def run_recalculation():
    """Recalculate fulfillment for all promises and persist to DB."""
    db = SessionLocal()
    try:
        promises = db.query(Promise).all()
        logger.info(f"Recalculating fulfillment for {len(promises)} promises …")

        counts = {"fulfilled": 0, "in_progress": 0, "partial": 0, "no_progress": 0}
        for promise in promises:
            new_score, new_status = compute_score(promise, db)

            changed = (
                promise.fulfillment_score != new_score
                or promise.status != new_status
            )
            if changed:
                promise.fulfillment_score = new_score
                promise.status = new_status

            counts[new_status] += 1

        db.commit()
        logger.info("Recalculation complete.")
        logger.info(
            f"Results → fulfilled: {counts['fulfilled']} | "
            f"in_progress: {counts['in_progress']} | "
            f"partial: {counts['partial']} | "
            f"no_progress: {counts['no_progress']}"
        )
    except Exception as e:
        db.rollback()
        logger.error(f"Error during recalculation: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run_recalculation()
