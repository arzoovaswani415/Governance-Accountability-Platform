"""
Governance Accountability Analysis API — /api/accountability
=============================================================
Provides high-level analytics on how well political commitments
are being translated into legislation and budgets.

Endpoints:
  GET /api/accountability/summary     — Overall promise → policy → budget stats
  GET /api/accountability/sectors     — Per-sector accountability scores
  GET /api/accountability/gaps        — Promises with no linked policy + no budget
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import Promise, Policy, BudgetAllocation, Sector, PromisePolicyMapping, Bill, BillTimeline

router = APIRouter()

CACHE = {}



@router.get("/summary")
def get_accountability_summary(db: Session = Depends(get_db)):
    """
    Return platform-wide accountability metrics.

    Example response:
      {
        "total_promises": 193,
        "promises_with_policy": 143,
        "promises_fulfilled": 45,
        "promises_no_progress": 30,
        "sectors_with_budget": 12,
        "bills_passed": 87,
        "bills_implemented": 22
      }
    """
    if "summary" in CACHE:
        return CACHE["summary"]

    total_promises = db.query(func.count(Promise.id)).scalar() or 0
    promises_with_policy = (
        db.query(func.count(func.distinct(PromisePolicyMapping.promise_id))).scalar() or 0
    )
    fulfilled = db.query(func.count(Promise.id)).filter(Promise.status == "fulfilled").scalar() or 0
    no_progress = db.query(func.count(Promise.id)).filter(Promise.status == "no_progress").scalar() or 0

    sectors_with_budget = (
        db.query(func.count(func.distinct(BudgetAllocation.sector_id)))
          .filter(BudgetAllocation.amount_crores > 0)
          .scalar() or 0
    )

    bills_passed = (
        db.query(func.count(func.distinct(BillTimeline.bill_id)))
          .filter(BillTimeline.stage.in_(["PASSED", "IMPLEMENTED"]))
          .scalar() or 0
    )
    bills_implemented = (
        db.query(func.count(func.distinct(BillTimeline.bill_id)))
          .filter(BillTimeline.stage == "IMPLEMENTED")
          .scalar() or 0
    )

    result = {
        "total_promises":        total_promises,
        "promises_with_policy":  promises_with_policy,
        "promises_fulfilled":    fulfilled,
        "promises_no_progress":  no_progress,
        "policy_coverage_pct":   round(promises_with_policy / total_promises * 100, 1) if total_promises else 0,
        "fulfillment_pct":       round(fulfilled / total_promises * 100, 1) if total_promises else 0,
        "sectors_with_budget":   sectors_with_budget,
        "bills_passed":          bills_passed,
        "bills_implemented":     bills_implemented,
    }
    
    CACHE["summary"] = result
    return result


@router.get("/sectors")
def get_sector_accountability(db: Session = Depends(get_db)):
    """
    Return per-sector accountability scores combining promise coverage,
    budget presence, and bill evolution stage.

    Example response:
      [
        {
          "sector": "Healthcare",
          "total_promises": 18,
          "promises_with_policy": 14,
          "avg_fulfillment_score": 0.62,
          "has_budget": true,
          "bills_passed": 3,
          "accountability_score": 0.74
        },
        ...
      ]
    """
    if "sectors" in CACHE:
        return CACHE["sectors"]

    sectors = db.query(Sector).all()
    results = []

    for sec in sectors:
        total_promises = db.query(func.count(Promise.id)).filter(Promise.sector_id == sec.id).scalar() or 0
        if total_promises == 0:
            continue

        promises_with_policy = (
            db.query(func.count(func.distinct(PromisePolicyMapping.promise_id)))
              .join(Promise, Promise.id == PromisePolicyMapping.promise_id)
              .filter(Promise.sector_id == sec.id)
              .scalar() or 0
        )
        avg_score = (
            db.query(func.avg(Promise.fulfillment_score))
              .filter(Promise.sector_id == sec.id)
              .scalar() or 0.0
        )
        has_budget = (
            db.query(BudgetAllocation)
              .filter(BudgetAllocation.sector_id == sec.id, BudgetAllocation.amount_crores > 0)
              .first() is not None
        )

        # Bills in this sector that have a PASSED+ stage
        sector_bill_ids = [
            b.id for b in db.query(Bill).filter(Bill.sector_id == sec.id).all()
        ]
        bills_passed = 0
        if sector_bill_ids:
            bills_passed = (
                db.query(func.count(func.distinct(BillTimeline.bill_id)))
                  .filter(
                      BillTimeline.bill_id.in_(sector_bill_ids),
                      BillTimeline.stage.in_(["PASSED", "IMPLEMENTED"])
                  )
                  .scalar() or 0
            )

        # Composite accountability score (weighted)
        coverage_score = promises_with_policy / total_promises if total_promises else 0
        budget_bonus   = 0.15 if has_budget else 0.0
        bills_bonus    = min(bills_passed * 0.05, 0.20)
        accountability_score = round(
            float(avg_score) * 0.50 + coverage_score * 0.30 + budget_bonus + bills_bonus,
            3
        )

        results.append({
            "sector":                   sec.name,
            "total_promises":           total_promises,
            "promises_with_policy":     promises_with_policy,
            "avg_fulfillment_score":    round(float(avg_score), 3),
            "has_budget":               has_budget,
            "bills_passed":             bills_passed,
            "accountability_score":     accountability_score,
        })

    sorted_results = sorted(results, key=lambda r: r["accountability_score"], reverse=True)
    CACHE["sectors"] = sorted_results
    return sorted_results


@router.get("/gaps")
def get_accountability_gaps(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
):
    """
    Return promises that have no mapped policy AND no budget allocation
    in their sector — i.e., promises that have completely fallen through
    the cracks.

    Example response:
      [
        {
          "promise_id": 45,
          "promise_text": "Build 100 new hospitals ...",
          "sector": "Healthcare",
          "status": "no_progress",
          "fulfillment_score": 0.0
        },
        ...
      ]
    """
    cache_key = f"gaps_{limit}"
    if cache_key in CACHE:
        return CACHE[cache_key]

    # Promises that have at least one policy mapping
    mapped_promise_ids = {
        row[0] for row in db.query(PromisePolicyMapping.promise_id).all()
    }
    # Sectors that have a budget
    funded_sector_ids = {
        row[0] for row in
        db.query(BudgetAllocation.sector_id)
          .filter(BudgetAllocation.amount_crores > 0)
          .all()
    }

    all_promises = db.query(Promise).limit(limit * 5).all()
    gaps = [
        {
            "promise_id":        p.id,
            "promise_text":      p.text[:200],
            "sector":            p.sector.name if p.sector else None,
            "status":            p.status,
            "fulfillment_score": p.fulfillment_score,
        }
        for p in all_promises
        if p.id not in mapped_promise_ids and p.sector_id not in funded_sector_ids
    ]

    CACHE[cache_key] = gaps[:limit]
    return CACHE[cache_key]
