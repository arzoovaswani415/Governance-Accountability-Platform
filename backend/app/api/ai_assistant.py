from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Promise, Policy, BudgetAllocation, TimelineEvent, Sector
from app.schemas import AIQuestion, AIResponse

router = APIRouter()


def _build_context(question: str, sector: str | None, election_cycle: str | None, db: Session) -> tuple[str, list[dict]]:
    """Build context from the database for the AI to reason over."""
    evidence = []
    context_parts = []

    # Find relevant promises
    promise_query = db.query(Promise).join(Promise.sector)
    if sector:
        promise_query = promise_query.filter(Sector.name == sector)

    promises = promise_query.limit(10).all()
    for p in promises:
        context_parts.append(
            f"Promise ({p.sector.name}, {p.status}): {p.text}"
        )
        evidence.append({
            "type": "promise",
            "id": p.id,
            "text": p.text[:100],
            "status": p.status,
            "sector": p.sector.name,
        })

    # Find relevant policies
    policy_query = db.query(Policy).join(Policy.sector)
    if sector:
        policy_query = policy_query.filter(Sector.name == sector)

    policies = policy_query.limit(10).all()
    for pol in policies:
        context_parts.append(
            f"Policy ({pol.sector.name}, {pol.status}, {pol.year_introduced}): {pol.name} - {pol.description or ''}"
        )
        evidence.append({
            "type": "policy",
            "id": pol.id,
            "name": pol.name,
            "status": pol.status,
            "year": pol.year_introduced,
        })

    # Find relevant budget data
    budget_query = db.query(BudgetAllocation).join(BudgetAllocation.sector)
    if sector:
        budget_query = budget_query.filter(Sector.name == sector)

    budgets = budget_query.order_by(BudgetAllocation.year).limit(20).all()
    for b in budgets:
        context_parts.append(
            f"Budget ({b.sector.name}, {b.year}): ₹{b.amount_crores} crores"
        )

    # Find relevant timeline events
    event_query = db.query(TimelineEvent).join(TimelineEvent.policy).join(Policy.sector)
    if sector:
        event_query = event_query.filter(Sector.name == sector)

    events = event_query.order_by(TimelineEvent.year.desc()).limit(10).all()
    for e in events:
        context_parts.append(
            f"Event ({e.policy.name}, {e.year}): {e.event_type} - {e.description or ''}"
        )

    context = "\n".join(context_parts)
    return context, evidence


def _generate_ai_response(question: str, context: str) -> str:
    """Generate an AI response using Google Gemini or fallback to rule-based."""
    try:
        import google.generativeai as genai
        from app.config import settings

        if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "your_gemini_api_key_here":
            raise ValueError("Gemini API key not configured")

        genai.configure(api_key=settings.GEMINI_API_KEY)
        model = genai.GenerativeModel("gemini-2.0-flash")

        prompt = f"""You are a governance intelligence assistant. Answer the user's question based ONLY on the provided governance data.

GOVERNANCE DATA:
{context}

USER QUESTION: {question}

Provide a clear, structured response that:
1. Directly answers the question
2. References specific promises, policies, or budget data
3. Highlights any gaps or notable findings
4. Keeps the response concise (3-5 paragraphs max)

If the data doesn't contain enough information to fully answer, say so honestly."""

        response = model.generate_content(prompt)
        return response.text

    except Exception as e:
        # Fallback: rule-based summary
        return _fallback_response(question, context)


def _fallback_response(question: str, context: str) -> str:
    """Generate a basic response when LLM is not available."""
    lines = context.split("\n")
    promise_lines = [l for l in lines if l.startswith("Promise")]
    policy_lines = [l for l in lines if l.startswith("Policy")]
    budget_lines = [l for l in lines if l.startswith("Budget")]

    response = f"Based on the governance data available:\n\n"
    response += f"• Found {len(promise_lines)} related promises\n"
    response += f"• Found {len(policy_lines)} related policies\n"
    response += f"• Found {len(budget_lines)} budget records\n\n"

    if promise_lines:
        response += "Key promises:\n"
        for line in promise_lines[:3]:
            response += f"  - {line}\n"

    if policy_lines:
        response += "\nKey policies:\n"
        for line in policy_lines[:3]:
            response += f"  - {line}\n"

    response += "\nNote: For deeper AI analysis, configure the GEMINI_API_KEY in your .env file."
    return response


@router.post("/ask", response_model=AIResponse)
def ask_ai_assistant(
    payload: AIQuestion,
    db: Session = Depends(get_db),
):
    """Ask a natural language question about governance data."""
    context, evidence = _build_context(
        payload.question, payload.sector, payload.election_cycle, db
    )

    answer = _generate_ai_response(payload.question, context)

    # Generate suggestions based on context
    suggestions = []
    sectors_found = set()
    for item in evidence:
        if "sector" in item:
            sectors_found.add(item["sector"])

    for sec in sectors_found:
        suggestions.append(f"What promises were made for the {sec} sector?")
        suggestions.append(f"How has {sec} budget changed over the years?")

    return AIResponse(
        answer=answer,
        evidence=evidence[:10],
        suggestions=suggestions[:5],
    )
