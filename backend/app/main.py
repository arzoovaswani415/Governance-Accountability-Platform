from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import create_tables
from app.api import dashboard, promises, policies, budgets, timeline, ai_assistant, sectors
from app.api import budget as budget_pipeline_router
from app.api import bills as bills_router
from app.api import similarity as similarity_router
from app.api import accountability as accountability_router

# Create FastAPI application
app = FastAPI(
    title="Governance Intelligence Platform",
    description="API for analyzing relationships between manifesto promises, government policies, budget allocations, and implementation signals.",
    version="1.0.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API routers
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(promises.router, prefix="/api/promises", tags=["Promises"])
app.include_router(policies.router, prefix="/api/policies", tags=["Policies"])
app.include_router(budgets.router, prefix="/api/budgets", tags=["Budgets"])
app.include_router(timeline.router, prefix="/api/timeline", tags=["Legislative Timeline"])
app.include_router(ai_assistant.router, prefix="/api/ai", tags=["AI Assistant"])
app.include_router(sectors.router, prefix="/api/sectors", tags=["Sectors"])
app.include_router(budget_pipeline_router.router, prefix="/api/budget", tags=["Budget Pipeline"])
app.include_router(bills_router.router, prefix="/api/bills", tags=["Bills"])
app.include_router(similarity_router.router, prefix="/api/similarity", tags=["Similarity"])
app.include_router(accountability_router.router, prefix="/api/accountability", tags=["Accountability"])


@app.on_event("startup")
def on_startup():
    create_tables()


@app.get("/", tags=["Health"])
def root():
    return {
        "status": "online",
        "platform": "Governance Intelligence Platform",
        "docs": "/docs",
    }


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "healthy"}
