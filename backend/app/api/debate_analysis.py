import os
import json
from fastapi import APIRouter, HTTPException

router = APIRouter()

# Path to the dataset
DATASET_PATH = os.path.join(os.path.dirname(__file__), "..", "..", "data", "debate_analysis.json")

@router.get("/{bill_id}")
async def get_debate_analysis(bill_id: int):
    """Load the dataset and return the debate analysis for a specific bill_id."""
    if not os.path.exists(DATASET_PATH):
        raise HTTPException(status_code=404, detail="Debate dataset not found. Please run the generator script.")
    
    try:
        with open(DATASET_PATH, "r") as f:
            dataset = json.load(f)
            
        # Find the bill in the dataset
        for item in dataset:
            if item.get("bill_id") == bill_id:
                return item
                
        raise HTTPException(status_code=404, detail=f"Debate analysis for bill ID {bill_id} not found.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error reading dataset: {str(e)}")
