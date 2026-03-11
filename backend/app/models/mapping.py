from sqlalchemy import Column, Integer, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class PromisePolicyMapping(Base):
    __tablename__ = "promise_policy_mappings"

    id = Column(Integer, primary_key=True, index=True)
    similarity_score = Column(Float, nullable=True)  # 0.0 to 1.0

    # Foreign keys
    promise_id = Column(Integer, ForeignKey("promises.id"), nullable=False)
    policy_id = Column(Integer, ForeignKey("policies.id"), nullable=False)

    # Relationships
    promise = relationship("Promise", back_populates="policy_mappings")
    policy = relationship("Policy", back_populates="promise_mappings")
