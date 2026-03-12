from database.postgres_connection import get_connection

def check_schema():
    conn = get_connection()
    cursor = conn.cursor()
    
    tables = ["bills", "news", "manifestos", "policies", "gov_datasets"]
    
    for table in tables:
        print(f"\nSchema for {table}:")
        try:
            cursor.execute(f"SELECT column_name, data_type FROM information_schema.columns WHERE table_name = '{table}'")
            columns = cursor.fetchall()
            if not columns:
                print(" Table does not exist or has no columns.")
            for col in columns:
                print(f" - {col[0]} ({col[1]})")
        except Exception as e:
            print(f" Error: {e}")
            
    cursor.close()
    conn.close()

if __name__ == "__main__":
    check_schema()
