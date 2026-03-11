"""
Seed script — populates the database with realistic Indian governance data.

Run: python -m seed.seed_data
"""

import sys
import os

# Ensure backend is on the path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import engine, SessionLocal, Base
from app.models import (
    ElectionCycle,
    Sector,
    Promise,
    Policy,
    Bill,
    BudgetAllocation,
    TimelineEvent,
    PromisePolicyMapping,
)


def seed():
    # Create tables
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # Check if already seeded
        if db.query(Sector).count() > 0:
            print("Database already seeded. Skipping.")
            return

        print("Seeding database...")

        # ── Election Cycles ──
        cycle_2014 = ElectionCycle(name="2014-2019", start_year=2014, end_year=2019)
        cycle_2019 = ElectionCycle(name="2019-2024", start_year=2019, end_year=2024)
        db.add_all([cycle_2014, cycle_2019])
        db.flush()

        # ── Sectors ──
        sectors_data = [
            ("Healthcare", "Public health, hospitals, medical infrastructure, and health insurance"),
            ("Energy", "Power generation, renewable energy, electrification, and energy access"),
            ("Education", "Schools, universities, skill development, and digital education"),
            ("Agriculture", "Farming, irrigation, crop insurance, and rural development"),
            ("Infrastructure", "Roads, railways, ports, airports, and urban development"),
            ("Environment", "Climate policy, forest conservation, pollution control, and sustainability"),
        ]
        sectors = {}
        for name, desc in sectors_data:
            s = Sector(name=name, description=desc)
            db.add(s)
            db.flush()
            sectors[name] = s

        # ── Promises ──
        promises_data = [
            # Healthcare
            ("Establish health and wellness centres in every village to provide comprehensive primary healthcare.", "Healthcare", cycle_2019, "in_progress", 0.6),
            ("Provide health insurance coverage of ₹5 lakh per family through Ayushman Bharat scheme.", "Healthcare", cycle_2019, "fulfilled", 0.85),
            ("Build new AIIMS institutions across the country to improve tertiary healthcare access.", "Healthcare", cycle_2014, "partial", 0.5),
            ("Ensure availability of affordable medicines through Jan Aushadhi Kendras.", "Healthcare", cycle_2019, "in_progress", 0.55),
            ("Reduce infant mortality and maternal mortality through targeted health programs.", "Healthcare", cycle_2014, "in_progress", 0.4),
            # Energy
            ("Achieve 175 GW renewable energy capacity including 100 GW solar power.", "Energy", cycle_2019, "partial", 0.65),
            ("Provide electricity connections to all households through Saubhagya scheme.", "Energy", cycle_2014, "fulfilled", 0.9),
            ("Promote electric vehicle adoption and establish charging infrastructure.", "Energy", cycle_2019, "in_progress", 0.35),
            ("Increase natural gas share in the energy mix to 15 percent.", "Energy", cycle_2019, "no_progress", 0.1),
            ("Develop hydrogen energy mission for clean energy transition.", "Energy", cycle_2019, "in_progress", 0.25),
            # Education
            ("Implement the National Education Policy to transform the education system.", "Education", cycle_2019, "in_progress", 0.7),
            ("Establish digital infrastructure for online education across rural areas.", "Education", cycle_2019, "partial", 0.45),
            ("Increase public spending on education to 6 percent of GDP.", "Education", cycle_2014, "no_progress", 0.15),
            ("Create world-class institutions and improve university rankings.", "Education", cycle_2019, "in_progress", 0.3),
            ("Launch skill development programs to train youth for employment.", "Education", cycle_2014, "partial", 0.5),
            # Agriculture
            ("Double farmer income through improved market access and fair pricing.", "Agriculture", cycle_2014, "no_progress", 0.2),
            ("Provide crop insurance to all farmers through Pradhan Mantri Fasal Bima Yojana.", "Agriculture", cycle_2019, "partial", 0.55),
            ("Develop micro-irrigation infrastructure to improve water efficiency.", "Agriculture", cycle_2019, "in_progress", 0.4),
            ("Create electronic national agriculture market for transparent trading.", "Agriculture", cycle_2019, "in_progress", 0.45),
            ("Ensure minimum support prices that provide adequate returns to farmers.", "Agriculture", cycle_2014, "partial", 0.35),
            # Infrastructure
            ("Build a national highway network connecting all major cities with expressways.", "Infrastructure", cycle_2014, "in_progress", 0.6),
            ("Develop smart cities with modern urban infrastructure and digital governance.", "Infrastructure", cycle_2014, "partial", 0.4),
            ("Expand railway network and introduce high-speed rail corridors.", "Infrastructure", cycle_2019, "in_progress", 0.35),
            ("Provide housing for all through Pradhan Mantri Awas Yojana.", "Infrastructure", cycle_2014, "partial", 0.5),
            ("Develop waterways and port infrastructure for economic growth.", "Infrastructure", cycle_2019, "in_progress", 0.3),
            # Environment
            ("Achieve net zero carbon emissions by 2070 through climate action programs.", "Environment", cycle_2019, "in_progress", 0.2),
            ("Increase forest cover and restore degraded land through green India mission.", "Environment", cycle_2014, "partial", 0.4),
            ("Implement Swachh Bharat Mission to achieve open defecation free status.", "Environment", cycle_2014, "fulfilled", 0.85),
            ("Establish pollution control measures for major rivers and water bodies.", "Environment", cycle_2019, "in_progress", 0.45),
            ("Promote circular economy and reduce single-use plastic consumption.", "Environment", cycle_2019, "no_progress", 0.15),
        ]

        promise_objects = []
        for text, sector_name, cycle, status, score in promises_data:
            p = Promise(
                text=text,
                sector_id=sectors[sector_name].id,
                election_cycle_id=cycle.id,
                status=status,
                fulfillment_score=score,
                ai_insight=f"Analysis indicates {'strong' if score > 0.7 else 'moderate' if score > 0.4 else 'limited'} governance action for this commitment based on policy activity and budget allocation in the {sector_name} sector.",
            )
            db.add(p)
            db.flush()
            promise_objects.append(p)

        # ── Policies ──
        policies_data = [
            # Healthcare
            ("Ayushman Bharat - Pradhan Mantri Jan Arogya Yojana", "Healthcare", 2018, "implemented", "Ministry of Health", "National health insurance scheme providing ₹5 lakh coverage per family for secondary and tertiary care."),
            ("National Digital Health Mission", "Healthcare", 2020, "implemented", "Ministry of Health", "Digital health ecosystem with unique health IDs and electronic health records for citizens."),
            ("PM Ayushman Bharat Health Infrastructure Mission", "Healthcare", 2021, "implemented", "Ministry of Health", "Strengthening healthcare infrastructure through critical care blocks and health laboratories."),
            # Energy
            ("National Solar Mission Phase-III", "Energy", 2020, "implemented", "Ministry of New and Renewable Energy", "Expansion of solar energy capacity with large-scale solar parks and rooftop installations."),
            ("Pradhan Mantri Sahaj Bijli Har Ghar Yojana (Saubhagya)", "Energy", 2017, "implemented", "Ministry of Power", "Universal household electrification scheme providing free electricity connections."),
            ("National Green Hydrogen Mission", "Energy", 2023, "passed", "Ministry of New and Renewable Energy", "Development of green hydrogen production capacity and hydrogen economy ecosystem."),
            ("Electric Vehicle Policy Framework", "Energy", 2022, "under_review", "Ministry of Heavy Industries", "Comprehensive framework for EV adoption, manufacturing incentives, and charging infrastructure."),
            # Education
            ("National Education Policy 2020", "Education", 2020, "implemented", "Ministry of Education", "Comprehensive education reform covering early childhood to higher education with emphasis on flexibility."),
            ("PM eVIDYA Digital Education Initiative", "Education", 2020, "implemented", "Ministry of Education", "Multi-mode digital education platform for rural and underserved communities."),
            ("Skill India Mission", "Education", 2015, "implemented", "Ministry of Skill Development", "National skill development program to train youth in industry-relevant skills."),
            # Agriculture
            ("Pradhan Mantri Fasal Bima Yojana", "Agriculture", 2016, "implemented", "Ministry of Agriculture", "Comprehensive crop insurance scheme at affordable premiums for farmers."),
            ("Electronic National Agriculture Market (eNAM)", "Agriculture", 2016, "implemented", "Ministry of Agriculture", "Unified national market for agricultural commodities enabling transparent trading."),
            ("Pradhan Mantri Krishi Sinchayee Yojana", "Agriculture", 2015, "implemented", "Ministry of Agriculture", "Micro-irrigation and water efficiency program for sustainable farming."),
            # Infrastructure
            ("Bharatmala Pariyojana", "Infrastructure", 2017, "implemented", "Ministry of Road Transport", "National highway development program connecting economic corridors and border areas."),
            ("Smart Cities Mission", "Infrastructure", 2015, "implemented", "Ministry of Housing", "Urban development program transforming 100 cities with smart infrastructure."),
            ("Pradhan Mantri Awas Yojana", "Infrastructure", 2015, "implemented", "Ministry of Housing", "Housing for All mission providing affordable housing to economically weaker sections."),
            ("National Rail Plan", "Infrastructure", 2021, "passed", "Ministry of Railways", "Long-term strategic plan for railway infrastructure expansion and modernization."),
            # Environment
            ("Swachh Bharat Mission", "Environment", 2014, "implemented", "Ministry of Jal Shakti", "National cleanliness campaign achieving open defecation free status across villages and cities."),
            ("Namami Gange Programme", "Environment", 2015, "implemented", "Ministry of Jal Shakti", "Integrated conservation mission for Ganga river including pollution abatement and rejuvenation."),
            ("National Action Plan on Climate Change", "Environment", 2019, "implemented", "Ministry of Environment", "Updated climate action strategy with enhanced renewable energy and adaptation targets."),
        ]

        policy_objects = []
        for name, sector_name, year, status, ministry, desc in policies_data:
            pol = Policy(
                name=name,
                sector_id=sectors[sector_name].id,
                year_introduced=year,
                status=status,
                ministry=ministry,
                description=desc,
                ai_summary=f"This policy aims to {desc[:80].lower()} It is currently {status.replace('_', ' ')} and affects the {sector_name} sector.",
            )
            db.add(pol)
            db.flush()
            policy_objects.append(pol)

        # ── Promise-Policy Mappings ──
        mappings = [
            (1, 0, 0.85), (1, 1, 0.70),   # Health promises → Health policies
            (0, 2, 0.75), (2, 0, 0.60),
            (3, 1, 0.65),
            (5, 3, 0.90), (6, 4, 0.95),    # Energy promises → Energy policies
            (7, 6, 0.80), (9, 5, 0.75),
            (10, 7, 0.95), (11, 8, 0.80),  # Education promises → Education policies
            (14, 9, 0.85),
            (16, 10, 0.90), (17, 12, 0.85), # Agriculture promises → Agriculture policies
            (18, 11, 0.80),
            (20, 13, 0.90), (21, 14, 0.85), # Infrastructure promises → Infrastructure policies
            (23, 15, 0.90), (22, 16, 0.75),
            (27, 17, 0.95), (28, 18, 0.80), # Environment promises → Environment policies
            (25, 19, 0.70),
        ]
        for p_idx, pol_idx, score in mappings:
            if p_idx < len(promise_objects) and pol_idx < len(policy_objects):
                m = PromisePolicyMapping(
                    promise_id=promise_objects[p_idx].id,
                    policy_id=policy_objects[pol_idx].id,
                    similarity_score=score,
                )
                db.add(m)

        # ── Budget Allocations ──
        budget_data = {
            "Healthcare": [
                (2015, 33150, cycle_2014), (2016, 37000, cycle_2014), (2017, 39500, cycle_2014),
                (2018, 48870, cycle_2014), (2019, 52800, cycle_2014),
                (2020, 67484, cycle_2019), (2021, 73930, cycle_2019), (2022, 83000, cycle_2019),
                (2023, 89155, cycle_2019), (2024, 90659, cycle_2019),
            ],
            "Energy": [
                (2015, 28000, cycle_2014), (2016, 30500, cycle_2014), (2017, 32800, cycle_2014),
                (2018, 38500, cycle_2014), (2019, 42000, cycle_2014),
                (2020, 49720, cycle_2019), (2021, 55000, cycle_2019), (2022, 62000, cycle_2019),
                (2023, 68000, cycle_2019), (2024, 73000, cycle_2019),
            ],
            "Education": [
                (2015, 68960, cycle_2014), (2016, 72390, cycle_2014), (2017, 79680, cycle_2014),
                (2018, 85010, cycle_2014), (2019, 93850, cycle_2014),
                (2020, 99310, cycle_2019), (2021, 93220, cycle_2019), (2022, 104280, cycle_2019),
                (2023, 112899, cycle_2019), (2024, 120628, cycle_2019),
            ],
            "Agriculture": [
                (2015, 24900, cycle_2014), (2016, 35980, cycle_2014), (2017, 41850, cycle_2014),
                (2018, 57600, cycle_2014), (2019, 58080, cycle_2014),
                (2020, 77000, cycle_2019), (2021, 78000, cycle_2019), (2022, 82000, cycle_2019),
                (2023, 88000, cycle_2019), (2024, 95000, cycle_2019),
            ],
            "Infrastructure": [
                (2015, 91500, cycle_2014), (2016, 97000, cycle_2014), (2017, 186570, cycle_2014),
                (2018, 196000, cycle_2014), (2019, 211000, cycle_2014),
                (2020, 233000, cycle_2019), (2021, 263000, cycle_2019), (2022, 305000, cycle_2019),
                (2023, 350000, cycle_2019), (2024, 411000, cycle_2019),
            ],
            "Environment": [
                (2015, 14510, cycle_2014), (2016, 15200, cycle_2014), (2017, 17400, cycle_2014),
                (2018, 21000, cycle_2014), (2019, 24500, cycle_2014),
                (2020, 27000, cycle_2019), (2021, 30000, cycle_2019), (2022, 33000, cycle_2019),
                (2023, 37000, cycle_2019), (2024, 41000, cycle_2019),
            ],
        }

        for sector_name, yearly in budget_data.items():
            for year, amount, cycle in yearly:
                ba = BudgetAllocation(
                    year=year,
                    amount_crores=amount,
                    sector_id=sectors[sector_name].id,
                    election_cycle_id=cycle.id,
                )
                db.add(ba)

        # ── Timeline Events ──
        timeline_data = [
            # Healthcare
            (0, "bill_introduced", 2018, "Ayushman Bharat scheme announced in Union Budget"),
            (0, "policy_passed", 2018, "PMJAY launched providing ₹5 lakh health coverage"),
            (0, "program_launched", 2019, "Over 10 crore families registered under the scheme"),
            (1, "bill_introduced", 2020, "National Digital Health Mission announced by PM"),
            (1, "program_launched", 2021, "ABHA health IDs rolled out across states"),
            (2, "bill_introduced", 2021, "PM-ABHIM announced with ₹64,180 crore outlay"),
            (2, "program_launched", 2022, "Critical care blocks being set up in districts"),
            # Energy
            (3, "bill_introduced", 2015, "National Solar Mission Phase-III guidelines released"),
            (3, "amendment_added", 2019, "Revised target to 450 GW by 2030"),
            (3, "program_launched", 2020, "Large-scale solar parks operational across states"),
            (4, "bill_introduced", 2017, "Saubhagya scheme launched for household electrification"),
            (4, "policy_passed", 2018, "99 percent village electrification achieved"),
            (4, "program_launched", 2019, "Total household electrification target met"),
            (5, "bill_introduced", 2023, "National Green Hydrogen Mission approved by cabinet"),
            (5, "committee_review", 2023, "Strategic interventions for green hydrogen outlined"),
            # Education
            (7, "bill_introduced", 2020, "NEP 2020 approved by Union Cabinet"),
            (7, "policy_passed", 2020, "Implementation framework released to states"),
            (7, "program_launched", 2021, "Academic Bank of Credits and multidisciplinary education launched"),
            (7, "amendment_added", 2023, "Updated guidelines for higher education institutions"),
            (8, "bill_introduced", 2020, "PM eVIDYA announced as part of Atmanirbhar Bharat"),
            (8, "program_launched", 2020, "DIKSHA platform and TV channels launched for education"),
            (9, "bill_introduced", 2015, "Skill India Mission launched by PM"),
            (9, "program_launched", 2016, "ITI upgrading and PMKVY courses rolled out"),
            # Agriculture
            (10, "bill_introduced", 2016, "PMFBY approved by cabinet replacing previous schemes"),
            (10, "program_launched", 2016, "Enrollment of farmers began across all states"),
            (10, "amendment_added", 2020, "Scheme made voluntary for farmers"),
            (11, "bill_introduced", 2016, "eNAM portal launched connecting APMC mandis"),
            (11, "program_launched", 2017, "Over 500 mandis integrated on eNAM platform"),
            (12, "bill_introduced", 2015, "PMKSY launched for per drop more crop"),
            (12, "program_launched", 2016, "Micro-irrigation expansion in water-stressed districts"),
            # Infrastructure
            (13, "bill_introduced", 2017, "Bharatmala Phase-I approved with ₹5.35 lakh crore"),
            (13, "program_launched", 2018, "Highway construction accelerated to 30 km per day"),
            (13, "amendment_added", 2022, "Phase-II planning initiated for additional corridors"),
            (14, "bill_introduced", 2015, "Smart Cities Mission launched for 100 cities"),
            (14, "program_launched", 2016, "First round of 20 smart cities selected"),
            (14, "amendment_added", 2019, "Extended timeline and additional cities included"),
            (15, "bill_introduced", 2015, "PMAY launched for Housing for All by 2022"),
            (15, "program_launched", 2016, "Construction of affordable housing units began"),
            (15, "amendment_added", 2021, "Extended deadline and increased allocation"),
            # Environment
            (17, "bill_introduced", 2014, "Swachh Bharat Mission launched nationwide"),
            (17, "program_launched", 2015, "Mass toilet construction drive across villages"),
            (17, "policy_passed", 2019, "India declared open defecation free"),
            (18, "bill_introduced", 2015, "Namami Gange Programme approved with ₹20,000 crore"),
            (18, "program_launched", 2016, "Sewage treatment projects started along Ganga"),
            (18, "amendment_added", 2020, "Enhanced budget and expanded scope to tributaries"),
        ]

        for pol_idx, event_type, year, desc in timeline_data:
            if pol_idx < len(policy_objects):
                te = TimelineEvent(
                    policy_id=policy_objects[pol_idx].id,
                    event_type=event_type,
                    year=year,
                    description=desc,
                )
                db.add(te)

        db.commit()
        print("✅ Database seeded successfully!")
        print(f"   Sectors: {len(sectors_data)}")
        print(f"   Promises: {len(promises_data)}")
        print(f"   Policies: {len(policies_data)}")
        print(f"   Budget records: {sum(len(v) for v in budget_data.values())}")
        print(f"   Timeline events: {len(timeline_data)}")
        print(f"   Promise-Policy mappings: {len(mappings)}")

    except Exception as e:
        db.rollback()
        print(f"❌ Seeding failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
