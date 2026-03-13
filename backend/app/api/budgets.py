from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.database import get_db
from app.models import BudgetAllocation, Sector, Promise

router = APIRouter()

CACHE = {}


@router.get("/by-sector")
def get_budget_by_sector(
    election_cycle: str | None = None,
    year: int | None = None,
    db: Session = Depends(get_db),
):
    """Get budget distribution across sectors."""
    query = db.query(
        Sector.name,
        func.sum(BudgetAllocation.amount_crores).label("total_amount"),
    ).join(BudgetAllocation, BudgetAllocation.sector_id == Sector.id)

    if election_cycle:
        query = query.join(BudgetAllocation.election_cycle).filter(
            BudgetAllocation.election_cycle.has(name=election_cycle)
        )
    if year:
        query = query.filter(BudgetAllocation.year == year)

    query = query.group_by(Sector.name)

    return [
        {"sector": name, "total_amount_crores": float(total)}
        for name, total in query.all()
    ]


@router.get("/trends")
def get_budget_trends(
    sector: str | None = None,
    db: Session = Depends(get_db),
):
    """Get year-over-year budget trends, optionally filtered by sector."""
    query = (
        db.query(BudgetAllocation)
        .options(joinedload(BudgetAllocation.sector))
        .order_by(BudgetAllocation.year)
    )

    if sector:
        query = query.filter(BudgetAllocation.sector.has(name=sector))

    allocations = query.all()

    # Group by sector
    trends: dict = {}
    for alloc in allocations:
        sec_name = alloc.sector.name
        if sec_name not in trends:
            trends[sec_name] = []
        trends[sec_name].append(
            {"year": alloc.year, "amount_crores": alloc.amount_crores}
        )

    return [
        {"sector": sector_name, "yearly_data": data}
        for sector_name, data in trends.items()
    ]


@router.get("/promise-alignment")
def get_promise_budget_alignment(
    db: Session = Depends(get_db),
):
    """Identify funding gaps — sectors with promises but low/no budget growth."""
    if "alignment" in CACHE:
        return CACHE["alignment"]

    sectors = db.query(Sector).all()
    result = []

    for sec in sectors:
        promise_count = (
            db.query(Promise).filter(Promise.sector_id == sec.id).count()
        )
        budgets = (
            db.query(BudgetAllocation)
            .filter(BudgetAllocation.sector_id == sec.id)
            .order_by(BudgetAllocation.year)
            .all()
        )

        if not budgets:
            budget_growth = 0.0
            avg_funding = 0.0
        else:
            amounts = [b.amount_crores for b in budgets]
            avg_funding = sum(amounts) / len(amounts)
            budget_growth = (
                ((amounts[-1] - amounts[0]) / amounts[0] * 100) if amounts[0] > 0 else 0.0
            )

        result.append(
            {
                "sector": sec.name,
                "promise_count": promise_count,
                "avg_funding_crores": round(avg_funding, 2),
                "budget_growth_percent": round(budget_growth, 2),
                "alignment": (
                    "strong" if budget_growth > 20 and promise_count > 0
                    else "moderate" if budget_growth > 0 and promise_count > 0
                    else "weak" if promise_count > 0
                    else "no_promises"
                ),
            }
        )

    CACHE["alignment"] = result
    return result
