# Backend — Governance Intelligence Platform

FastAPI backend for the Governance Intelligence & Political Accountability Platform.

## Quick Start

```bash
# 1. Install dependencies
cd backend
pip install -r requirements.txt

# 2. Configure environment
cp .env.example .env
# Edit .env with your Supabase DATABASE_URL and GEMINI_API_KEY

# 3. Seed the database
python -m seed.seed_data

# 4. Start the server
uvicorn app.main:app --reload --port 8000

# 5. Open API docs
# http://localhost:8000/docs
```

## Expose with ngrok

```bash
ngrok http 8000
```

## API Endpoints

| Section | Endpoint | Description |
|---------|----------|-------------|
| Dashboard | `GET /api/dashboard/summary` | Overview metrics |
| Dashboard | `GET /api/dashboard/recent-activity` | Latest events |
| Dashboard | `GET /api/dashboard/sector-performance` | Sector stats |
| Dashboard | `GET /api/dashboard/budget-trends` | Budget trends |
| Promises | `GET /api/promises/` | List with filters |
| Promises | `GET /api/promises/{id}` | Detail + related data |
| Policies | `GET /api/policies/` | List with filters |
| Policies | `GET /api/policies/{id}` | Detail + timeline |
| Budgets | `GET /api/budgets/by-sector` | Sector distribution |
| Budgets | `GET /api/budgets/trends` | Year-over-year |
| Budgets | `GET /api/budgets/promise-alignment` | Funding gaps |
| Timeline | `GET /api/timeline/events` | Chronological events |
| Timeline | `GET /api/timeline/policy/{id}` | Policy lifecycle |
| AI | `POST /api/ai/ask` | Ask governance questions |

All list endpoints support filters: `?sector=Healthcare&election_cycle=2019-2024&status=fulfilled`
