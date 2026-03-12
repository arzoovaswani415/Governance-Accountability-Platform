import os
import psycopg2
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

db_url = os.getenv("DATABASE_URL")
if not db_url:
    print("DATABASE_URL not found.")
    exit(1)

try:
    print(f"Connecting to {db_url}...")
    conn = psycopg2.connect(db_url)
    conn.autocommit = True
    cur = conn.cursor()
    
    print("Terminating dangling connections...")
    cur.execute("""
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE pid <> pg_backend_pid()
          AND datname = current_database()
          AND state = 'idle in transaction';
    """)
    print("Dangling connections terminated.")
    
    try:
        print("Executing ALTER TABLE to add policy_level...")
        cur.execute("ALTER TABLE policies ADD COLUMN policy_level VARCHAR NOT NULL DEFAULT 'union';")
        print("Success: policy_level added.")
    except psycopg2.errors.DuplicateColumn:
        print("policy_level already exists.")
        conn.commit()
    
    try:
        print("Executing ALTER TABLE to add state_name...")
        cur.execute("ALTER TABLE policies ADD COLUMN state_name VARCHAR;")
        print("Success: state_name added.")
    except psycopg2.errors.DuplicateColumn:
        print("state_name already exists.")
        conn.commit()
    
    cur.close()
    conn.close()
    print("Migration complete!")
except Exception as e:
    print(f"Error: {e}")

