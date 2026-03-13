import sys
import numpy as np
from pathlib import Path
from sklearn.metrics.pairwise import cosine_similarity

# Ensure backend root is in PYTHONPATH
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import SessionLocal
from app.models import Policy, PolicyMapping

def map_state_policies_to_national(min_score=0.4):
    """
    Map state policies to national policies using SentenceTransformers.
    """
    print("Starting semantic mapping for state policies...")
    
    try:
        from sentence_transformers import SentenceTransformer
    except ImportError:
        print("sentence-transformers not installed. Skipping mapping.")
        return
        
    db = SessionLocal()
    try:
        model = SentenceTransformer('all-MiniLM-L6-v2')
        
        state_policies = db.query(Policy).filter(Policy.policy_level == "state").all()
        national_policies = db.query(Policy).filter(Policy.policy_level == "union").all()
        
        if not state_policies or not national_policies:
            print("Missing state or national policies to perform mapping.")
            return

        print(f"Mapping {len(state_policies)} state policies to {len(national_policies)} national policies.")
        
        national_texts = [f"{p.name}. {p.description or ''}" for p in national_policies]
        print("Generating embeddings for national policies...")
        national_embs = model.encode(national_texts)
        
        total_mappings = 0
        for sp in state_policies:
            # Check if mappings already exist
            existing = db.query(PolicyMapping).filter(PolicyMapping.state_policy_id == sp.id).count()
            if existing > 0:
                continue

            sp_text = f"{sp.name}. {sp.description or ''}"
            sp_emb = model.encode([sp_text])[0]

            sims = cosine_similarity([sp_emb], national_embs)[0]
            top_indices = np.argsort(sims)[-3:][::-1] # top 3
            
            for idx in top_indices:
                score = float(sims[idx])
                if score >= min_score:
                    mapping = PolicyMapping(
                        state_policy_id=sp.id,
                        national_policy_id=national_policies[idx].id,
                        similarity_score=score
                    )
                    db.add(mapping)
                    total_mappings += 1

        db.commit()
        print(f"Added {total_mappings} new policy mappings.")
    except Exception as e:
        import traceback
        traceback.print_exc()
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    map_state_policies_to_national()
