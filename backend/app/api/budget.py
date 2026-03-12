"""
Budget API Router — /api/budget
================================
Exposes sector-level budget data for the frontend dashboard charts.

Endpoints:
  GET /api/budget/sectors       — Latest budget per sector (bar chart)
  GET /api/budget/trend         — Year-over-year trends (line chart)
  GET /api/budget/distribution  — Sector share for current year (pie chart)

All data is sourced from the ``budget_allocations`` and ``sectors`` tables
populated by the budget_pipeline.py script.
"""

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import BudgetAllocation, Sector

router = APIRouter()


@router.get("/sectors")
def get_sectors_budget(
    year: int | None = Query(None, description="Filter by budget year"),
    db: Session = Depends(get_db),
):
    """
    Return total budget per sector.

    If `year` is supplied, returns data for that specific year.
    Otherwise returns the most recent year available.

    Example response:
        [{"sector": "Healthcare", "budget": 86000}, ...]
    """
    # Determine target year
    if year is None:
        latest = db.query(func.max(BudgetAllocation.year)).scalar()
        year = latest or 2024

    rows = (
        db.query(Sector.name, func.sum(BudgetAllocation.amount_crores).label("budget"))
          .join(BudgetAllocation, BudgetAllocation.sector_id == Sector.id)
          .filter(BudgetAllocation.year == year)
          .group_by(Sector.name)
          .order_by(func.sum(BudgetAllocation.amount_crores).desc())
          .all()
    )
    return [{"sector": name, "budget": round(float(budget), 2)} for name, budget in rows]


@router.get("/trend")
def get_budget_trend(
    sector: str | None = Query(None, description="Filter by sector name"),
    db: Session = Depends(get_db),
):
    """
    Return year-over-year budget allocation for all sectors (or one sector).

    Example response:
        [
          {"year": 2019, "sector": "Healthcare", "budget": 62000},
          {"year": 2020, "sector": "Healthcare", "budget": 67000},
          ...
        ]
    """
    query = (
        db.query(
            BudgetAllocation.year,
            Sector.name,
            func.sum(BudgetAllocation.amount_crores).label("budget"),
        )
        .join(Sector, Sector.id == BudgetAllocation.sector_id)
        .group_by(BudgetAllocation.year, Sector.name)
        .order_by(BudgetAllocation.year, Sector.name)
    )

    if sector:
        query = query.filter(Sector.name == sector)

    rows = query.all()
    return [
        {"year": yr, "sector": nm, "budget": round(float(bgt), 2)}
        for yr, nm, bgt in rows
    ]


@router.get("/distribution")
def get_budget_distribution(
    year: int | None = Query(None, description="Budget year for distribution"),
    db: Session = Depends(get_db),
):
    """
    Return sector share of total budget for a given year — used for pie charts.

    Example response:
        [
          {"sector": "Defence",       "budget": 593538, "percentage": 13.4},
          {"sector": "Infrastructure","budget": 450000, "percentage": 10.2},
          ...
        ]
    """
    if year is None:
        latest = db.query(func.max(BudgetAllocation.year)).scalar()
        year = latest or 2024

    rows = (
        db.query(Sector.name, func.sum(BudgetAllocation.amount_crores).label("budget"))
          .join(BudgetAllocation, BudgetAllocation.sector_id == Sector.id)
          .filter(BudgetAllocation.year == year)
          .group_by(Sector.name)
          .all()
    )

    if not rows:
        return []

    grand_total = sum(float(bgt) for _, bgt in rows)
    return [
        {
            "sector": name,
            "budget": round(float(budget), 2),
            "percentage": round(float(budget) / grand_total * 100, 2) if grand_total else 0,
        }
        for name, budget in sorted(rows, key=lambda r: r[1], reverse=True)
    ]
