import json
import logging
from pathlib import Path

# Setup logging
LOG_DIR = Path("logs")
LOG_DIR.mkdir(exist_ok=True)
logging.basicConfig(
    filename=LOG_DIR / "processing.log",
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

def build_graph():
    try:
        cleaned_dir = Path("data/cleaned")
        nodes = []
        node_id_map = {}
        
        # Helper to add node with richer metadata
        def add_node(record, category):
            title = (record.get("headline") or record.get("title") or 
                     record.get("bill_title") or record.get("policy_name") or 
                     record.get("party_name", "") or record.get("bill_name", ""))
            
            if category == "manifestos":
                label = f"{record.get('party_name', '').upper()} Manifesto {record.get('election_year')}"
                node_id = f"manifestos_{record.get('party_name')}_{record.get('election_year')}"
            else:
                label = title
                node_id = f"{category}_{title}"
            
            if node_id not in node_id_map:
                node = {
                    "id": node_id,
                    "title": title,
                    "type": category,
                    "sector": record.get("sector", "General"),
                    "entities": record.get("entities", []),
                    "year": record.get("election_year") or record.get("year") or record.get("published_at", "")[:4],
                    "source": record.get("source") or "Government Data",
                    "source_url": record.get("source_url") or record.get("article_url") or record.get("dataset_url"),
                    "cleaned_text": record.get("cleaned_text") or record.get("description") or record.get("content") or ""
                }
                nodes.append(node)
                node_id_map[node_id] = node_id
            return node_id

        # Process all cleaned files
        for file_path in cleaned_dir.glob("*.json"):
            category = file_path.stem.replace("_cleaned", "")
            with open(file_path, "r", encoding="utf-8") as f:
                records = json.load(f)
                for r in records:
                    add_node(r, category)

        # Load relationships for edges
        rel_file = Path("data/relationships.json")
        edges = []
        if rel_file.exists():
            with open(rel_file, "r", encoding="utf-8") as f:
                relationships = json.load(f)
            
            for rel in relationships:
                source_id = rel['source_id']
                target_id = rel['target_id']
                
                if source_id in node_id_map and target_id in node_id_map:
                    edge = {
                        "source": source_id,
                        "target": target_id,
                        "relationship_type": "linked_to",
                        "semantic_similarity": rel.get("semantic_similarity"),
                        "entity_overlap": rel.get("entity_overlap"),
                        "sector_match": rel.get("sector_match"),
                        "confidence_score": rel.get("confidence_score"),
                        "link_reason": rel.get("link_reason")
                    }
                    edges.append(edge)

        # Inject State Policies and Mappings from Database
        import sys
        backend_dir = Path(__file__).parent.parent.parent / "backend"
        if str(backend_dir) not in sys.path:
            sys.path.insert(0, str(backend_dir))
        
        try:
            from app.database import SessionLocal
            from app.models import Policy, PolicyMapping
            
            db = SessionLocal()
            state_policies = db.query(Policy).filter(Policy.policy_level == "state").all()
            for p in state_policies:
                node_id = f"StatePolicy_{p.id}"
                if node_id not in node_id_map:
                    node = {
                        "id": node_id,
                        "title": p.name,
                        "type": "StatePolicy",
                        "sector": p.sector.name if p.sector else "General",
                        "year": str(p.year_introduced),
                        "source": p.state_name or "State Government",
                        "cleaned_text": p.description or ""
                    }
                    nodes.append(node)
                    node_id_map[node_id] = node_id
            
            mappings = db.query(PolicyMapping).all()
            for m in mappings:
                source_id = f"StatePolicy_{m.state_policy_id}"
                # Find target_id by searching the nodes
                target_id = None
                for n in nodes:
                    if n["type"] == "policies" and n["title"].lower().strip() == m.national_policy.name.lower().strip():
                        target_id = n["id"]
                        break
                
                if target_id and source_id in node_id_map:
                    edge = {
                        "source": source_id,
                        "target": target_id,
                        "relationship_type": "similar_to",
                        "similarity_score": getattr(m, 'similarity_score', 1.0)
                    }
                    edges.append(edge)
                    
            db.close()
            logging.info("Successfully fetched State policies from database for KG.")
        except Exception as ex:
            logging.error(f"Error fetching state policies from DB: {ex}")

        # Final Knowledge Graph
        graph = {
            "nodes": nodes,
            "edges": edges,
            "metadata": {
                "total_nodes": len(nodes),
                "total_edges": len(edges),
                "version": "3.0 (Large Scale Enriched)"
            }
        }

        output_path = Path("data/knowledge_graph.json")
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(graph, f, indent=4, ensure_ascii=False)
            
        logging.info(f"Knowledge graph built with {len(nodes)} nodes and {len(edges)} total edges added to the graph.")
        print(f"Knowledge Graph: Created with {len(nodes)} nodes and {len(edges)} total edges added to the graph.")

    except Exception as e:
        logging.error(f"Error building knowledge graph: {e}")

if __name__ == "__main__":
    build_graph()
