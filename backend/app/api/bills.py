"""
Bills API Router — /api/bills
==============================
Exposes legislative bill data and per-bill timeline endpoints.

Endpoints:
  GET /api/bills/              — List all bills (with optional filters)
  GET /api/bills/{bill_id}/timeline — Full legislative timeline for one bill

Timeline data is sourced from the `bill_timelines` table populated by
processing/legislative_tracker.py.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import Bill, BillTimeline

router = APIRouter()


@router.get("/")
def list_bills(
    status: str | None = Query(None, description="Filter by bill status"),
    ministry: str | None = Query(None, description="Filter by ministry"),
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """
    List all bills with optional filters.

    Example response:
        [{"id": 1, "name": "Digital India Bill", "ministry": "MeitY", "status": "passed", ...}]
    """
    q = db.query(Bill)
    if status:
        q = q.filter(Bill.status == status)
    if ministry:
        q = q.filter(Bill.ministry.ilike(f"%{ministry}%"))
    bills = q.order_by(Bill.introduced_date.desc()).offset(skip).limit(limit).all()

    return [
        {
            "id":              b.id,
            "name":            b.name,
            "ministry":        b.ministry,
            "status":          b.status,
            "introduced_date": str(b.introduced_date) if b.introduced_date else None,
            "source_url":      b.source_url,
        }
        for b in bills
    ]


@router.get("/{bill_id}/timeline")
def get_bill_timeline(
    bill_id: int,
    db: Session = Depends(get_db),
):
    """
    Return the full legislative evolution timeline for a specific bill.

    Fetches events from the `bill_timelines` table, ordered chronologically.

    Example response:
        {
          "bill_id": 12,
          "bill_name": "Digital India Bill",
          "timeline": [
            {
              "date": "2023-03-01",
              "stage": "INTRODUCED",
              "description": "Bill introduced in Lok Sabha ...",
              "source_url": "https://..."
            },
            ...
          ]
        }
    """
    bill = db.query(Bill).filter(Bill.id == bill_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail=f"Bill {bill_id} not found.")

    events = (
        db.query(BillTimeline)
          .filter(BillTimeline.bill_id == bill_id)
          .order_by(BillTimeline.event_date.asc())
          .all()
    )

    return {
        "bill_id":   bill.id,
        "bill_name": bill.name,
        "ministry":  bill.ministry,
        "status":    bill.status,
        "timeline":  [
            {
                "date":        str(e.event_date) if e.event_date else None,
                "stage":       e.stage,
                "description": e.description,
                "source_url":  e.source_url,
            }
            for e in events
        ],
    }
