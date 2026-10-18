#!/usr/bin/env python3
"""
Apply the env_readings migration and upload the CSV dataset to Supabase.

Usage (from the backend folder):
    python scripts/migrate_and_seed.py            # migrate + seed an empty table
    python scripts/migrate_and_seed.py --replace  # delete existing readings first

Needs DATABASE_URL in backend/.env (Supabase → Project Settings → Database).
"""
import argparse
import sys
from pathlib import Path

import pandas as pd
import psycopg2
from psycopg2.extras import execute_values

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.config import settings
from app.db.readings import COLUMN_MAP, LOCAL_TZ
from app.services import DATA_PATH

MIGRATION = Path(__file__).parent.parent.parent / "scripts" / "migrations" / "001_full_readings.sql"


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--replace", action="store_true", help="delete existing env_readings rows before seeding")
    args = parser.parse_args()

    df = pd.read_csv(DATA_PATH, index_col=0)
    print(f"📂 Loaded {len(df)} rows from {DATA_PATH.name}")

    conn = psycopg2.connect(settings.DATABASE_URL, connect_timeout=15)
    try:
        with conn, conn.cursor() as cur:
            print(f"🛠  Applying {MIGRATION.name}")
            cur.execute(MIGRATION.read_text())

            cur.execute("SELECT l.name, c.name, l.id FROM locations l JOIN cities c ON c.id = l.city_id")
            location_ids = {(loc, city): lid for loc, city, lid in cur.fetchall()}
            missing = set(zip(df["location"], df["city"])) - set(location_ids)
            if missing:
                raise SystemExit(f"❌ Locations missing from the database: {sorted(missing)}. Run supabase_schema.sql first.")

            cur.execute("SELECT count(*) FROM env_readings")
            existing = cur.fetchone()[0]
            if existing and not args.replace:
                print(f"ℹ️  env_readings already has {existing} rows; nothing uploaded. Use --replace to reload.")
                return
            if existing:
                print(f"🗑  Deleting {existing} existing readings")
                cur.execute("DELETE FROM env_readings")

            db_cols = list(COLUMN_MAP.values())
            records = df[list(COLUMN_MAP)].copy()
            records["timestamp"] = pd.to_datetime(records["timestamp"]).dt.tz_localize(LOCAL_TZ)
            records = records.astype(object).where(records.notna(), None)
            location_col = [location_ids[(l, c)] for l, c in zip(df["location"], df["city"])]
            values = [(lid, *row) for lid, row in zip(location_col, records.itertuples(index=False, name=None))]

            print(f"⬆️  Uploading {len(values)} readings")
            execute_values(
                cur,
                f"INSERT INTO env_readings (location_id, {', '.join(db_cols)}) VALUES %s",
                values,
                page_size=1000,
            )
            cur.execute("SELECT count(*) FROM env_readings")
            print(f"✅ env_readings now has {cur.fetchone()[0]} rows")
    finally:
        conn.close()

    print("\nSet DATA_SOURCE=supabase in backend/.env to serve data from the database.")


if __name__ == "__main__":
    main()
