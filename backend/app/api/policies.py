from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import Policy, PromisePolicyMapping, TimelineEvent
from app.schemas import PolicyOut, PolicyBrief

router = APIRouter()


@router.get("/", response_model=list[PolicyBrief])
def list_policies(
    sector: str | None = None,
    status: str | None = None,
    election_cycle: str | None = None,
    search: str | None = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """List policies with filters."""
    query = db.query(Policy).options(joinedload(Policy.sector))

    if sector:
        query = query.filter(Policy.sector.has(name=sector))
    if status:
        query = query.filter(Policy.status == status)
    if search:
        query = query.filter(
            Policy.name.ilike(f"%{search}%")
            | Policy.description.ilike(f"%{search}%")
        )

    return query.offset(skip).limit(limit).all()


@router.get("/{policy_id}")
def get_policy_detail(
    policy_id: int,
    db: Session = Depends(get_db),
):
    """Get detailed policy view with related promises, timeline, and similar policies."""
    policy = (
        db.query(Policy)
        .options(
            joinedload(Policy.sector),
            joinedload(Policy.promise_mappings).joinedload(PromisePolicyMapping.promise),
            joinedload(Policy.timeline_events),
        )
        .filter(Policy.id == policy_id)
        .first()
    )

    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")

    # Related promises
    related_promises = [
        {
            "id": m.promise.id,
            "text": m.promise.text,
            "status": m.promise.status,
            "similarity_score": m.similarity_score,
        }
        for m in policy.promise_mappings
    ]

    # Timeline events
    timeline = [
        {
            "id": e.id,
            "event_type": e.event_type,
            "year": e.year,
            "description": e.description,
        }
        for e in sorted(policy.timeline_events, key=lambda e: e.year)
    ]

    # Related policies (same sector)
    related_policies = (
        db.query(Policy)
        .filter(Policy.sector_id == policy.sector_id, Policy.id != policy.id)
        .limit(5)
        .all()
    )

    return {
        "id": policy.id,
        "name": policy.name,
        "description": policy.description,
        "year_introduced": policy.year_introduced,
        "status": policy.status,
        "ministry": policy.ministry,
        "ai_summary": policy.ai_summary,
        "source_url": policy.source_url,
        "sector": {"id": policy.sector.id, "name": policy.sector.name},
        "related_promises": related_promises,
        "timeline": timeline,
        "related_policies": [
            {
                "id": rp.id,
                "name": rp.name,
                "status": rp.status,
                "year_introduced": rp.year_introduced,
            }
            for rp in related_policies
        ],
    }
