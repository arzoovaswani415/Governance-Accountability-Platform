from sqlalchemy import Column, Integer, String, Text, Date, ForeignKey
from sqlalchemy.orm import relationship
from app.database import Base


class Bill(Base):
    __tablename__ = "bills"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    ministry = Column(String, nullable=True)
    status = Column(
        String, nullable=False, default="introduced"
    )  # introduced, committee_review, amended, passed, implemented
    introduced_date = Column(Date, nullable=True)
    description = Column(Text, nullable=True)
    source_url = Column(String, nullable=True)

    # Foreign keys
    sector_id = Column(Integer, ForeignKey("sectors.id"), nullable=True)

    # Relationships
    sector = relationship("Sector", back_populates="bills")
    bill_timelines = relationship("BillTimeline", back_populates="bill", cascade="all, delete-orphan")
    debates = relationship("BillDebate", back_populates="bill", cascade="all, delete-orphan")
    sentiment = relationship("DebateSentiment", back_populates="bill", cascade="all, delete-orphan", uselist=False)
