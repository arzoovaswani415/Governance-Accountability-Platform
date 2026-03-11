from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Promise, PromisePolicyMapping
from app.schemas import PromiseOut, PromiseBrief, PolicyBrief

router = APIRouter()


@router.get("/", response_model=list[PromiseBrief])
def list_promises(
    sector: str | None = None,
    status: str | None = None,
    election_cycle: str | None = None,
    search: str | None = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """List promises with filters: sector, status, election_cycle, keyword search."""
    query = db.query(Promise).options(
        joinedload(Promise.sector), joinedload(Promise.election_cycle)
    )

    if sector:
        query = query.filter(Promise.sector.has(name=sector))
    if status:
        query = query.filter(Promise.status == status)
    if election_cycle:
        query = query.filter(Promise.election_cycle.has(name=election_cycle))
    if search:
        query = query.filter(Promise.text.ilike(f"%{search}%"))

    return query.offset(skip).limit(limit).all()


@router.get("/{promise_id}")
def get_promise_detail(
    promise_id: int,
    db: Session = Depends(get_db),
):
    """Get detailed promise view with related policies, budget signals, and timeline."""
    promise = (
        db.query(Promise)
        .options(
            joinedload(Promise.sector),
            joinedload(Promise.election_cycle),
            joinedload(Promise.policy_mappings).joinedload(PromisePolicyMapping.policy),
        )
        .filter(Promise.id == promise_id)
        .first()
    )

    if not promise:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Promise not found")

    # Related policies via mappings
    related_policies = [
        {
            "id": m.policy.id,
            "name": m.policy.name,
            "year_introduced": m.policy.year_introduced,
            "status": m.policy.status,
            "similarity_score": m.similarity_score,
        }
        for m in promise.policy_mappings
    ]

    # Budget signals for this sector
    from app.models import BudgetAllocation
    budget_data = (
        db.query(BudgetAllocation)
        .filter(BudgetAllocation.sector_id == promise.sector_id)
        .order_by(BudgetAllocation.year)
        .all()
    )
    budget_trends = [
        {"year": b.year, "amount_crores": b.amount_crores} for b in budget_data
    ]

    # Timeline events from related policies
    from app.models import TimelineEvent
    policy_ids = [m.policy_id for m in promise.policy_mappings]
    timeline_events = []
    if policy_ids:
        events = (
            db.query(TimelineEvent)
            .filter(TimelineEvent.policy_id.in_(policy_ids))
            .order_by(TimelineEvent.year)
            .all()
        )
        timeline_events = [
            {
                "year": e.year,
                "event_type": e.event_type,
                "description": e.description,
                "policy_name": e.policy.name,
            }
            for e in events
        ]

    return {
        "id": promise.id,
        "text": promise.text,
        "status": promise.status,
        "fulfillment_score": promise.fulfillment_score,
        "ai_insight": promise.ai_insight,
        "sector": {"id": promise.sector.id, "name": promise.sector.name},
        "election_cycle": {
            "id": promise.election_cycle.id,
            "name": promise.election_cycle.name,
        },
        "related_policies": related_policies,
        "budget_trends": budget_trends,
        "timeline_events": timeline_events,
    }
