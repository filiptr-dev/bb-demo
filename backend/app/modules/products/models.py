from datetime import datetime

from sqlalchemy import Computed, DateTime, Double, Index, Text, func, text
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class Product(Base):
    """One catalog row. Filled by the importer (frontend/scripts/import-products.mts until phase 7)."""

    __tablename__ = "products"
    __table_args__ = (
        Index(
            "products_search_key_trgm",
            "search_key",
            postgresql_using="gin",
            postgresql_ops={"search_key": "gin_trgm_ops"},
        ),
        Index("products_type", "type"),
        Index("products_d", "d"),
        Index("products_industries", "industries", postgresql_using="gin"),
    )

    slug: Mapped[str] = mapped_column(Text, primary_key=True)
    designation: Mapped[str] = mapped_column(Text)
    brand: Mapped[str] = mapped_column(Text, server_default="SKF")
    type: Mapped[str] = mapped_column(Text)  # app type slug (frontend lib/domain/taxonomy.ts bearingTypes)
    classification: Mapped[str | None] = mapped_column(Text)  # original SKF classification, e.g. "Radial deep groove"
    bore_type: Mapped[str | None] = mapped_column(Text)  # cylindrical | tapered
    seal: Mapped[str | None] = mapped_column(Text)  # open | shields | both | one-side | other
    sealing: Mapped[str | None] = mapped_column(Text)  # original SKF sealing text
    d: Mapped[float | None] = mapped_column(Double)  # bore diameter, mm
    outer_d: Mapped[float | None] = mapped_column(Double)  # outside diameter (D), mm
    width: Mapped[float | None] = mapped_column(Double)  # width (B), mm
    industries: Mapped[list[str]] = mapped_column(ARRAY(Text), server_default=text("'{}'"))
    source: Mapped[str] = mapped_column(Text)  # bbunikoop | bearingworld | both
    # Designation without punctuation, upper-cased: what search matches against ("6205-2RSH" → "62052RSH").
    search_key: Mapped[str | None] = mapped_column(
        Text, Computed("upper(regexp_replace(designation, '[^A-Za-z0-9]', '', 'g'))", persisted=True)
    )
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
