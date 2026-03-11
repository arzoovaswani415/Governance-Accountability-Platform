from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Policy(Base):
    __tablename__ = "policies"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    year_introduced = Column(Integer, nullable=False)
    status = Column(
        String, nullable=False, default="proposed"
    )  # proposed, under_review, passed, implemented
    ministry = Column(String, nullable=True)
    ai_summary = Column(Text, nullable=True)  # AI-generated simplified explanation
    source_url = Column(String, nullable=True)

    # Foreign keys
    sector_id = Column(Integer, ForeignKey("sectors.id"), nullable=False)

    # Relationships
    sector = relationship("Sector", back_populates="policies")
    promise_mappings = relationship("PromisePolicyMapping", back_populates="policy")
    timeline_events = relationship("TimelineEvent", back_populates="policy")
