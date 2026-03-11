from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import Promise, Policy, Bill, Sector, TimelineEvent
from app.schemas import DashboardSummary, RecentActivity

router = APIRouter()


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary(
    election_cycle: str | None = None,
    sector: str | None = None,
    db: Session = Depends(get_db),
):
    """Get high-level governance overview metrics."""
    query = db.query(Promise)

    # Apply filters
    if election_cycle:
        query = query.join(Promise.election_cycle).filter(
            Promise.election_cycle.has(name=election_cycle)
        )
    if sector:
        query = query.join(Promise.sector).filter(Promise.sector.has(name=sector))

    promises = query.all()

    total = len(promises)
    fulfilled = sum(1 for p in promises if p.status == "fulfilled")
    in_progress = sum(1 for p in promises if p.status == "in_progress")
    partial = sum(1 for p in promises if p.status == "partial")
    no_progress = sum(1 for p in promises if p.status == "no_progress")

    # Sector distribution
    sector_query = (
        db.query(Sector.name, func.count(Promise.id))
        .join(Promise, Promise.sector_id == Sector.id)
        .group_by(Sector.name)
        .all()
    )
    sector_distribution = [
        {"sector": name, "promise_count": count} for name, count in sector_query
    ]

    total_policies = db.query(Policy).count()
    total_bills = db.query(Bill).count()

    return DashboardSummary(
        total_promises=total,
        fulfilled=fulfilled,
        in_progress=in_progress,
        partial=partial,
        no_progress=no_progress,
        total_policies=total_policies,
        total_bills=total_bills,
        sector_distribution=sector_distribution,
    )


@router.get("/recent-activity", response_model=list[RecentActivity])
def get_recent_activity(
    limit: int = 10,
    db: Session = Depends(get_db),
):
    """Get the most recent governance events."""
    events = (
        db.query(TimelineEvent)
        .join(TimelineEvent.policy)
        .order_by(TimelineEvent.year.desc())
        .limit(limit)
        .all()
    )

    return [
        RecentActivity(
            year=event.year,
            policy_name=event.policy.name,
            event_type=event.event_type,
            description=event.description,
        )
        for event in events
    ]


@router.get("/sector-performance")
def get_sector_performance(
    election_cycle: str | None = None,
    db: Session = Depends(get_db),
):
    """Get promises and policy counts per sector."""
    sectors = db.query(Sector).all()
    result = []

    for sec in sectors:
        promise_query = db.query(Promise).filter(Promise.sector_id == sec.id)
        policy_query = db.query(Policy).filter(Policy.sector_id == sec.id)

        if election_cycle:
            promise_query = promise_query.join(Promise.election_cycle).filter(
                Promise.election_cycle.has(name=election_cycle)
            )

        result.append(
            {
                "sector": sec.name,
                "total_promises": promise_query.count(),
                "fulfilled_promises": promise_query.filter(
                    Promise.status == "fulfilled"
                ).count(),
                "total_policies": policy_query.count(),
            }
        )

    return result


@router.get("/budget-trends")
def get_budget_trends(
    db: Session = Depends(get_db),
):
    """Get budget allocation trends across years and sectors."""
    from app.models import BudgetAllocation

    allocations = (
        db.query(BudgetAllocation)
        .join(BudgetAllocation.sector)
        .order_by(BudgetAllocation.year)
        .all()
    )

    trends: dict = {}
    for alloc in allocations:
        sector_name = alloc.sector.name
        if sector_name not in trends:
            trends[sector_name] = []
        trends[sector_name].append(
            {"year": alloc.year, "amount_crores": alloc.amount_crores}
        )

    return [
        {"sector": sector, "yearly_data": data} for sector, data in trends.items()
    ]
