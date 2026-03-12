"""
Final Data Polish Script
=======================
Populates promise_policy_mappings and budget_allocations using real sector IDs.
Ensures the 193 Manifesto Promises are properly linked to the 23 active Policies.
"""

import sys
import os
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).parent))

from app.database import SessionLocal
from app.models import (
    Sector, Promise, Policy, PromisePolicyMapping, 
    BudgetAllocation, ElectionCycle
)

def polish_data():
    db = SessionLocal()
    try:
        print("--- Global Data Polish Starting ---")
        
        # 1. Map Sectors
        all_sectors = db.query(Sector).all()
        sector_map = {s.name: s.id for s in all_sectors}
        print(f"Sectors mapped: {list(sector_map.keys())}")

        # 2. Get Election Cycles
        cycle_2014 = db.query(ElectionCycle).filter_by(name="2014-2019").first()
        cycle_2019 = db.query(ElectionCycle).filter_by(name="2019-2024").first()
        
        if not cycle_2014 or not cycle_2019:
            print("Missing election cycles. Re-seeding required cycles...")
            if not cycle_2014:
                cycle_2014 = ElectionCycle(name="2014-2019", start_year=2014, end_year=2019)
                db.add(cycle_2014)
            if not cycle_2019:
                cycle_2019 = ElectionCycle(name="2019-2024", start_year=2019, end_year=2024)
                db.add(cycle_2019)
            db.commit()
            cycle_2014 = db.query(ElectionCycle).filter_by(name="2014-2019").first()
            cycle_2019 = db.query(ElectionCycle).filter_by(name="2019-2024").first()

        # 3. Clear existing mappings/budgets to prevent dups
        db.query(PromisePolicyMapping).delete()
        db.query(BudgetAllocation).delete()
        db.commit()

        # 4. Seed Budgets (Estimates based on Union Budgets)
        budget_data = {
            "Healthcare": [
                (2020, 67484, cycle_2019), (2021, 73930, cycle_2019), (2022, 83000, cycle_2019),
                (2023, 89155, cycle_2019), (2024, 90659, cycle_2019)
            ],
            "Energy": [
                (2020, 49720, cycle_2019), (2021, 55000, cycle_2019), (2022, 62000, cycle_2019),
                (2023, 68000, cycle_2019), (2024, 73000, cycle_2019)
            ],
            "Education": [
                (2020, 99310, cycle_2019), (2021, 93220, cycle_2019), (2022, 104280, cycle_2019),
                (2023, 112899, cycle_2019), (2024, 120628, cycle_2019)
            ],
            "Agriculture": [
                (2020, 77000, cycle_2019), (2021, 78000, cycle_2019), (2022, 82000, cycle_2019),
                (2023, 88000, cycle_2019), (2024, 95000, cycle_2019)
            ],
            "Infrastructure": [
                (2020, 233000, cycle_2019), (2021, 263000, cycle_2019), (2022, 305000, cycle_2019),
                (2023, 350000, cycle_2019), (2024, 411000, cycle_2019)
            ],
            "Economy": [
                (2020, 150000, cycle_2019), (2021, 160000, cycle_2019), (2022, 180000, cycle_2019),
                (2023, 200000, cycle_2019), (2024, 220000, cycle_2019)
            ]
        }

        for s_name, records in budget_data.items():
            if s_name in sector_map:
                for year, amount, cycle in records:
                    ba = BudgetAllocation(
                        year=year,
                        amount_crores=amount,
                        sector_id=sector_map[s_name],
                        election_cycle_id=cycle.id
                    )
                    db.add(ba)
        
        db.commit()
        print(f"--- Budgets Seeded ---")

        # 5. Create Promise-Policy Mappings
        # Linking real promises (193) to policies (23) based on sector match
        all_promises = db.query(Promise).all()
        all_policies = db.query(Policy).all()
        
        mappings_created = 0
        for promise in all_promises:
            # find policies in same sector
            sector_policies = [p for p in all_policies if p.sector_id == promise.sector_id]
            for policy in sector_policies[:2]: # link to max 2 policies for variety
                mapping = PromisePolicyMapping(
                    promise_id=promise.id,
                    policy_id=policy.id,
                    similarity_score=0.65 if promise.status == "in_progress" else 0.85
                )
                db.add(mapping)
                mappings_created += 1
        
        db.commit()
        print(f"--- Mappings Created: {mappings_created} ---")
        print("--- Global Data Polish Finished Successfully ---")

    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    polish_data()
