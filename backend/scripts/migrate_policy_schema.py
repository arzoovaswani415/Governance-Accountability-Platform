import sys
from pathlib import Path
from sqlalchemy import text

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database import engine

def migrate():
    with engine.connect() as conn:
        try:
            print("Adding policy_level column...")
            conn.execute(text("ALTER TABLE policies ADD COLUMN policy_level VARCHAR NOT NULL DEFAULT 'union';"))
            conn.commit()
            print("Successfully added policy_level.")
        except Exception as e:
            print(f"Skipping policy_level addition: {e}")
            conn.rollback()

        try:
            print("Adding state_name column...")
            conn.execute(text("ALTER TABLE policies ADD COLUMN state_name VARCHAR;"))
            conn.commit()
            print("Successfully added state_name.")
        except Exception as e:
            print(f"Skipping state_name addition: {e}")
            conn.rollback()

if __name__ == "__main__":
    migrate()
