from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from app.database import get_db
from app.models import StatePolicy, PolicyMapping, Policy

router = APIRouter()

@router.get("/")
def get_state_policies(
    state: Optional[str] = None,
    sector: Optional[str] = None,
    year: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(StatePolicy)
    if state:
        query = query.filter(StatePolicy.state_name == state)
    if sector:
        query = query.filter(StatePolicy.sector == sector)
    if year:
        query = query.filter(StatePolicy.launch_year == year)
        
    policies = query.all()
    
    return [
        {
            "id": p.id,
            "policy_name": p.policy_name,
            "state_name": p.state_name,
            "sector": p.sector,
            "description": p.description,
            "launch_year": p.launch_year,
            "status": p.status,
            "source_url": p.source_url
        } for p in policies
    ]

@router.get("/{id}/mapping")
def get_policy_mapping(id: int, db: Session = Depends(get_db)):
    state_poly = db.query(StatePolicy).filter(StatePolicy.id == id).first()
    if not state_poly:
        raise HTTPException(status_code=404, detail="State Policy not found")
        
    mappings = db.query(PolicyMapping).filter(PolicyMapping.state_policy_id == id).all()
    
    similar_national_policies = []
    for mapping in mappings:
        national = db.query(Policy).filter(Policy.id == mapping.national_policy_id).first()
        if national:
            similar_national_policies.append({
                "policy_name": national.name,
                "similarity_score": mapping.similarity_score
            })
            
    return {
        "state_policy": state_poly.policy_name,
        "state": state_poly.state_name,
        "similar_national_policies": similar_national_policies
    }

@router.get("/compare")
def compare_state_policies(sector: str, db: Session = Depends(get_db)):
    policies = db.query(StatePolicy).filter(StatePolicy.sector == sector).all()
    
    states = []
    for p in policies:
        states.append({
            "state": p.state_name,
            "policy": p.policy_name
        })
        
    return {
        "sector": sector,
        "states": states
    }
