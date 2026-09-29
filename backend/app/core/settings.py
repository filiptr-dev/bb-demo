from functools import lru_cache
from typing import Annotated, Literal

from pydantic import Field, SecretStr, field_validator
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
    # Optional regex for origins that can't be listed, e.g. Vercel preview deployments:
    # https://bb-demo-[a-z0-9-]+\.vercel\.app
    cors_allowed_origin_regex: str | None = None

    # After a data change (importer, specs scrape) the API asks the site to refresh its cached pages:
    # POST {tags} to the frontend's /api/revalidate. Both unset = skipped (local development, tests).
    frontend_revalidate_url: str | None = None  # https://<vercel domain>/api/revalidate
    revalidate_secret: str | None = None  # the same value as the frontend's REVALIDATE_SECRET

    # Assistant (Gemini). Without a key the scripted flows still work and free-text questions get an error event.
    gemini_api_key: SecretStr | None = None
    gemini_model: str = "gemini-3.5-flash-lite"
    # Tried when the first model is overloaded (429/503) or silent for gemini_first_token_timeout seconds.
    gemini_fallback_model: str | None = "gemini-3.8-flash"
    gemini_first_token_timeout: float = Field(default=15.0, gt=0)
    gemini_thinking_level: Literal["minimal", "low", "medium", "high"] | None = "low"
    # Chat messages per client IP per window, and model-answered turns per day for everyone (protects the quota).
    assistant_rate_limit: int = Field(default=10, ge=1)
    assistant_rate_window: int = Field(default=600, ge=1, description="seconds")
    assistant_daily_limit: int = Field(default=500, ge=1)

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
