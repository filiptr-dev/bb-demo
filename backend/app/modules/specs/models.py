from datetime import datetime
from typing import Any

from sqlalchemy import Boolean, DateTime, Double, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class Spec(Base):
    """SKF technical data for one product, filled by `python -m app.cli specs-scrape` from SKF's product data."""

    __tablename__ = "specs"

    slug: Mapped[str] = mapped_column(Text, ForeignKey("products.slug", ondelete="CASCADE"), primary_key=True)
    # False: SKF has no data for this designation. Kept, so the next scrape skips it instead of asking again.
    found: Mapped[bool] = mapped_column(Boolean)
    c: Mapped[float | None] = mapped_column(Double)  # basic dynamic load rating C, kN
    c0: Mapped[float | None] = mapped_column(Double)  # basic static load rating C0, kN
    pu: Mapped[float | None] = mapped_column(Double)  # fatigue load limit Pu, kN
    reference_speed: Mapped[float | None] = mapped_column(Double)  # r/min
    limiting_speed: Mapped[float | None] = mapped_column(Double)  # r/min
    mass: Mapped[float | None] = mapped_column(Double)  # product net weight, kg
    performance_class: Mapped[str | None] = mapped_column(Text)  # e.g. "SKF Explorer"
    # Calculation factors by symbol: kr (minimum load), f0, e, Y, Y0, Y1, Y2, A ... (which ones depends on the type)
    factors: Mapped[dict[str, float]] = mapped_column(JSONB, server_default="{}")
    # The whole SKF data sheet: [{title, rows: [{name, symbol, value, min, max, unit, qualifier}]}]
    datasheet: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, server_default="[]")
    source_url: Mapped[str | None] = mapped_column(Text)  # the product page on skf.com
    fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
