"""
One-time migration script to add new columns to existing tables.
Run once after deploying the updated models:

    cd backend
    python migrate.py

Safe to run multiple times (columns are added only if missing).
"""
import os
from dotenv import load_dotenv
load_dotenv()

from sqlalchemy import create_engine, text

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./architecture_journal.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

engine = create_engine(DATABASE_URL)

MIGRATIONS = [
    # Fragment: new columns (nullable — safe on existing rows)
    "ALTER TABLE fragments ADD COLUMN title VARCHAR(200)",
    "ALTER TABLE fragments ADD COLUMN subtitle VARCHAR(300)",
    "ALTER TABLE fragments ADD COLUMN cover_image VARCHAR(500)",

    # New tables — handled by create_all, but listed here for reference
    # writing_images and fragment_images are created by models.py create_all
]

def column_exists(conn, table: str, column: str) -> bool:
    """Works for both SQLite and PostgreSQL."""
    if DATABASE_URL.startswith("sqlite"):
        result = conn.execute(text(f"PRAGMA table_info({table})"))
        return any(row[1] == column for row in result)
    else:
        result = conn.execute(text(
            "SELECT column_name FROM information_schema.columns "
            f"WHERE table_name='{table}' AND column_name='{column}'"
        ))
        return result.fetchone() is not None

def run():
    # Run create_all first to pick up/initialize all tables
    from database import Base, engine as db_engine
    from models import WritingImage, FragmentImage  # noqa: ensure models are imported
    Base.metadata.create_all(bind=db_engine)
    print("  New tables created/verified.")

    with engine.connect() as conn:
        for stmt in MIGRATIONS:
            # Parse table and column from the ALTER TABLE statement
            parts = stmt.split()
            table = parts[2]
            column = parts[5]
            if not column_exists(conn, table, column):
                print(f"  Adding column: {table}.{column}")
                conn.execute(text(stmt))
                conn.commit()
            else:
                print(f"  Skipping (exists): {table}.{column}")

    print("Migration complete.")

if __name__ == "__main__":
    run()
