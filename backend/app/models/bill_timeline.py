"""
BillTimeline SQLAlchemy model.

Stores individual legislative stage events detected from news articles
for each bill tracked in the `bills` table.
"""

from sqlalchemy import Column, Integer, String, Text, Date, ForeignKey, DateTime, func
from sqlalchemy.orm import relationship
from app.database import Base


class BillTimeline(Base):
    """
    Represents a single stage event in a bill's legislative evolution.

    Each row captures when a bill transitioned to a specific stage
    (e.g. INTRODUCED → COMMITTEE_REVIEW → PASSED), sourced from a news article.
    """
    __tablename__ = "bill_timelines"

    id          = Column(Integer, primary_key=True, index=True)
    bill_id     = Column(Integer, ForeignKey("bills.id"), nullable=False, index=True)
    stage       = Column(String, nullable=False)      # INTRODUCED | AMENDMENT | COMMITTEE_REVIEW | PASSED | IMPLEMENTED
    event_date  = Column(Date,   nullable=True)
    description = Column(Text,   nullable=True)
    source_url  = Column(String, nullable=True)
    created_at  = Column(DateTime, server_default=func.now())

    # Relationships
    bill = relationship("Bill", back_populates="bill_timelines")
