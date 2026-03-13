"""
Policy Similarity Search API — /api/policies/similar
======================================================
Uses sentence-transformers to find policies that are semantically
similar to a given policy or free-text query.

Endpoints:
  GET /api/policies/similar?policy_id=X&top_k=5
  GET /api/policies/similar?query=digital+infrastructure&top_k=5

Both endpoints encode the input with all-MiniLM-L6-v2 and run
cosine similarity against all policies loaded from the database.
The model is loaded once at startup and cached.
"""

from functools import lru_cache
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sentence_transformers import SentenceTransformer, util
import torch
import re

from app.database import get_db
from app.models import Policy, Bill

router = APIRouter()

_POLICY_CORPUS_CACHE = None
_POLICY_EMBEDDINGS_CACHE = None
_POLICY_COUNT_CACHE = 0

_BILL_CORPUS_CACHE = None
_BILL_EMBEDDINGS_CACHE = None
_BILL_COUNT_CACHE = 0

# ── Cached model loader ───────────────────────────────────────────────────
@lru_cache(maxsize=1)
def _get_model() -> SentenceTransformer:
    return SentenceTransformer("all-MiniLM-L6-v2")


def _encode(texts: list[str]):
    model = _get_model()
    return model.encode(texts, convert_to_tensor=True, normalize_embeddings=True)


# ── Helper: Build policy text corpus ─────────────────────────────────────
def _build_policy_corpus(policies: list[Policy]) -> list[str]:
    return [
        f"{p.name}. {p.description or ''} {p.ministry or ''} {p.state_name or ''}".strip()
        for p in policies
    ]


# ── /api/policies/similar ────────────────────────────────────────────────
@router.get("/similar")
def find_similar_policies(
    policy_id: int | None = Query(None, description="Source policy ID to find similar to"),
    query: str | None = Query(None, description="Free-text query to match against policies"),
    top_k: int = Query(5, ge=1, le=20, description="Number of similar policies to return"),
    db: Session = Depends(get_db),
):
    """
    Find policies semantically similar to a given policy or text query.

    At least one of `policy_id` or `query` must be provided.

    Example:
      GET /api/policies/similar?policy_id=12&top_k=5
      GET /api/policies/similar?query=renewable+energy+subsidy&top_k=5

    Response:
      [{"id": 7, "name": "Solar Energy Mission", "similarity": 0.91, ...}]
    """
    if not policy_id and not query:
        raise HTTPException(
            status_code=400,
            detail="Provide at least one of: policy_id, query",
        )

    global _POLICY_CORPUS_CACHE, _POLICY_EMBEDDINGS_CACHE, _POLICY_COUNT_CACHE

    all_policies = db.query(Policy).all()
    if not all_policies:
        return []

    if _POLICY_EMBEDDINGS_CACHE is None or len(all_policies) != _POLICY_COUNT_CACHE:
        _POLICY_CORPUS_CACHE = _build_policy_corpus(all_policies)
        _POLICY_EMBEDDINGS_CACHE = _encode(_POLICY_CORPUS_CACHE)
        _POLICY_COUNT_CACHE = len(all_policies)

    corpus_embeddings = _POLICY_EMBEDDINGS_CACHE

    # Build the query embedding
    if policy_id:
        source = db.query(Policy).filter(Policy.id == policy_id).first()
        if not source:
            raise HTTPException(status_code=404, detail=f"Policy {policy_id} not found")
        query_text = f"{source.name}. {source.description or ''} {source.ministry or ''} {source.state_name or ''}".strip()
    else:
        query_text = query  # type: ignore[assignment]

    query_embedding = _encode([query_text])
    
    # Compute cosine similarity
    scores = util.cos_sim(query_embedding, corpus_embeddings)[0]

    # Sort descending, skip the source policy itself
    indexed_scores = sorted(enumerate(scores.tolist()), key=lambda x: x[1], reverse=True)

    results = []
    seen_names = set()
    for idx, score in indexed_scores:
        pol = all_policies[idx]
        # Skip the source policy itself
        if policy_id and pol.id == policy_id:
            continue
            
        # Normalize name by removing years (e.g. ", 2013" or " 2011") and extra spaces
        base_name = re.sub(r',?\s*\d{4}$', '', pol.name).strip().lower()
        if base_name in seen_names:
            continue
        seen_names.add(base_name)
        
        results.append({
            "id":             pol.id,
            "name":           pol.name,
            "description":    pol.description,
            "year_introduced": pol.year_introduced,
            "status":         pol.status,
            "ministry":       pol.ministry,
            "sector":         pol.sector.name if pol.sector else None,
            "similarity":     round(score, 4),
            "policy_level":   pol.policy_level,
            "state_name":     pol.state_name,
        })
        if len(results) >= top_k:
            break

    return results


# ── /api/bills/similar ───────────────────────────────────────────────────
@router.get("/bills/similar")
def find_similar_bills(
    bill_id: int | None = Query(None, description="Source bill ID"),
    query: str | None = Query(None, description="Free-text query"),
    top_k: int = Query(5, ge=1, le=20),
    db: Session = Depends(get_db),
):
    """
    Find bills semantically similar to a given bill or text query.

    Example:
      GET /api/policies/bills/similar?bill_id=5&top_k=5
      GET /api/policies/bills/similar?query=national+health+act&top_k=5
    """
    if not bill_id and not query:
        raise HTTPException(
            status_code=400,
            detail="Provide at least one of: bill_id, query",
        )

    global _BILL_CORPUS_CACHE, _BILL_EMBEDDINGS_CACHE, _BILL_COUNT_CACHE

    all_bills = db.query(Bill).all()
    if not all_bills:
        return []

    if _BILL_EMBEDDINGS_CACHE is None or len(all_bills) != _BILL_COUNT_CACHE:
        _BILL_CORPUS_CACHE = [
            f"{b.name}. {b.description or ''} {b.ministry or ''}".strip()
            for b in all_bills
        ]
        _BILL_EMBEDDINGS_CACHE = _encode(_BILL_CORPUS_CACHE)
        _BILL_COUNT_CACHE = len(all_bills)

    corpus_embeddings = _BILL_EMBEDDINGS_CACHE

    if bill_id:
        source_bill = db.query(Bill).filter(Bill.id == bill_id).first()
        if not source_bill:
            raise HTTPException(status_code=404, detail=f"Bill {bill_id} not found")
        query_text = f"{source_bill.name}. {source_bill.description or ''} {source_bill.ministry or ''}".strip()
    else:
        query_text = query  # type: ignore[assignment]

    query_embedding = _encode([query_text])
    scores = util.cos_sim(query_embedding, corpus_embeddings)[0]
    indexed_scores = sorted(enumerate(scores.tolist()), key=lambda x: x[1], reverse=True)

    results = []
    seen_names = set()
    for idx, score in indexed_scores:
        b = all_bills[idx]
        if bill_id and b.id == bill_id:
            continue
            
        base_name = re.sub(r',?\s*\d{4}$', '', b.name).strip().lower()
        if base_name in seen_names:
            continue
        seen_names.add(base_name)
        
        results.append({
            "id":              b.id,
            "name":            b.name,
            "ministry":        b.ministry,
            "status":          b.status,
            "introduced_date": str(b.introduced_date) if b.introduced_date else None,
            "similarity":      round(score, 4),
        })
        if len(results) >= top_k:
            break

    return results
