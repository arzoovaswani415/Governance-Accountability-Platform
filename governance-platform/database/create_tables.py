from postgres_connection import get_connection

conn = get_connection()
cursor = conn.cursor()

cursor.execute("""
CREATE TABLE IF NOT EXISTS manifestos(
id SERIAL PRIMARY KEY,
party_name TEXT,
election_year INT,
promise TEXT,
category TEXT,
source_url TEXT
);
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS bills(
id SERIAL PRIMARY KEY,
bill_name TEXT,
ministry TEXT,
status TEXT,
introduced_date DATE,
source_url TEXT
);
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS policies(
id SERIAL PRIMARY KEY,
policy_title TEXT,
ministry TEXT,
description TEXT,
source_url TEXT
);
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS gov_datasets(
id SERIAL PRIMARY KEY,
dataset_name TEXT,
department TEXT,
dataset_url TEXT,
tags TEXT[]
);
""")

cursor.execute("""
CREATE TABLE IF NOT EXISTS news(
id SERIAL PRIMARY KEY,
headline TEXT,
source TEXT,
description TEXT,
article_url TEXT,
published_at TIMESTAMP
);
""")

conn.commit()
cursor.close()
conn.close()

print("Tables created")