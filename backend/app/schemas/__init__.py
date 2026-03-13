from pydantic import BaseModel
from typing import Optional


# --- Election Cycle ---
class ElectionCycleOut(BaseModel):
    id: int
    name: str
    start_year: int
    end_year: int

    class Config:
        from_attributes = True


# --- Sector ---
class SectorOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True


# --- Promise ---
class PromiseBase(BaseModel):
    text: str
    status: str = "no_progress"
    fulfillment_score: float = 0.0
    source_document: Optional[str] = None
    ai_insight: Optional[str] = None
    sector_id: int
    election_cycle_id: int


class PromiseOut(PromiseBase):
    id: int
    sector: SectorOut
    election_cycle: ElectionCycleOut

    class Config:
        from_attributes = True


class PromiseBrief(BaseModel):
    id: int
    text: str
    status: str
    fulfillment_score: float
    sector: SectorOut
    election_cycle: ElectionCycleOut

    class Config:
        from_attributes = True


# --- Policy ---
class PolicyBase(BaseModel):
    name: str
    description: Optional[str] = None
    year_introduced: int
    status: str = "proposed"
    ministry: Optional[str] = None
    ai_summary: Optional[str] = None
    source_url: Optional[str] = None
    sector_id: int
    policy_level: str = "union"
    state_name: Optional[str] = None


class PolicyOut(PolicyBase):
    id: int
    sector: SectorOut

    class Config:
        from_attributes = True


class PolicyBrief(BaseModel):
    id: int
    name: str
    year_introduced: int
    status: str
    sector: SectorOut
    policy_level: str = "union"
    state_name: Optional[str] = None

    class Config:
        from_attributes = True


# --- Bill ---
class BillBase(BaseModel):
    name: str
    ministry: Optional[str] = None
    status: str = "introduced"
    introduced_date: Optional[str] = None
    description: Optional[str] = None
    source_url: Optional[str] = None
    sector_id: Optional[int] = None


class BillOut(BillBase):
    id: int
    sector: Optional[SectorOut] = None

    class Config:
        from_attributes = True


# --- Budget ---
class BudgetAllocationOut(BaseModel):
    id: int
    year: int
    amount_crores: float
    sector: SectorOut
    election_cycle: ElectionCycleOut

    class Config:
        from_attributes = True


class SectorBudgetSummary(BaseModel):
    sector: str
    total_amount: float
    yearly_data: list[dict]


# --- Timeline Event ---
class TimelineEventOut(BaseModel):
    id: int
    event_type: str
    year: int
    description: Optional[str] = None
    policy: PolicyBrief

    class Config:
        from_attributes = True


# --- Promise-Policy Mapping ---
class MappingOut(BaseModel):
    id: int
    similarity_score: Optional[float] = None
    promise: PromiseBrief
    policy: PolicyBrief

    class Config:
        from_attributes = True


# --- Dashboard ---
class DashboardSummary(BaseModel):
    total_promises: int
    fulfilled: int
    in_progress: int
    partial: int
    no_progress: int
    total_policies: int
    total_bills: int
    sector_distribution: list[dict]


class RecentActivity(BaseModel):
    year: int
    policy_name: str
    event_type: str
    description: Optional[str] = None


# --- AI Assistant ---
class AIQuestion(BaseModel):
    question: str
    election_cycle: Optional[str] = None
    sector: Optional[str] = None


class AIResponse(BaseModel):
    answer: str
    evidence: list[dict]
    suggestions: list[str]
