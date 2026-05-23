import logging
from pathlib import Path

from sqlmodel import SQLModel, create_engine, text

from .core.config import APP_CONFIG

logger = logging.getLogger("db")

DB_PATH = Path(APP_CONFIG.data_dir) / "app.db"
engine = create_engine(f"sqlite:///{DB_PATH}", echo=False)


def _migrate() -> None:
    """Add columns that may not exist in older databases."""
    migrations = [
        ("conversation", "persona", "TEXT DEFAULT 'assistant'"),
        ("appsetting", "persona", "TEXT DEFAULT 'assistant'"),
        ("conversation", "creativity_level", "INTEGER DEFAULT 3"),
        ("appsetting", "creativity_level", "INTEGER DEFAULT 3"),
    ]
    with engine.connect() as conn:
        for table, column, col_type in migrations:
            try:
                conn.execute(text(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}"))
                conn.commit()
                logger.info(f"Migration: added {table}.{column}")
            except Exception:
                pass  # column already exists


def init_db() -> None:
    SQLModel.metadata.create_all(engine)
    _migrate()
