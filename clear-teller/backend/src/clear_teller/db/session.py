"""Database engine and session management.

SQLite is configured for the workload we actually have: lots of reads plus a
sequential, append-only audit stream. WAL mode lets readers run while a single
writer appends; ``_write_lock`` serialises writers so SQLite's single-writer
constraint never surfaces as a "database is locked" error. Both concerns are
localised here, so swapping to Postgres later means editing only this module.
"""

from __future__ import annotations

import threading
from collections.abc import Iterator
from contextlib import contextmanager

from sqlalchemy import event
from sqlalchemy.engine import Engine
from sqlmodel import Session, SQLModel, create_engine

from clear_teller.config import DATA_DIR, settings

_is_sqlite = settings.database_url.startswith("sqlite")

engine = create_engine(
    settings.database_url,
    echo=settings.debug and False,
    connect_args={"check_same_thread": False} if _is_sqlite else {},
)

# Serialises writes for SQLite's single-writer model.
_write_lock = threading.Lock()


@event.listens_for(Engine, "connect")
def _set_sqlite_pragmas(dbapi_conn, _record):  # noqa: ANN001
    """Enable WAL + foreign keys on every SQLite connection."""
    if not _is_sqlite:
        return
    cur = dbapi_conn.cursor()
    cur.execute("PRAGMA journal_mode=WAL")
    cur.execute("PRAGMA foreign_keys=ON")
    cur.execute("PRAGMA busy_timeout=5000")
    cur.close()


def init_db() -> None:
    """Ensure the data dir exists and (dev only) create tables."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    if settings.auto_create_tables:
        # import models so they register on SQLModel.metadata
        from clear_teller.db import models  # noqa: F401

        SQLModel.metadata.create_all(engine)


def get_session() -> Iterator[Session]:
    """FastAPI dependency for a read/write session."""
    with Session(engine) as session:
        yield session


@contextmanager
def write_session() -> Iterator[Session]:
    """Serialised session for writes. Use for any mutating work."""
    with _write_lock, Session(engine) as session:
        yield session
        session.commit()
