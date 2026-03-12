from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Promise, Policy, BudgetAllocation, Sector, PromisePolicyMapping, Bill
from typing import List, Dict

router = APIRouter()

@router.get("/graph-data")
def get_graph_data(db: Session = Depends(get_db)):
    """
    Generate the node-link data structure for the Governance Intelligence Graph.
    Nodes: Promise, Policy, Budget, Program
    Links: Promise -> Policy, Policy -> Budget, Budget -> Program
    """
    nodes = []
    links = []
    
    # 1. Fetch Promises
    promises = db.query(Promise).limit(50).all()
    for p in promises:
        nodes.append({
            "id": f"promise_{p.id}",
            "name": p.text[:50] + "...",
            "type": "promise",
            "val": 10,
            "details": p.text
        })
        
    # 2. Fetch Policies mapped to these promises
    promise_ids = [p.id for p in promises]
    mappings = db.query(PromisePolicyMapping).filter(PromisePolicyMapping.promise_id.in_(promise_ids)).all()
    
    policy_ids = list(set([m.policy_id for m in mappings]))
    policies = db.query(Policy).filter(Policy.id.in_(policy_ids)).all()
    
    for pol in policies:
        nodes.append({
            "id": f"policy_{pol.id}",
            "name": pol.name,
            "type": "policy",
            "val": 8,
            "details": pol.description or "No description available."
        })
        
    # Add links for Promise -> Policy
    for m in mappings:
        links.append({
            "source": f"promise_{m.promise_id}",
            "target": f"policy_{m.policy_id}",
            "value": 1
        })
        
    # 3. Add Budget nodes based on sectors of these policies
    sector_ids = list(set([pol.sector_id for pol in policies]))
    budgets = db.query(BudgetAllocation).filter(BudgetAllocation.sector_id.in_(sector_ids)).all()
    
    # We'll create one budget node per sector-year or aggregate
    for b in budgets:
        # Avoid duplicate budget nodes for same sector if we want a clean graph
        budget_node_id = f"budget_{b.sector_id}_{b.year}"
        nodes.append({
            "id": budget_node_id,
            "name": f"{b.sector.name} Budget {b.year}",
            "type": "budget",
            "val": 6,
            "details": f"Allocation: {b.amount_crores} Crores for the year {b.year}."
        })
        
        # Link Policy to its Sector Budget
        for pol in policies:
            if pol.sector_id == b.sector_id:
                links.append({
                    "source": f"policy_{pol.id}",
                    "target": budget_node_id,
                    "value": 1
                })
                
    # 4. Add "Program/Outcome" nodes based on policy status
    for pol in policies:
        if pol.status in ["passed", "implemented"]:
            outcome_id = f"program_{pol.id}"
            nodes.append({
                "id": outcome_id,
                "name": f"{pol.name} Implementation",
                "type": "program",
                "val": 5,
                "details": f"Outcome status: {pol.status.capitalize()}. This program marks the operative phase of the policy."
            })
            links.append({
                "source": f"policy_{pol.id}",
                "target": outcome_id,
                "value": 1
            })

    # Dedup nodes by ID
    unique_nodes = {n['id']: n for n in nodes}.values()

    return {
        "nodes": list(unique_nodes),
        "links": links
    }
