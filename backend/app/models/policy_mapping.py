from sqlalchemy import Column, Integer, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base

class PolicyMapping(Base):
    __tablename__ = "policy_mapping"

    id = Column(Integer, primary_key=True, index=True)
    similarity_score = Column(Float, nullable=True)  # 0.0 to 1.0

    # Foreign keys
    state_policy_id = Column(Integer, ForeignKey("state_policies.id"), nullable=False)
    national_policy_id = Column(Integer, ForeignKey("policies.id"), nullable=False)

    # Relationships
    state_policy = relationship("StatePolicy", back_populates="national_mappings")
    national_policy = relationship("Policy", back_populates="state_mappings")
