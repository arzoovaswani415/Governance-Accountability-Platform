from sqlalchemy import Column, Integer, String, Text, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.database import Base


class PolicyMapping(Base):
    __tablename__ = "policy_mapping"

    id = Column(Integer, primary_key=True, index=True)
    similarity_score = Column(Float, nullable=True)  # 0.0 to 1.0

    state_policy_id = Column(Integer, ForeignKey("policies.id"), nullable=False)
    national_policy_id = Column(Integer, ForeignKey("policies.id"), nullable=False)

    state_policy = relationship("Policy", foreign_keys=[state_policy_id], back_populates="national_mappings")
    national_policy = relationship("Policy", foreign_keys=[national_policy_id], back_populates="state_mappings")


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
    
    policy_level = Column(String, nullable=False, default="union")
    state_name = Column(String, nullable=True)

    # Foreign keys
    sector_id = Column(Integer, ForeignKey("sectors.id"), nullable=False)

    # Relationships
    sector = relationship("Sector", back_populates="policies")
    promise_mappings = relationship("PromisePolicyMapping", back_populates="policy")
    timeline_events = relationship("TimelineEvent", back_populates="policy")
    
    state_mappings = relationship("PolicyMapping", foreign_keys="[PolicyMapping.national_policy_id]", back_populates="national_policy")
    national_mappings = relationship("PolicyMapping", foreign_keys="[PolicyMapping.state_policy_id]", back_populates="state_policy")
