from functools import lru_cache
from typing import Annotated, Literal

from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, NoDecode, SettingsConfigDict


def psycopg_url(url: str) -> str:
    """Hosts hand out postgres:// or postgresql:// URLs; SQLAlchemy needs the driver named (psycopg)."""
    for prefix in ("postgres://", "postgresql://"):
        if url.startswith(prefix):
            return "postgresql+psycopg://" + url.removeprefix(prefix)
    return url


class Settings(BaseSettings):
    """Every environment variable the API reads. Validated once at startup, so a bad deploy fails fast."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore", frozen=True)

    app_env: Literal["development", "test", "production"] = "development"
    log_level: Literal["debug", "info", "warning", "error"] = "info"

    # Any Postgres URL (postgres://, postgresql://, postgresql+psycopg://). Supabase: the session pooler, port 5432.
    database_url: str
    db_pool_size: int = Field(default=5, ge=1, le=20)
    # Seconds a health check waits for the database before reporting it as down.
    db_health_timeout: float = Field(default=5.0, gt=0)

    # Comma-separated list of origins allowed to call the API from a browser.
    cors_allowed_origins: Annotated[list[str], NoDecode] = Field(default_factory=lambda: ["http://localhost:3000"])

    @field_validator("database_url")
    @classmethod
    def _use_psycopg(cls, url: str) -> str:
        return psycopg_url(url)

    @field_validator("cors_allowed_origins", mode="before")
    @classmethod
    def _split_origins(cls, value: object) -> object:
        if isinstance(value, str):
            return [o.strip().rstrip("/") for o in value.split(",") if o.strip()]
        return value


@lru_cache
def get_settings() -> Settings:
    return Settings()  # required fields come from the environment
