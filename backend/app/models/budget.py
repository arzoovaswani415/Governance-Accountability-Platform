from sqlalchemy import Column, Integer, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class BudgetAllocation(Base):
    __tablename__ = "budget_allocations"

    id = Column(Integer, primary_key=True, index=True)
    year = Column(Integer, nullable=False)
    amount_crores = Column(Float, nullable=False)

    # Foreign keys
    sector_id = Column(Integer, ForeignKey("sectors.id"), nullable=False)
    election_cycle_id = Column(Integer, ForeignKey("election_cycles.id"), nullable=False)

    # Relationships
    sector = relationship("Sector", back_populates="budget_allocations")
    election_cycle = relationship("ElectionCycle", back_populates="budget_allocations")
