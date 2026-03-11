from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class TimelineEvent(Base):
    __tablename__ = "timeline_events"

    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(
        String, nullable=False
    )  # bill_introduced, committee_review, amendment_added, policy_passed, program_launched
    year = Column(Integer, nullable=False)
    description = Column(Text, nullable=True)

    # Foreign keys
    policy_id = Column(Integer, ForeignKey("policies.id"), nullable=False)

    # Relationships
    policy = relationship("Policy", back_populates="timeline_events")
