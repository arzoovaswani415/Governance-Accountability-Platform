import argparse
import pandas as pd
from pathlib import Path
import logging
from sentence_transformers import SentenceTransformer
from rapidfuzz import process
from sqlalchemy.orm import Session

# ── Path setup so we can import app modules ────────────────────────────────
import sys
BACKEND_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

from app.database import SessionLocal
from app.models import Sector, BudgetAllocation, ElectionCycle

# ── Directory constants ────────────────────────────────────────────────────
PIPELINE_DIR   = Path(__file__).parent
DATA_RAW       = BACKEND_DIR / "data" / "raw"
DATA_PROCESSED = BACKEND_DIR / "data" / "processed"
DATA_RAW.mkdir(parents=True, exist_ok=True)
DATA_PROCESSED.mkdir(parents=True, exist_ok=True)

# ── Logging ─────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
)
logger = logging.getLogger("budget_pipeline")

# ── STEP 3: Define Target Sectors ──────────────────────────────────────────
sectors = [
    "Healthcare",
    "Education",
    "Infrastructure",
    "Agriculture",
    "Defence",
    "Energy",
    "Environment",
    "Technology"
]

sector_keywords = {
    "Healthcare": ["health", "medical", "family welfare"],
    "Education": ["education", "school", "university"],
    "Infrastructure": ["road", "railway", "transport", "housing"],
    "Agriculture": ["agriculture", "farmer", "rural"],
    "Defence": ["defence", "army", "military"],
    "Energy": ["energy", "power", "renewable"],
    "Environment": ["environment", "climate", "forest"],
    "Technology": ["technology", "electronics", "it", "digital"]
}

# Load the SentenceTransformer model once
mapping_model = SentenceTransformer("all-MiniLM-L6-v2")
sector_embeddings = mapping_model.encode(sectors, convert_to_tensor=True)

# ── Tracking variables ─────────────────────────────────────────────────────
match_stats = {
    "semantic": 0,
    "keyword": 0,
    "fuzzy": 0,
    "total_rows": 0,
    "mapped_sectors": set()
}

# ── STEP 1 & 2: Load and Clean Dataset ─────────────────────────────────────
def load_and_clean_data(file_path: Path, year: int) -> pd.DataFrame:
    logger.info(f"Loading Excel dataset: {file_path}")
    df = pd.read_excel(file_path)
    
    # Custom pre-processing for raw Indian Budget Excel format
    def extract_ministry_name(row):
        col1 = str(row.get('Unnamed: 1', '')).strip()
        col2 = str(row.get('Unnamed: 2', '')).strip()
        
        # If Unnamed: 2 exists and is not 'nan', use it (it's the Department name)
        if col2 and col2 != 'nan':
            return col2
            
        # Otherwise use Unnamed: 1 (it's the Ministry name), IF it's not a serial no.
        if col1 and col1 != 'nan' and not (col1 and col1[0].isdigit() and col1.endswith('.')):
            if col1 == '(In ₹ Crores)' or col1.lower() == 'ministry/department':
                return None
            return col1
            
        return None

    if 'Unnamed: 1' in df.columns and 'Unnamed: 5' in df.columns:
        df['ministry'] = df.apply(extract_ministry_name, axis=1)
        df['total'] = df['Unnamed: 5']
        df['revenue'] = df['Unnamed: 3']
        df['capital'] = df['Unnamed: 4']
    
    # Normalize column names as per instructions
    df.columns = df.columns.astype(str).str.lower().str.strip()
    
    if "ministry" not in df.columns or "total" not in df.columns:
        raise ValueError("Expected columns 'ministry' and 'total' not found")
        
    df = df.dropna(subset=["ministry"])
    df["ministry"] = df["ministry"].astype(str).str.strip()
    df = df[df["ministry"] != ""]
    
    keep_cols = ["ministry", "total"]
    if "revenue" in df.columns: keep_cols.append("revenue")
    if "capital" in df.columns: keep_cols.append("capital")
        
    df = df[keep_cols].rename(columns={"total": "budget"})
    
    # Clean up budget numbers
    def to_numeric(col: pd.Series) -> pd.Series:
        return (
            col.astype(str)
               .str.replace(r"[,\s]", "", regex=True)
               .str.replace(r"[^\d\.\-]", "", regex=True)
               .pipe(pd.to_numeric, errors="coerce")
        )
    df["budget"] = to_numeric(df["budget"])
    df = df.dropna(subset=["budget"])
    df["year"] = year
    
    out_path = DATA_PROCESSED / f"budget_clean_{year}.csv"
    df.to_csv(out_path, index=False)
    logger.info(f"Rows cleaned and saved to {out_path} ({len(df)} rows)")
    match_stats["total_rows"] = len(df)
    return df

# ── STEP 4-6: Intelligent Sector Mapping ──────────────────────────────────
from sentence_transformers import util

def map_ministry(ministry_name: str) -> str:
    name_lower = ministry_name.lower()
    
    # STEP 4: Semantic match
    min_emb = mapping_model.encode(ministry_name, convert_to_tensor=True)
    cosine_scores = util.cos_sim(min_emb, sector_embeddings)[0]
    best_score_idx = cosine_scores.argmax().item()
    best_score = cosine_scores[best_score_idx].item()
    
    if best_score >= 0.55:
        match_stats["semantic"] += 1
        sector = sectors[best_score_idx]
        match_stats["mapped_sectors"].add(sector)
        return sector
        
    # STEP 5: Keyword match fallback
    for sector, keywords in sector_keywords.items():
        if any(kw in name_lower for kw in keywords):
            match_stats["keyword"] += 1
            match_stats["mapped_sectors"].add(sector)
            return sector
            
    # STEP 6: Fuzzy match fallback
    # Flatten the keyword list to search against
    flat_keywords = []
    kw_to_sector = {}
    for sec, kws in sector_keywords.items():
        for kw in kws:
            flat_keywords.append(kw)
            kw_to_sector[kw] = sec
            
    best_match = process.extractOne(name_lower, flat_keywords)
    if best_match and best_match[1] >= 75:
        match_stats["fuzzy"] += 1
        sector = kw_to_sector[best_match[0]]
        match_stats["mapped_sectors"].add(sector)
        return sector
        
    # If all fail, return None
    return None

def assign_sectors(df: pd.DataFrame) -> pd.DataFrame:
    logger.info("Starting intelligent sector mapping...")
    
    match_stats["semantic"] = 0
    match_stats["keyword"] = 0
    match_stats["fuzzy"] = 0
    match_stats["mapped_sectors"] = set()
    
    df["sector"] = df["ministry"].apply(map_ministry)
    
    unmapped = df["sector"].isna().sum()
    if unmapped > 0:
        logger.warning(f"{unmapped} ministries could not be mapped to any sector.")
        
    df = df.dropna(subset=["sector"])
    return df

# ── STEP 7: Sector Aggregation ─────────────────────────────────────────────
def aggregate_sectors(df: pd.DataFrame) -> pd.DataFrame:
    logger.info("Aggregating grouped sector budgets...")
    agg = df.groupby(["sector", "year"], as_index=False)["budget"].sum()
    out_path = DATA_PROCESSED / "sector_budget.csv"
    agg.to_csv(out_path, index=False)
    logger.info(f"Sector aggregation complete. Saved to {out_path}")
    return agg

# ── STEP 8: Database Insertion ─────────────────────────────────────────────
def store_in_db(df: pd.DataFrame) -> None:
    logger.info("Inserting aggregated budgets into database...")
    db: Session = SessionLocal()
    try:
        inserted = 0
        skipped = 0
        
        for _, row in df.iterrows():
            year = int(row["year"])
            sector_nm = str(row["sector"]).strip()
            budget_cr = float(row["budget"])
            
            # ── Get or create Sector
            sector = db.query(Sector).filter_by(name=sector_nm).first()
            if not sector:
                sector = Sector(name=sector_nm)
                db.add(sector)
                db.flush()
                
            # ── Resolve ElectionCycle
            if year <= 2014:
                cycle_name, sy, ey = "2009-2014", 2009, 2014
            elif year <= 2019:
                cycle_name, sy, ey = "2014-2019", 2014, 2019
            elif year <= 2024:
                cycle_name, sy, ey = "2019-2024", 2019, 2024
            else:
                cycle_name, sy, ey = "2024-2029", 2024, 2029

            cycle = db.query(ElectionCycle).filter_by(name=cycle_name).first()
            if not cycle:
                cycle = ElectionCycle(name=cycle_name, start_year=sy, end_year=ey)
                db.add(cycle)
                db.flush()
                
            # ── Check for duplicate (year + sector)
            exists = (
                db.query(BudgetAllocation)
                  .filter_by(year=year, sector_id=sector.id)
                  .first()
            )
            if exists:
                skipped += 1
                continue
                
            alloc = BudgetAllocation(
                year=year,
                amount_crores=budget_cr,
                sector_id=sector.id,
                election_cycle_id=cycle.id,
            )
            db.add(alloc)
            inserted += 1
            
        db.commit()
        logger.info(f"Database insert complete: {inserted} inserted, {skipped} skipped.")
    except Exception as e:
        db.rollback()
        logger.error(f"Database insertion failed: {e}")
        raise
    finally:
        db.close()

# ── Main Orchestrator ──────────────────────────────────────────────────────
def run_pipeline(year: int):
    logger.info("═" * 60)
    logger.info(f"Budget Excel Pipeline Start — year={year}")
    logger.info("═" * 60)
    
    file_path_year = DATA_RAW / f"sumsbe_{year}.xlsx"
    file_path_default = DATA_RAW / "sumsbe.xlsx"
    
    if file_path_year.exists():
        file_path = file_path_year
    elif file_path_default.exists():
        file_path = file_path_default
    else:
        logger.error(f"Input file not found. Checked {file_path_year} and {file_path_default}")
        return
        
    df_clean = load_and_clean_data(file_path, year)
    df_mapped = assign_sectors(df_clean)
    df_agg = aggregate_sectors(df_mapped)
    store_in_db(df_agg)
    
    # ── STEP 9: Detailed expected console output
    print(f"\nLoaded ministries: {match_stats['total_rows']}")
    print(f"Semantic matches: {match_stats['semantic']}")
    print(f"Keyword matches: {match_stats['keyword']}")
    print(f"Fuzzy matches: {match_stats['fuzzy']}")
    print(f"Mapped sectors: {len(match_stats['mapped_sectors'])}")
    print(f"Aggregated sector budgets: {len(df_agg)}")
    print("Inserted rows into database\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Union Budget Excel Pipeline")
    parser.add_argument("--year", type=int, default=2024, help="Budget year (e.g. 2024)")
    args = parser.parse_args()
    
    run_pipeline(args.year)
