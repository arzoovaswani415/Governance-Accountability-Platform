import os
import json
import logging
import random
import argparse
import sys
from typing import List, Dict
import google.generativeai as genai
from sqlalchemy.orm import Session
from dotenv import load_dotenv

# Add the parent directory to sys.path to import app modules
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), ".."))

from app.database import SessionLocal
from app.models import Bill

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

load_dotenv()

# Configure Gemini
api_key = os.getenv("GEMINI_API_KEY")
if not api_key or "your" in api_key:
    logger.warning("GEMINI_API_KEY is missing or invalid. AI generation will be skipped, and pseudo-data will be used.")
    # sys.exit(1) # Removed sys.exit(1) to allow fallback

# genai.configure(api_key=api_key) # Moved inside generate_debate_for_bill

# Define DATA_FILE constant for the new main function
DATA_FILE = "../data/debate_analysis.json"

def _generate_pseudo_debate(bill_name: str, bill_id: int) -> Dict:
    """Generate high-quality synthetic debate data with significant variance."""
    # Deterministic but varied based on bill_id
    random.seed(bill_id)
    
    themes_pool = [
        "Regulatory Reform", "Digital Infrastructure", "Fiscal Responsibility", 
        "Social Equity", "Administrative Efficiency", "Public Safety", "Economic Growth",
        "Environmental Protection", "Technological Innovation", "Resource Management",
        "Urban Development", "Healthcare Accessibility", "Educational Excellence"
    ]
    concerns_pool = [
        "Implementation Oversight", "Data Privacy", "State Autonomy", 
        "Financial Allocation", "Procedural Transparency", "Long-term Sustainability",
        "Compliance Costs", "Bureaucratic Overreach", "Equitable Distribution",
        "Socio-economic Impact", "Technological Gap", "Legal Ambiguity"
    ]
    
    summaries = [
        f"The debate on '{bill_name}' was polarized, with government members emphasizing structural gains while the opposition flagged procedural gaps.",
        f"Parliamentary discussion for '{bill_name}' saw a rare consensus on the bill's objectives, though specific implementation timelines remained a point of friction.",
        f"Critics of '{bill_name}' raised intense concerns about its impact on local governance, while proponents argued it simplifies complex regulatory frameworks.",
        f"The session dedicated to '{bill_name}' focused heavily on the economic long-term benefits versus immediate administrative challenges.",
        f"A robust exchange of views characterized the reading of '{bill_name}', highlighting the tension between rapid modernization and established safeguards."
    ]
    
    rationales = [
        f"The administration views this as a cornerstone of its vision for a modernized {bill_name[:20]}... framework, aimed at removing legacy bottlenecks.",
        "The primary objective is to enhance ease of operation and ensure that service delivery is more responsive to the public's needs.",
        "The government asserts that the current status quo is unsustainable and this bill provides the necessary legislative teeth for reform.",
        "By consolidating multiple regulations, the bill aims to create a more predictable and investor-friendly environment.",
        "This legislation is designed to future-proof our systems against emerging global and domestic shifts."
    ]
    
    feedbacks = [
        "Opposition members argued that the bill lacks a robust mechanism for independent audit and could lead to centralized control.",
        "The main critique centered on the potential financial burden placed on state governments and small-scale implementation partners.",
        "Stakeholders expressed concern that the definition of 'priority sectors' remains too vague for effective enforcement.",
        "Critics noted that while the intent is noble, the lack of a transitional roadmap could lead to initial systemic chaos.",
        "Feedback suggested that the bill bypasses several consultative steps required for such a significant policy shift."
    ]
    
    verdicts = [
        "A calculated move towards efficiency that will require vigilant parliamentary oversight during its first phase.",
        "A landmark piece of legislation that successfully balances economic ambition with social welfare considerations.",
        "A controversial but necessary overhaul that marks a point of departure from traditional administrative methods.",
        "A step in the right direction, though its success depends entirely on the granularity of the secondary rules.",
        "A comprehensive framework that addresses several long-standing gaps, albeit with some remaining grey areas."
    ]
    
    # Pick 2-3 themes/concerns
    bill_themes = random.sample(themes_pool, random.randint(2, 3))
    bill_concerns = random.sample(concerns_pool, random.randint(2, 3))
    
    # Determine sentiment
    support = random.randint(50, 80)
    opposition = random.randint(10, 40)
    neutral = 100 - support - opposition
    if neutral < 0: # Sanity check
        neutral = 5
        total = support + opposition + neutral
        support = int((support / total) * 100)
        opposition = int((opposition / total) * 100)
        neutral = 100 - support - opposition

    impact_summaries = [
        f"The '{bill_name}' is expected to fundamentally reshape the sectoral landscape by introducing higher accountability and transparency.",
        f"Implementation of '{bill_name}' will likely drive significant efficiency gains, though marginalized groups may face initial accessibility barriers.",
        f"This policy serves as a critical intervention for long-term sustainability, balancing immediate growth needs with future safeguards.",
        f"The overarching impact of '{bill_name}' will be the formalization of previously unregulated processes, boosting investor confidence.",
        f"We anticipate that '{bill_name}' will act as a catalyst for multi-sectoral innovation, though compliance costs will rise for small stakeholders."
    ]
    
    stakeholders_pool = [
        "Rural Citizens", "Small Business Owners", "Tech Startups", "Healthcare Professionals",
        "Students & Educators", "Farmers", "Urban Residents", "Marginalized Communities",
        "Financial Institutions", "Local Governance Bodies", "Industrial Workers", "Senior Citizens"
    ]

    impact_levels = ["Low", "Medium", "High"]

    return {
        "bill_id": bill_id,
        "bill_name": bill_name,
        "debate_summary": random.choice(summaries),
        "key_themes": bill_themes,
        "key_concerns": bill_concerns,
        "sentiment": {
            "support": support,
            "opposition": opposition,
            "neutral": neutral
        },
        "government_rationale": random.choice(rationales),
        "opposition_feedback": random.choice(feedbacks),
        "intelligence_verdict": random.choice(verdicts),
        "impact_assessment": {
            "summary": random.choice(impact_summaries),
            "economic_impact": random.choice(impact_levels),
            "social_impact": random.choice(impact_levels),
            "environmental_impact": random.choice(impact_levels + ["Not Applicable"]),
            "affected_stakeholders": random.sample(stakeholders_pool, random.randint(3, 5))
        },
        "amendments": [
            {
                "phase": "Committee Stage",
                "description": f"Revised definitions in Section {random.randint(1, 20)} to prevent ambiguity.",
                "date": f"2024-0{random.randint(1, 9)}-15"
            },
            {
                "phase": "Floor Debate",
                "description": "Added a requirement for annual performance reports to Parliament.",
                "date": f"2024-0{random.randint(1, 9)}-20"
            }
        ]
    }

def generate_debate_for_bill(bill_name: str, bill_id: int) -> Dict:
    """Generate realistic parliamentary debate analysis using AI."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or "your" in api_key:
        logger.warning(f"No valid GEMINI_API_KEY found. Generating pseudo-debate for '{bill_name}'.")
        return _generate_pseudo_debate(bill_name, bill_id)

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-1.5-pro')
        prompt = f"""
        You are a parliamentary policy analyst.
        Generate realistic parliamentary debate analysis for the following bill:
        Bill Name: {bill_name}

        Provide a structured JSON response with the following fields:
        - bill_id: {bill_id}
        - bill_name: {bill_name}
        - debate_summary: 2-3 sentences summarizing the debate.
        - key_themes: List of 3 key themes discussed.
        - key_concerns: List of 3 key concerns raised by the opposition.
        - sentiment: {{support: %, opposition: %, neutral: %}}
        - government_rationale: 1-2 sentences on why the government supports this.
        - opposition_feedback: 1-2 sentences on the opposition's main critique.
        - intelligence_verdict: A 1-sentence analytical verdict.
        - impact_assessment: {{ summary: string, economic_impact: Low/Medium/High, social_impact: Low/Medium/High, environmental_impact: Low/Medium/High/Not Applicable, affected_stakeholders: [] }}
        - amendments: List of {{phase, description, date}} for 2 major amendments.

        FORMAT: Return ONLY valid JSON.
        """
        response = model.generate_content(prompt)
        # Handle different response structures gracefully
        text = response.text
        if "```json" in text:
            text = text.split("```json")[1].split("```")[0].strip()
        elif "```" in text:
            text = text.split("```")[1].split("```")[0].strip()
        
        return json.loads(text)
    except Exception as e:
        logging.error(f"Error generating debate for {bill_name}: {e}. Falling back to pseudo-data.")
        return _generate_pseudo_debate(bill_name, bill_id)

def main(): # Renamed from run()
    parser = argparse.ArgumentParser(description="Generate synthetic debate analysis.")
    parser.add_argument("--limit", type=int, default=50, help="Number of bills to process.")
    args = parser.parse_args()

    db: Session = SessionLocal()
    try:
        # Create data directory if it doesn't exist
        os.makedirs(os.path.dirname(DATA_FILE), exist_ok=True)
        
        # Fetch bills
        bills = db.query(Bill).limit(args.limit).all()
        logger.info(f"Generating debate analysis for {len(bills)} bills...")
        
        # Load existing data if possible
        existing_data = []
        if os.path.exists(DATA_FILE):
            try:
                with open(DATA_FILE, "r") as f:
                    existing_data = json.load(f)
                logger.info(f"Loaded {len(existing_data)} existing debate analyses from {DATA_FILE}.")
            except json.JSONDecodeError as e:
                logger.warning(f"Could not decode existing data from {DATA_FILE}: {e}. Starting fresh.")
                existing_data = []
        
        bill_map = {item['bill_id']: item for item in existing_data}
        
        for i, bill in enumerate(bills):
            # Always generate fresh data to ensure new fields (like impact_assessment) are included
            logging.info(f"[{i+1}/{len(bills)}] Generating for: {bill.name} (ID: {bill.id})")
            debate_data = generate_debate_for_bill(bill.name, bill.id)
            bill_map[bill.id] = debate_data
            
            # Save progress frequently
            if (i + 1) % 10 == 0 or i == len(bills) - 1:
                with open(DATA_FILE, "w") as f:
                    json.dump(list(bill_map.values()), f, indent=4)
                logger.info(f"Saved progress: {i+1} bills processed.")
                logger.info(f"Saved progress after {i+1} bills to {DATA_FILE}")
        
        # Final save
        with open(DATA_FILE, "w") as f:
            json.dump(list(bill_map.values()), f, indent=4)
            
        logger.info(f"Successfully generated and saved {len(bill_map)} debates to {DATA_FILE}")
        
    finally:
        db.close()


if __name__ == "__main__":
    main() # Changed from run() to main()
