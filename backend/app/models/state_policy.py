from sqlalchemy import Column, Integer, String, Text, DateTime, func
from sqlalchemy.orm import relationship
from app.database import Base

class StatePolicy(Base):
    __tablename__ = "state_policies"

    id = Column(Integer, primary_key=True, index=True)
    policy_name = Column(String, nullable=False)
    state_name = Column(String, nullable=False, index=True)
    sector = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    launch_year = Column(Integer, nullable=True)
    status = Column(String, nullable=True, default="active")
    source_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=func.now())

    # Relationships
    national_mappings = relationship("PolicyMapping", back_populates="state_policy")
