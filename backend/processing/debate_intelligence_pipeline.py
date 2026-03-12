import json
import logging
import re
import os
import uuid
from datetime import datetime
from dotenv import load_dotenv

import google.generativeai as genai
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

from app.database import SessionLocal
from app.models import Bill, BillDebate, DebateSentiment

load_dotenv()
logger = logging.getLogger(__name__)

# Try to use standard API first; fall back to dummy mock testing safely.
if os.getenv("GEMINI_API_KEY") and os.getenv("GEMINI_API_KEY") != "your_gemini_api_key_here":
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

DUMMY_DEBATES = [
    {
        "bill_name_matches": ["National Medical Commission", "Digital India", "Data Protection"],
        "transcript": "Members of parliament debated the bill heavily today. Various members stood up to support the bill, stating that it will modernize the infrastructure and we welcome this reform to the system. However, the opposition parties strongly criticized this policy, raising concerns that it centralizes too much power without adequate oversight. We urge the government to modify clause 4 to restore state autonomy. The health minister retaliated by claiming these fears were unfounded and agreed to amend the provision regarding penal codes. Finally, the bill was passed via voice vote."
    },
    {
        "bill_name_matches": ["Agriculture", "Farm", "Goods and Services"],
        "transcript": "The government introduced the landmark bill. Many politicians stood to commend the government for stepping up to solve this decades-long issue. They declared they strongly support the bill as it promises efficiency. A vocal minority chose to oppose the bill strongly, arguing that the revised clause on taxation would hurt the poorest demographics. The speaker called for order. Suggestions were made to change provision 12. The committee review agreed to note the opposition concerns."
    }
]

def load_dummy_transcript(bill_name: str) -> str:
    """Fallback to a robust structured dummy dataset if actual scraping fails."""
    for dummy in DUMMY_DEBATES:
        if any(match.lower() in bill_name.lower() for match in dummy["bill_name_matches"]):
            return dummy["transcript"]
    # Default fallback
    return "The bill was introduced. Many members welcome this reform and support the bill. Some members oppose the bill and raise concerns about its fiscal impact. They plan to amend the core framework. The bill was eventually approved."

def detect_stages(transcript: str):
    """Detect stages using keyword detection from the transcript."""
    stages_found = set()
    t = transcript.lower()

    if "introduced" in t or "tabled" in t or "bill introduced" in t:
        stages_found.add("Introduced")
    if "debate" in t or "discussion" in t or "argued" in t:
        stages_found.add("Debate")
    if "amend" in t or "modify" in t or "revised clause" in t or "change provision" in t:
        stages_found.add("Amendment")
    if "committee" in t or "standing committee" in t or "review committee" in t:
        stages_found.add("Committee Review")
    if "passed" in t or "approved" in t or "voice vote" in t:
        stages_found.add("Passed")
    if "implemented" in t or "scheme launched" in t:
        stages_found.add("Implementation")
        
    if not stages_found:
        stages_found.add("Debate") # Default
    return list(stages_found)

def extract_amendments(transcript: str):
    """Detect amendment related sentences."""
    sentences = re.split(r'[.!?]+', transcript)
    amendments = []
    keywords = ["amend", "modify", "revised clause", "change provision"]
    
    for sentence in sentences:
        s = sentence.strip().lower()
        if any(k in s for k in keywords):
            amendments.append(f"Proposed Amendment finding: {sentence.strip()}.")
            
    return amendments

def analyze_sentiment(transcript: str):
    """Implement sentiment analysis for debate text."""
    sentences = re.split(r'[.!?]+', transcript)
    
    support_keywords = ["support the bill", "welcome this reform", "commend the government", "approve", "landmark"]
    oppose_keywords = ["oppose the bill", "raise concerns", "criticize this policy", "too much power", "hurt"]
    
    support_cnt = 0
    oppose_cnt = 0
    neutral_cnt = 0
    
    for sentence in sentences:
        s = sentence.strip().lower()
        if not s:
            continue
            
        if any(k in s for k in support_keywords):
            support_cnt += 1
        elif any(k in s for k in oppose_keywords):
            oppose_cnt += 1
        else:
            neutral_cnt += 1
            
    total = support_cnt + oppose_cnt + neutral_cnt
    if total == 0:
        return 0, 0, 100
        
    return round((support_cnt/total)*100, 1), round((oppose_cnt/total)*100, 1), round((neutral_cnt/total)*100, 1)

import requests
from bs4 import BeautifulSoup

def scrape_prs_data(bill_name: str) -> str:
    """Scrape PRS India for bill highlights and issues."""
    try:
        # Create slug: Digital Personal Data Protection Bill, 2023 -> digital-personal-data-protection-bill-2023
        slug = bill_name.lower().replace(",", "").replace("  ", " ").replace(" ", "-").replace("(", "").replace(")", "")
        url = f"https://prsindia.org/billtrack/{slug}"
        
        response = requests.get(url, timeout=10)
        if response.status_code != 200:
            return ""
            
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Extract based on verified PRS structure
        content_parts = []
        
        # Look for Highlights and Key Issues
        highlights = soup.find(string=re.compile("Highlights of the Bill", re.I))
        if highlights:
            parent = highlights.find_parent(["h2", "h3", "div"])
            if parent:
                next_node = parent.find_next_sibling()
                while next_node and next_node.name not in ["h2", "h3"]:
                    content_parts.append(next_node.get_text(strip=True))
                    next_node = next_node.find_next_sibling()
                    
        issues = soup.find(string=re.compile("Key Issues and Analysis", re.I))
        if issues:
            parent = issues.find_parent(["h2", "h3", "div"])
            if parent:
                next_node = parent.find_next_sibling()
                while next_node and next_node.name not in ["h2", "h3"]:
                    content_parts.append(next_node.get_text(strip=True))
                    next_node = next_node.find_next_sibling()
                    
        return "\n".join(content_parts)
    except Exception as e:
        logger.error(f"Scraping failed for {bill_name}: {e}")
        return ""

def generate_llm_structured_insights(bill_name: str, transcript: str) -> dict:
    """Use AI to generate structured insights across the transcript."""
    default_res = {
        "summary": "Debate focused on modernization and oversight.",
        "rationale": "Improve infrastructure and efficiency.",
        "feedback": "Concerns about centralization and autonomy.",
        "verdict": "The reform balances power with new standards.",
        "themes": "Modernization, Infrastructure, Governance",
        "concerns": "Centralization, Privacy, Implementation"
    }
    
    if not os.getenv("GEMINI_API_KEY") or os.getenv("GEMINI_API_KEY") == "your_gemini_api_key_here":
         return default_res
         
    try:
        model = genai.GenerativeModel("gemini-2.5-flash")
        prompt = f"""
        Act as a neutral parliamentary reporter tracking legislative intelligence.
        Analyze the following debate transcript/highlights for the '{bill_name}'.
        
        You must return a raw JSON object with exactly these six keys:
        - "summary": A 2-sentence overview.
        - "rationale": The government's core reason for this bill (1 sentence).
        - "feedback": The opposition's primary concerns (1 sentence).
        - "verdict": A summary verdict of the debate dynamics (1 sentence).
        - "themes": A comma-separated list of 3-4 key themes (e.g. "Privacy, Security, Trade").
        - "concerns": A comma-separated list of 3-4 key concerns (e.g. "Oversight, Cost, Rights").
        
        Content: 
        {transcript}
        
        Return ONLY valid JSON.
        """
        res = model.generate_content(prompt)
        # Clean potential markdown from response
        clean_res = res.text.strip().replace("```json", "").replace("```", "")
        return json.loads(clean_res)
    except Exception as e:
        logger.error(f"Failed to generate LLM insights: {e}")
        return default_res

def run_pipeline():
    """Main execution block."""
    db: Session = SessionLocal()
    
    try:
        print("Starting Debate Intelligence Pipeline...")
        bills = db.query(Bill).limit(50).all() # Limit for testing real scraper
        print(f"Processing {len(bills)} bills for real-world intelligence.")
        
        for bill in bills:
            # 1. Scrape Real Data or Fallback to Dummy
            scraped_content = scrape_prs_data(bill.name)
            if scraped_content:
                transcript = scraped_content
                print(f"Scraped real content for: {bill.name}")
            else:
                transcript = load_dummy_transcript(bill.name)
            
            # 2. Extract NLP Intelligence
            stages = detect_stages(transcript)
            amendments = extract_amendments(transcript)
            support_pct, oppose_pct, neutral_pct = analyze_sentiment(transcript)
            
            # 3. Generate LLM Synthesized Insights
            insights = generate_llm_structured_insights(bill.name, transcript)
            
            # 4. Wipe old records (idempotent pipeline)
            db.query(BillDebate).filter(BillDebate.bill_id == bill.id).delete()
            db.query(DebateSentiment).filter(DebateSentiment.bill_id == bill.id).delete()
            
            # 5. DB Commit Stages
            # Use real stages if found, or sensible defaults
            for s in stages:
                db.add(BillDebate(
                    bill_id=bill.id,
                    stage=s,
                    description=f"Legislative processing: {s}",
                    source_url=f"https://prsindia.org/billtrack/{bill.name.lower().replace(' ', '-')}", 
                    date=datetime.now().date()
                ))
                
            for am in amendments:
                db.add(BillDebate(
                    bill_id=bill.id,
                    stage="Amendment",
                    description=am.replace("Proposed Amendment finding: ", ""),
                    source_url="https://loksabha.nic.in/mock",
                    date=datetime.now().date()
                ))
                
            # 6. DB Commit Sentiment & Intelligence
            db.add(DebateSentiment(
                bill_id=bill.id,
                support_percentage=support_pct,
                opposition_percentage=oppose_pct,
                neutral_percentage=neutral_pct,
                analysis_summary=insights.get("summary"),
                government_rationale=insights.get("rationale"),
                opposition_feedback=insights.get("feedback"),
                intelligence_verdict=insights.get("verdict"),
                key_themes=insights.get("themes"),
                key_concerns=insights.get("concerns")
            ))
            
            db.commit()
            print(f"Processed Dynamic Intelligence for Bill #{bill.id}: {bill.name}")
            
    except Exception as e:
        print(f"Pipeline crashed: {e}")
        db.rollback()
    finally:
        db.close()
        print("Debate Intelligence Pipeline finished execution.")

if __name__ == "__main__":
    run_pipeline()
