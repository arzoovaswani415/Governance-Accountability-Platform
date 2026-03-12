import sys
from pathlib import Path

# Ensure backend root is in PYTHONPATH
sys.path.insert(0, str(Path(__file__).parent.parent))

from processing.policy_dataset_ingestion import load_policy_dataset
from processing.state_policy_mapper import map_state_policies_to_national

def run_policy_pipeline():
    print("Starting Policy Dataset Intelligence Pipeline...")
    
    # Path to CSV
    csv_file = str(Path(__file__).parent.parent.parent / "governance-platform" / "data" / "datasets" / "policies_dataset.csv")
    
    # 1. Ingest Data
    print("\n--- Step 1: Ingesting Data from CSV ---")
    load_policy_dataset(csv_file)
    
    # 2. Semantic Mapping 
    # This automatically queries all state policies and maps them to union policies
    print("\n--- Step 2: Running Semantic Mapping ---")
    map_state_policies_to_national()
    
    print("\nState Policy Dataset Pipeline complete!")

if __name__ == "__main__":
    run_policy_pipeline()
