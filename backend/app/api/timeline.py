from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models import TimelineEvent, Policy, Sector
from app.schemas import TimelineEventOut

router = APIRouter()


@router.get("/events", response_model=list[TimelineEventOut])
def list_timeline_events(
    sector: str | None = None,
    election_cycle: str | None = None,
    event_type: str | None = None,
    year: int | None = None,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
):
    """Get chronological governance events with filters."""
    query = db.query(TimelineEvent).options(
        joinedload(TimelineEvent.policy).joinedload(Policy.sector)
    )

    if sector:
        query = query.join(TimelineEvent.policy).filter(
            Policy.sector.has(name=sector)
        )
    if event_type:
        query = query.filter(TimelineEvent.event_type == event_type)
    if year:
        query = query.filter(TimelineEvent.year == year)

    return (
        query.order_by(TimelineEvent.year.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )


@router.get("/policy/{policy_id}")
def get_policy_timeline(
    policy_id: int,
    db: Session = Depends(get_db),
):
    """Get the full lifecycle timeline for a specific policy."""
    events = (
        db.query(TimelineEvent)
        .options(joinedload(TimelineEvent.policy).joinedload(Policy.sector))
        .filter(TimelineEvent.policy_id == policy_id)
        .order_by(TimelineEvent.year)
        .all()
    )

    if not events:
        return {"policy_id": policy_id, "timeline": []}

    policy = events[0].policy

    return {
        "policy_id": policy.id,
        "policy_name": policy.name,
        "sector": policy.sector.name,
        "status": policy.status,
        "timeline": [
            {
                "id": e.id,
                "event_type": e.event_type,
                "year": e.year,
                "description": e.description,
            }
            for e in events
        ],
    }


@router.get("/sectors")
def get_sector_legislative_activity(
    db: Session = Depends(get_db),
):
    """Get legislative activity count per sector."""
    from sqlalchemy import func

    result = (
        db.query(Sector.name, func.count(TimelineEvent.id).label("event_count"))
        .join(Policy, Policy.sector_id == Sector.id)
        .join(TimelineEvent, TimelineEvent.policy_id == Policy.id)
        .group_by(Sector.name)
        .order_by(func.count(TimelineEvent.id).desc())
        .all()
    )

    return [
        {"sector": name, "event_count": count} for name, count in result
    ]
