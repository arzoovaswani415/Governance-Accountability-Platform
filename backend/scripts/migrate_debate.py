import sys
from pathlib import Path

# Add project root to sys.path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from sqlalchemy import create_engine
from app.database import Base, engine
from app.models import BillDebate, DebateSentiment

def migrate():
    print("Creating Parliamentary Debate models directly in PostgreSQL...")
    Base.metadata.create_all(bind=engine, tables=[
        BillDebate.__table__,
        DebateSentiment.__table__
    ])
    print("Successfully migrated BillDebate and DebateSentiment tables!")

if __name__ == "__main__":
    migrate()
