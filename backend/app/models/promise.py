from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.database import Base


class Promise(Base):
    __tablename__ = "promises"

    id = Column(Integer, primary_key=True, index=True)
    text = Column(Text, nullable=False)
    status = Column(
        String, nullable=False, default="no_progress"
    )  # fulfilled, in_progress, partial, no_progress
    fulfillment_score = Column(Float, nullable=False, default=0.0)  # 0.0 to 1.0
    source_document = Column(String, nullable=True)
    ai_insight = Column(Text, nullable=True)  # AI-generated progress explanation

    # Foreign keys
    sector_id = Column(Integer, ForeignKey("sectors.id"), nullable=False)
    election_cycle_id = Column(Integer, ForeignKey("election_cycles.id"), nullable=False)

    # Relationships
    sector = relationship("Sector", back_populates="promises")
    election_cycle = relationship("ElectionCycle", back_populates="promises")
    policy_mappings = relationship("PromisePolicyMapping", back_populates="promise")
