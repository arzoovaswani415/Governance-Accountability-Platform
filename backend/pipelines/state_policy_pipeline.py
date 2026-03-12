import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import SessionLocal, engine
from app.models import Base, StatePolicy, Sector
from processing.state_policy_dataset import STATE_POLICIES
from processing.state_policy_mapper import map_state_policies_to_national

SECTOR_KEYWORDS = {
    "Healthcare": ["health", "clinic", "hospital", "medicine", "medical", "disease", "treatment", "care", "maternity"],
    "Education": ["school", "education", "student", "college", "learning", "bicycle", "scholarship", "study"],
    "Agriculture": ["farmer", "agriculture", "crop", "irrigation", "soil", "rythu", "kisan", "farming"],
    "Infrastructure": ["road", "bridge", "transport", "building", "housing", "water", "sanitation", "infrastructure"],
    "Social Welfare": ["welfare", "women", "poor", "subsidy", "meal", "food", "pension", "cash transfer", "assistance"],
    "Energy": ["electricity", "power", "solar", "energy", "grid"],
    "Economy": ["business", "employment", "job", "economy", "investment", "msme", "trade", "industry"],
    "Technology": ["tech", "digital", "internet", "software", "it", "broadband", "startup"]
}

def classify_sector(description: str, policy_name: str) -> str:
    """Classify sector based on keywords if missing."""
    text = f"{policy_name} {description}".lower()
    for sector, keywords in SECTOR_KEYWORDS.items():
        if any(kw in text for kw in keywords):
            return sector
    return "Social Welfare"  # Default fallback

def run_pipeline():
    print("Starting State Policy Intelligence Pipeline...")
    
    # Ensure tables are created
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        inserted = 0
        for policy_data in STATE_POLICIES:
            name = policy_data["policy_name"]
            existing = db.query(StatePolicy).filter(StatePolicy.policy_name == name).first()
            
            if not existing:
                sector = policy_data.get("sector")
                if not sector:
                    sector = classify_sector(policy_data.get("description", ""), name)
                
                sp = StatePolicy(
                    policy_name=name,
                    state_name=policy_data["state"],
                    sector=sector,
                    description=policy_data.get("description"),
                    launch_year=policy_data.get("year"),
                    status="active",
                    source_url=policy_data.get("source_url")
                )
                db.add(sp)
                inserted += 1
                
        if inserted > 0:
            db.commit()
            print(f"Inserted {inserted} new state policies into database.")
        else:
            print("No new state policies to insert.")
            
    except Exception as e:
        print(f"Database error: {e}")
        db.rollback()
    finally:
        db.close()
        
    # Generate embeddings, compute similarity, map to national
    map_state_policies_to_national()

    print("State Policy Intelligence Pipeline complete!")

if __name__ == "__main__":
    run_pipeline()
