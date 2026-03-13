import sys
import pandas as pd
from pathlib import Path
import math

# Ensure backend root is in PYTHONPATH
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import SessionLocal
from app.models import Policy, Sector

def load_policy_dataset(csv_path: str):
    """Loads, cleans, and inserts the policy dataset."""
    db = SessionLocal()
    try:
        df = pd.read_csv(csv_path)
        
        # Clean data: handle NaNs
        df = df.fillna("")
        
        print(f"Loaded {len(df)} records from {csv_path}")

        records_added = 0
        for index, row in df.iterrows():
            name = str(row.get("policy_title", "")).strip()
            state = str(row.get("state", "")).strip()
            sector_name = str(row.get("sector", "")).strip()
            year = row.get("launch_year", 2024)
            description = str(row.get("description", "")).strip()
            source_url = str(row.get("source_url", "")).strip()
            
            if not name:
                continue
                
            # Handle float years if loaded as NaN
            try:
                if isinstance(year, float) and math.isnan(year):
                    year = 2024
                else:
                    year = int(year)
            except (ValueError, TypeError):
                year = 2024
                
            # Determine policy level
            if state.lower() == "india":
                policy_level = "union"
                state_name = None
            else:
                policy_level = "state"
                state_name = state
                
            # Check or create sector
            if sector_name:
                sector_obj = db.query(Sector).filter(Sector.name.ilike(f"%{sector_name}%")).first()
                if not sector_obj:
                    sector_obj = Sector(name=sector_name, description=f"{sector_name} sector")
                    db.add(sector_obj)
                    db.commit()
                    db.refresh(sector_obj)
                sector_id = sector_obj.id
            else:
                # Default sector
                sector_obj = db.query(Sector).first()
                sector_id = sector_obj.id if sector_obj else 1

            # Check if policy already exists
            existing_policy = db.query(Policy).filter(Policy.name == name).first()
            if existing_policy:
                # Update existing
                existing_policy.description = description
                existing_policy.year_introduced = year
                existing_policy.state_name = state_name
                existing_policy.policy_level = policy_level
                existing_policy.sector_id = sector_id
                existing_policy.source_url = source_url
            else:
                # Insert new
                new_policy = Policy(
                    name=name,
                    description=description,
                    year_introduced=year,
                    policy_level=policy_level,
                    state_name=state_name,
                    sector_id=sector_id,
                    source_url=source_url,
                    status="implemented"  # Assumption for dataset
                )
                db.add(new_policy)
                records_added += 1

        db.commit()
        print(f"Successfully processed policies. Inserted {records_added} new records.")

    except Exception as e:
        print(f"Error ingesting policy dataset: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    csv_file = str(Path(__file__).parent.parent.parent / "governance-platform" / "data" / "datasets" / "policies_dataset.csv")
    load_policy_dataset(csv_file)
