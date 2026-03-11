from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base


class ElectionCycle(Base):
    __tablename__ = "election_cycles"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # e.g. "2019-2024"
    start_year = Column(Integer, nullable=False)
    end_year = Column(Integer, nullable=False)

    # Relationships
    promises = relationship("Promise", back_populates="election_cycle")
    budget_allocations = relationship("BudgetAllocation", back_populates="election_cycle")
