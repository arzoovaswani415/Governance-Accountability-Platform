from sqlalchemy import Column, Integer, String, Text, Date, ForeignKey, Float
from sqlalchemy.orm import relationship
from app.database import Base


class BillDebate(Base):
    __tablename__ = "bill_debates"

    id = Column(Integer, primary_key=True, index=True)
    bill_id = Column(Integer, ForeignKey("bills.id", ondelete="CASCADE"), nullable=False)
    stage = Column(String, nullable=False)  # Introduced, Debate, Amendment, Committee Review, Passed
    description = Column(Text, nullable=True)
    source_url = Column(String, nullable=True)
    date = Column(Date, nullable=True)

    # Relationships
    bill = relationship("Bill", back_populates="debates")


class DebateSentiment(Base):
    __tablename__ = "debate_sentiment"

    id = Column(Integer, primary_key=True, index=True)
    bill_id = Column(Integer, ForeignKey("bills.id", ondelete="CASCADE"), nullable=False, unique=True)
    support_percentage = Column(Float, nullable=False, default=0.0)
    opposition_percentage = Column(Float, nullable=False, default=0.0)
    neutral_percentage = Column(Float, nullable=False, default=0.0)
    analysis_summary = Column(Text, nullable=True)
    government_rationale = Column(Text, nullable=True)
    opposition_feedback = Column(Text, nullable=True)
    intelligence_verdict = Column(Text, nullable=True)
    key_themes = Column(Text, nullable=True)
    key_concerns = Column(Text, nullable=True)

    # Relationships
    bill = relationship("Bill", back_populates="sentiment")
