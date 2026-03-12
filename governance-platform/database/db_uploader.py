import json
import logging
import os
import sys
from pathlib import Path
import psycopg2
from psycopg2.extras import execute_values

# Add project root to sys.path
sys.path.append(str(Path(__file__).resolve().parent.parent))

from database.postgres_connection import get_connection
from config.settings import LOG_FILE

# Setup logging
logging.basicConfig(filename=LOG_FILE, level=logging.INFO, 
                    format='%(asctime)s - %(levelname)s - %(message)s')

def get_sector_mapping(cursor):
    cursor.execute("SELECT id, name FROM sectors")
    return {name.lower(): id for id, name in cursor.fetchall()}

def get_election_cycle_mapping(cursor):
    cursor.execute("SELECT id, start_year FROM election_cycles")
    return {year: id for id, year in cursor.fetchall()}

def get_existing_urls(cursor, table, url_col):
    try:
        cursor.execute(f"SELECT {url_col} FROM {table}")
        return {row[0] for row in cursor.fetchall() if row[0]}
    except:
        return set()

def upload_kg_to_postgres():
    """
    Optimized upload of knowledge graph nodes to PostgreSQL.
    """
    kg_path = Path("data/knowledge_graph.json")
    if not kg_path.exists():
        logging.error("Knowledge graph file not found. Upload aborted.")
        return

    try:
        with open(kg_path, "r", encoding="utf-8") as f:
            kg_data = json.load(f)
            nodes = kg_data.get("nodes", [])

        if not nodes:
            print("No nodes found to upload.")
            return

        conn = get_connection()
        cursor = conn.cursor()
        
        # Load mappings
        sectors = get_sector_mapping(cursor)
        cycles = get_election_cycle_mapping(cursor)
        
        # Load existing data to skip duplicates
        seen_bills = get_existing_urls(cursor, "bills", "source_url")
        seen_news = get_existing_urls(cursor, "news", "article_url")
        seen_promises = get_existing_urls(cursor, "promises", "source_document")
        seen_policies = get_existing_urls(cursor, "policies", "source_url")

        default_sector_id = sectors.get("environment", 1)
        default_cycle_id = cycles.get(2019, 2)

        data_to_insert = {
            "bills": [],
            "news": [],
            "promises": [],
            "policies": []
        }
        
        for node in nodes:
            node_type = node.get("type", "unknown")
            sector_name = node.get("sector", "Environment").lower()
            sector_id = sectors.get(sector_name, default_sector_id)
            url = node.get("source_url")
            
            if node_type == "bills" and url not in seen_bills:
                data_to_insert["bills"].append((
                    node.get("title", node.get("bill_title")),
                    node.get("ministry", "Legislative Research"),
                    node.get("bill_status", "Tracked"),
                    f"{node.get('year')}-01-01", 
                    url,
                    node.get("cleaned_text", ""),
                    sector_id
                ))
                seen_bills.add(url)
                
            elif node_type == "news" and url not in seen_news:
                data_to_insert["news"].append((
                    node.get("title", node.get("headline")),
                    node.get("source", "NewsAPI"),
                    node.get("cleaned_text", node.get("description")),
                    url,
                    node.get("published_at") or f"{node.get('year')}-01-01 12:00:00"
                ))
                seen_news.add(url)
                
            elif node_type == "manifestos" and url not in seen_promises:
                election_year = node.get("year", node.get("election_year"))
                cycle_id = cycles.get(election_year, default_cycle_id)
                data_to_insert["promises"].append((
                    node.get("cleaned_text", "Policy commitment"),
                    sector_id,
                    cycle_id,
                    "in_progress",
                    0.0,
                    url,
                    f"Scraped manifesto item for {node.get('party_name')} in {election_year}."
                ))
                seen_promises.add(url)
            
            elif node_type == "policies" and url not in seen_policies:
                data_to_insert["policies"].append((
                    node.get("title", node.get("policy_title")),
                    node.get("cleaned_text", node.get("description")),
                    node.get("year", 2024),
                    "implemented",
                    node.get("ministry", "Various"),
                    url,
                    sector_id,
                    f"Processed governance policy in the {sector_name} sector."
                ))
                seen_policies.add(url)

        # Bulk Inserts
        if data_to_insert["bills"]:
            execute_values(cursor, """
                INSERT INTO bills (name, ministry, status, introduced_date, source_url, description, sector_id)
                VALUES %s
            """, data_to_insert["bills"])
            
        if data_to_insert["news"]:
            execute_values(cursor, """
                INSERT INTO news (headline, source, description, article_url, published_at)
                VALUES %s
            """, data_to_insert["news"])
            
        if data_to_insert["promises"]:
            execute_values(cursor, """
                INSERT INTO promises (text, sector_id, election_cycle_id, status, fulfillment_score, source_document, ai_insight)
                VALUES %s
            """, data_to_insert["promises"])
            
        if data_to_insert["policies"]:
            execute_values(cursor, """
                INSERT INTO policies (name, description, year_introduced, status, ministry, source_url, sector_id, ai_summary)
                VALUES %s
            """, data_to_insert["policies"])

        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"PostgreSQL Upload Complete:")
        for k, v in data_to_insert.items():
            if v: print(f" - {k}: {len(v)} new records added")
        if all(not v for v in data_to_insert.values()):
            print("No new records to upload.")

    except Exception as e:
        logging.error(f"Error uploading to PostgreSQL: {e}")
        print(f"Error during PostgreSQL upload: {e}")

if __name__ == "__main__":
    upload_kg_to_postgres()
