import json
import logging
from pathlib import Path
import psycopg2
from sentence_transformers import SentenceTransformer, util
import sys

# Add parent directory to path to import database module
sys.path.append(str(Path(__file__).resolve().parent.parent))
from database.postgres_connection import get_connection

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class TimelineBuilder:
    def __init__(self, pib_data_path="data/pib_articles.json", output_path="data/policy_timelines.json", threshold=0.75):
        self.pib_data_path = Path(pib_data_path)
        self.output_path = Path(output_path)
        self.threshold = threshold
        
        # Ensure output directory exists
        self.output_path.parent.mkdir(parents=True, exist_ok=True)
        
        logger.info("Loading SentenceTransformer model 'all-MiniLM-L6-v2'...")
        self.model = SentenceTransformer('all-MiniLM-L6-v2')

    def load_pib_articles(self):
        """Loads press releases from the local JSON file."""
        if not self.pib_data_path.exists():
            logger.error(f"PIB data file not found at {self.pib_data_path}")
            return []
            
        with open(self.pib_data_path, 'r', encoding='utf-8') as f:
            try:
                articles = json.load(f)
                logger.info(f"Loaded {len(articles)} articles from {self.pib_data_path}")
                return articles
            except json.JSONDecodeError:
                logger.error(f"Failed to parse JSON in {self.pib_data_path}")
                return []

    def get_policies(self):
        """Fetches policy records from PostgreSQL database."""
        policies = []
        try:
            conn = get_connection()
            cursor = conn.cursor()
            
            # Assuming a generic 'policies' table with 'id', 'policy_title', and 'description' columns
            # Adjust the query based on actual schema if different.
            query = "SELECT id, policy_title, description FROM policies"
            cursor.execute(query)
            
            rows = cursor.fetchall()
            for row in rows:
                policies.append({
                    "id": str(row[0]),
                    "title": row[1] or "",
                    "description": row[2] or ""
                })
                
            cursor.close()
            conn.close()
            logger.info(f"Loaded {len(policies)} policies from database.")
        except Exception as e:
            logger.error(f"Error fetching policies from database: {e}")
            
        return policies

    def build_timelines(self):
        """Matches PIB articles to policies and builds the timeline events."""
        articles = self.load_pib_articles()
        policies = self.get_policies()

        if not articles or not policies:
            logger.warning("Missing articles or policies to compare.")
            return

        # Prepare policy texts for embedding (combining title and description for better context)
        policy_texts = [f"{p['title']}. {p['description']}" for p in policies]
        logger.info("Encoding policy texts...")
        policy_embeddings = self.model.encode(policy_texts, convert_to_tensor=True)

        # Prepare timeline dictionary: { policy_id: { policy_id: X, events: [...] } }
        timelines = {p["id"]: {"policy_id": p["id"], "events": []} for p in policies}

        logger.info("Encoding and matching PIB articles...")
        for article in articles:
            # Prefer full text, fallback to title
            text_to_encode = article.get("full_text") or article.get("title", "")
            if not text_to_encode:
                continue

            # Encode article
            article_embedding = self.model.encode(text_to_encode, convert_to_tensor=True)

            # Compute similarity with all policies
            cosine_scores = util.cos_sim(article_embedding, policy_embeddings)[0]

            # Find policies with similarity > threshold
            for i, score in enumerate(cosine_scores):
                if score.item() > self.threshold:
                    matched_policy_id = policies[i]["id"]
                    
                    # Create event record
                    event = {
                        "date": article.get("date", ""),
                        "event_type": "announcement",
                        "source": "PIB",
                        "title": article.get("title", ""),
                        "url": article.get("article_url", "")
                    }
                    
                    timelines[matched_policy_id]["events"].append(event)
                    
        # Filter out policies that have no events
        final_timelines = [t for t in timelines.values() if len(t["events"]) > 0]
        
        # Sort events by date within each timeline
        for t in final_timelines:
            # basic string sort for YYYY-MM-DD
            t["events"].sort(key=lambda x: x["date"])

        # Save results
        with open(self.output_path, 'w', encoding='utf-8') as f:
            json.dump(final_timelines, f, indent=4, ensure_ascii=False)
            
        logger.info(f"Successfully generated timelines for {len(final_timelines)} policies.")
        logger.info(f"Saved results to {self.output_path}")
        return final_timelines

if __name__ == "__main__":
    builder = TimelineBuilder()
    builder.build_timelines()
