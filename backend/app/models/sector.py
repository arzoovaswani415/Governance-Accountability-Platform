from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base


class Sector(Base):
    __tablename__ = "sectors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, unique=True)
    description = Column(String, nullable=True)

    # Relationships
    promises = relationship("Promise", back_populates="sector")
    policies = relationship("Policy", back_populates="sector")
    bills = relationship("Bill", back_populates="sector")
    budget_allocations = relationship("BudgetAllocation", back_populates="sector")
