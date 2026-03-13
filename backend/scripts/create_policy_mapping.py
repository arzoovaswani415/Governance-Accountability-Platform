import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import engine, Base
from app.models.policy import PolicyMapping

print("Explicitly creating policy_mapping table...")
PolicyMapping.__table__.create(bind=engine, checkfirst=True)
print("Table created.")
