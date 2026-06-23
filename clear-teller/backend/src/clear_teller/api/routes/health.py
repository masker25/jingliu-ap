"""Health endpoints: liveness + DB connectivity."""

from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import text
from sqlmodel import Session

from clear_teller import __version__
from clear_teller.config import settings
from clear_teller.db.session import get_session

router = APIRouter(tags=["health"])


@router.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "app": settings.app_name, "version": __version__}


@router.get("/health/db")
def health_db(session: Session = Depends(get_session)) -> dict[str, str]:
    session.exec(text("SELECT 1"))
    backend = "sqlite" if settings.database_url.startswith("sqlite") else "other"
    return {"status": "ok", "db": backend}
