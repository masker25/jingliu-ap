"""Application settings.

Everything that varies by environment (db location, CORS, and the model-router
defaults) lives here so the rest of the code stays free of magic values.
"""

from __future__ import annotations

from pathlib import Path

from pydantic import BaseModel
from pydantic_settings import BaseSettings, SettingsConfigDict

# repo-root/clear-teller/backend/src/clear_teller/config.py -> clear-teller/
PROJECT_ROOT = Path(__file__).resolve().parents[3]
DATA_DIR = PROJECT_ROOT / "data"


class ModelRoute(BaseModel):
    """Which provider/model handles one pipeline step. All swappable via env."""

    provider: str
    model: str


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_prefix="CT_", env_file=".env", extra="ignore")

    app_name: str = "clear teller"
    debug: bool = True

    # SQLite lives as a single file under data/. Swap to a Postgres URL later
    # without touching call sites.
    database_url: str = f"sqlite:///{DATA_DIR / 'clearteller.db'}"

    # Vite dev server origins allowed to call the API.
    cors_origins: list[str] = ["http://localhost:5173", "http://127.0.0.1:5173"]

    # Dev convenience: create tables on startup. Alembic remains the source of
    # truth for real migrations.
    auto_create_tables: bool = True

    # --- model router defaults (the abstraction seam; real calls land in P1) ---
    # Heavy reasoning stays on Claude by default for quality; high-frequency
    # light steps default cheaper; every entry is overridable.
    model_routes: dict[str, ModelRoute] = {
        "classify": ModelRoute(provider="anthropic", model="claude-opus-4-8"),
        "conflict": ModelRoute(provider="anthropic", model="claude-opus-4-8"),
        "vision": ModelRoute(provider="anthropic", model="claude-opus-4-8"),
        "extract": ModelRoute(provider="anthropic", model="claude-haiku-4-5"),
        "dedupe": ModelRoute(provider="anthropic", model="claude-haiku-4-5"),
        "assemble": ModelRoute(provider="anthropic", model="claude-sonnet-4-6"),
    }

    # Embeddings default to a local model (zero external dependency); switch to
    # Voyage for the quality upgrade.
    embedding_provider: str = "fastembed"
    embedding_model: str = "BAAI/bge-small-en-v1.5"


settings = Settings()
