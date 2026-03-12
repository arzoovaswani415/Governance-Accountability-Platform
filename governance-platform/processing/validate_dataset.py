import json
import logging
import subprocess
import sys
from pathlib import Path
from collections import defaultdict

def validate_and_expand():
    kg_path = "data/knowledge_graph.json"
    print("Step 1 — Inspect Current Dataset")
    
    try:
        with open(kg_path, "r", encoding="utf-8") as f:
            kg_data = json.load(f)
            nodes = kg_data.get("nodes", [])
    except Exception as e:
        print(f"Error loading {kg_path}: {e}")
        nodes = []
        
    years = [int(n.get("year")) for n in nodes if n.get("year") and str(n.get("year")).isdigit()]
    total = len(nodes)
    min_year = min(years) if years else 0
    max_year = max(years) if years else 0
    
    counts = defaultdict(int)
    for y in years:
        counts[y] += 1
        
    print(f"Total records: {total}")
    print(f"Minimum year: {min_year}")
    print(f"Maximum year: {max_year}")
    print("Record count per year:")
    for y in sorted(counts.keys()):
        print(f"{y}: {counts[y]}")
        
    print("\nStep 3 — Detect Problems")
    needs_expansion = False
    
    # Target 1500 records and coverage from 2004 as preferred
    preferred_total = 1500
    preferred_start_year = 2004
    
    if total < preferred_total:
        print(f"[!] Total records < {preferred_total} ({total})")
        needs_expansion = True
        
    # Check for missing years or years < 40 records from 2004 to present
    current_year = 2026 # As per metadata
    for y in range(preferred_start_year, current_year):
        # Only enforce 40 records for years 2014 and above
        threshold = 40 if y >= 2014 else 1 # Just ensure at least 1 record for historical
        if counts[y] < threshold:
            print(f"[!] Year {y} has only {counts[y]} records (needs >= {threshold})")
            needs_expansion = True
            
    # Final Report Generation (Always)
    print("\nStep 9 — Produce Final Report")
    try:
        with open(kg_path, "r", encoding="utf-8") as f:
            kg_data_after = json.load(f)
            nodes_final = kg_data_after.get("nodes", [])
            edges_final = kg_data_after.get("edges", [])
    except Exception:
        nodes_final = []
        edges_final = []
        
    years_final = [int(n.get("year")) for n in nodes_final if n.get("year") and str(n.get("year")).isdigit()]
    counts_final = defaultdict(int)
    for y in years_final:
        counts_final[y] += 1
    
    total_final = len(nodes_final)
    edge_count = len(edges_final)
    min_y = min(years_final) if years_final else 0
    max_y = max(years_final) if years_final else 0
    
    # Determine satisfaction
    satisfied = total_final >= 1000
    for y in range(2014, max_y + 1):
        if counts_final[y] < 40:
            satisfied = False
            
    report = f"""
Dataset Validation Report
=========================
Total Records (Nodes): {total_final}
Total Relationships (Edges): {edge_count}
Minimum Year: {min_y}
Maximum Year: {max_y}

Records per year:
"""
    for y in sorted(counts_final.keys()):
        if y >= 2014:
            report += f"{y}: {counts_final[y]}\n"
        else:
            report += f"{y}: {counts_final[y]} (Historical)\n"
            
    report += f"\nDataset satisfies requirements (1000+ total, >=40 per year from 2014): {'Yes' if satisfied else 'No'}\n"
    
    print(report)
    with open("data/dataset_report.txt", "w", encoding="utf-8") as f:
        f.write(report)

if __name__ == "__main__":
    validate_and_expand()
