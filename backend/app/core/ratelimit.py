"""Fixed-window rate limiter in Postgres, so limits hold across restarts and instances (Redis later).

One row per (key, window): `hit` adds 1 and returns the count in one upsert. Old windows are deleted now and then.
"""

import hashlib
import random
from dataclasses import dataclass
from datetime import datetime

from sqlalchemy import DateTime, Integer, String, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base

CLEANUP_CHANCE = 0.01  # share of hits that also delete windows older than a day


class RateLimitWindow(Base):
    __tablename__ = "rate_limits"

    key: Mapped[str] = mapped_column(String, primary_key=True)
    window_start: Mapped[datetime] = mapped_column(DateTime(timezone=True), primary_key=True)
    hits: Mapped[int] = mapped_column(Integer)


@dataclass(frozen=True)
class Hit:
    count: int
    limit: int
    retry_after: int  # seconds until the window ends

    @property
    def allowed(self) -> bool:
        return self.count <= self.limit


def client_key(prefix: str, ip: str | None) -> str:
    """A limiter key for a client IP, hashed so the table holds no addresses."""
    digest = hashlib.sha256((ip or "unknown").encode()).hexdigest()[:24]
    return f"{prefix}:{digest}"


class RateLimiter:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def hit(self, key: str, limit: int, window_seconds: int) -> Hit:
        row = (
            await self.session.execute(
                text(
                    "insert into rate_limits (key, window_start, hits)"
                    " values (:key, to_timestamp(floor(extract(epoch from now()) / :w) * :w), 1)"
                    " on conflict (key, window_start) do update set hits = rate_limits.hits + 1"
                    " returning hits, ceil(extract(epoch from window_start) + :w - extract(epoch from now()))::int"
                ),
                {"key": key, "w": window_seconds},
            )
        ).one()
        if random.random() < CLEANUP_CHANCE:  # noqa: S311 - not security related
            await self.session.execute(text("delete from rate_limits where window_start < now() - interval '1 day'"))
        await self.session.commit()
        return Hit(count=row[0], limit=limit, retry_after=max(1, row[1]))
