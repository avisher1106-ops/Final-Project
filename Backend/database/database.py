"""
Database engine, session factory, declarative base, and request dependency.
"""

from __future__ import annotations

import logging
from collections.abc import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, declarative_base, sessionmaker

from config import settings

logger = logging.getLogger(__name__)

# pool_pre_ping avoids "server has gone away" errors on long idle periods.
# pool_recycle keeps connections younger than MySQL's default wait_timeout.
engine = create_engine(
    settings.database_url,
    pool_pre_ping=True,
    pool_recycle=3600,
    future=True,
)

# Echo is intentionally MySQL-only. This guard prevents an accidental switch
# to SQLite or another lightweight database through a misconfigured URL.
if engine.dialect.name != "mysql" or engine.dialect.driver != "pymysql":
    raise RuntimeError("Echo requires a real MySQL database via PyMySQL.")

# expire_on_commit=False lets us read committed ORM objects without an extra
# SELECT; endpoints still refresh objects when they need database-generated
# values such as ids and timestamps.
SessionLocal = sessionmaker(
    bind=engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)

# Base class inherited by every SQLAlchemy model.
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    FastAPI dependency that creates one database session per request.

    The session is always closed, even when the request raises an exception.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables() -> None:
    """
    Create all tables that do not exist yet.

    Importing models registers their metadata on Base before create_all runs.
    The project also includes database/schema.sql for a manual setup.
    """
    # Imported here to avoid a circular import (models imports Base).
    from .models import Conversation, Message  # noqa: F401

    logger.info(
        "Connecting to MySQL at %s:%s/%s.",
        settings.db_host,
        settings.db_port,
        settings.db_name,
    )
    Base.metadata.create_all(bind=engine)
    logger.info("MySQL tables are ready.")
