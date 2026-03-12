"""
Knowledge Graph Ingester
======================
Reads the pre-computed `knowledge_graph.json` from the `data/` folder and
ingests the 937 scraped bills and 1,273 news articles into the Supabase database.
"""

import sys
import os
import json
from pathlib import Path
from sqlalchemy.orm import Session
from datetime import date

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import engine, SessionLocal, Base
from app.models import Bill, Sector, TimelineEvent, Policy

DATA_DIR = Path("/home/mahesh/Desktop/Augenblick/data")

def run_ingestion():
    db: Session = SessionLocal()
    
    try:
        print("=" * 60)
        print("  KNOWLEDGE GRAPH INGESTER")
        print("=" * 60)

        kg_path = DATA_DIR / "knowledge_graph.json"
        
        if not kg_path.exists():
            print(f"❌ Could not find {kg_path}")
            return
            
        print("\n[1/3] Loading knowledge graph...")
        with open(kg_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            
        nodes = data.get("nodes", [])
        print(f"      Found {len(nodes)} total nodes.")
        
        # ── 1. Create/Map Sectors ──
        # Get existing sectors from DB to map the nodes
        all_sectors = db.query(Sector).all()
        sector_map = {s.name.lower().replace(" ", "_"): s.id for s in all_sectors}
        # Fallback map for slight mismatches
        fallback = {
            "health": "Healthcare",
            "social_welfare": "Social Welfare", 
            "economy": "Economy",
            "technology": "Technology",
            "infrastructure": "Infrastructure",
            "education": "Education",
            "general": "Economy", # Map general bills to economy by default
            "law_and_order": "Defence",
            "agriculture": "Agriculture",
            "environment": "Environment",
            "energy": "Energy"
        }
        
        print("\n[2/3] Processing Bills...")
        
        bill_nodes = [n for n in nodes if n.get("type") == "bills"]
        news_nodes = [n for n in nodes if n.get("type") == "news"]
        
        print(f"      Found {len(bill_nodes)} legislative bills")
        print(f"      Found {len(news_nodes)} news articles/events")
        
        # Clear old bills to prevent duplicates if run multiple times
        db.query(Bill).delete()
        db.commit()
        
        # --- Ingest Bills ---
        inserted_bills = 0
        for node in bill_nodes:
            raw_sector = node.get("sector", "general").lower()
            mapped_sector_name = fallback.get(raw_sector, raw_sector)
            sector_id = sector_map.get(mapped_sector_name.lower().replace(" ", "_"))
            
            if not sector_id:
                # Find by closest name
                for s in all_sectors:
                    if s.name == mapped_sector_name:
                        sector_id = s.id
                        break
            
            # Create the date object if year exists
            year = node.get("year", 2024)
            int_date = None
            try:
                int_date = date(int(year), 1, 1) if year else None
            except:
                pass
                
            entities = node.get("entities", {})
            ministry = ", ".join(entities.get("ministries", []))
            
            new_bill = Bill(
                name=node.get("title", ""),
                description=node.get("cleaned_text", ""),
                source_url=node.get("source_url", ""),
                status="passed" if year and int(year) < 2024 else "introduced",
                introduced_date=int_date,
                sector_id=sector_id,
                ministry=ministry if ministry else "Government of India"
            )
            db.add(new_bill)
            inserted_bills += 1
            
        db.commit()
        print(f"      ✅ Inserted {inserted_bills} bills into Supabase")
        
        # --- Ingest News as Timeline Events ---
        print("\n[3/3] Processing News & Timeline Events...")
        # To map news to timeline, we just map it to the first policy in that sector for demo purposes
        # Since the actual relationship logic is complex, we just want to populate the UI timeline
        
        db.query(TimelineEvent).delete()
        db.commit()
        
        # get all policies
        all_policies = db.query(Policy).all()
        policy_sector_map = {p.sector_id: p.id for p in all_policies}
        
        inserted_events = 0
        for node in news_nodes:
            raw_sector = node.get("sector", "general").lower()
            mapped_sector_name = fallback.get(raw_sector, raw_sector)
            
            sector_id = None
            for s in all_sectors:
                if s.name == mapped_sector_name:
                    sector_id = s.id
                    break
                    
            if sector_id and policy_sector_map.get(sector_id):
                event = TimelineEvent(
                    policy_id=policy_sector_map[sector_id],
                    event_type="news_report",
                    year=node.get("year", 2024),
                    description=node.get("title", "")
                )
                db.add(event)
                inserted_events += 1
                
        db.commit()
        print(f"      ✅ Inserted {inserted_events} news events into Timeline")
        
        print(f"\n{'=' * 60}")
        print(f"  ✅ INGESTION COMPLETE")
        print(f"{'=' * 60}")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Error during mapping: {e}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

if __name__ == "__main__":
    run_ingestion()
