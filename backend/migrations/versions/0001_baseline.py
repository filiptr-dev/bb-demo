"""Baseline: the products catalog, as first created by frontend/scripts/schema.sql (removed since; see git history).

The Supabase database already has all of this, so it is stamped (`alembic stamp 0001`) instead of upgraded.
Supabase-only parts of that file are deliberately left out: they stay on the Supabase database and have no meaning
on a plain Postgres. For the record, Supabase also has row level security on `products` with a
`"public read"` select policy, and the anon/authenticated roles are read-only.

Revision ID: 0001
Revises:
Create Date: 2026-09-29
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    # Trigram index for "contains" search on designations.
    op.execute("create extension if not exists pg_trgm")
    # Numeric-aware ordering, so "6205" < "6210" < "62010" (used as `order by designation collate natural_sort`).
    op.execute("create collation if not exists natural_sort (provider = icu, locale = 'en-u-kn-true')")

    op.create_table(
        "products",
        sa.Column("slug", sa.Text(), primary_key=True),
        sa.Column("designation", sa.Text(), nullable=False),
        sa.Column("brand", sa.Text(), nullable=False, server_default="SKF"),
        sa.Column("type", sa.Text(), nullable=False),  # app type slug (frontend lib/data.ts)
        sa.Column("classification", sa.Text()),  # original SKF classification, e.g. "Radial deep groove"
        sa.Column("bore_type", sa.Text()),  # cylindrical | tapered
        sa.Column("seal", sa.Text()),  # app seal code
        sa.Column("sealing", sa.Text()),  # original SKF sealing text
        sa.Column("d", sa.Double()),  # bore diameter, mm
        sa.Column("outer_d", sa.Double()),  # outside diameter, mm
        sa.Column("width", sa.Double()),  # width, mm
        sa.Column("industries", postgresql.ARRAY(sa.Text()), nullable=False, server_default=sa.text("'{}'")),
        sa.Column("source", sa.Text(), nullable=False),  # bbunikoop | bearingworld | both
        # Designation without punctuation, upper-cased: what search matches against ("6205-2RSH" → "62052RSH").
        sa.Column(
            "search_key",
            sa.Text(),
            sa.Computed("upper(regexp_replace(designation, '[^A-Za-z0-9]', '', 'g'))", persisted=True),
        ),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
    )
    op.create_index(
        "products_search_key_trgm",
        "products",
        ["search_key"],
        postgresql_using="gin",
        postgresql_ops={"search_key": "gin_trgm_ops"},
    )
    op.create_index("products_type", "products", ["type"])
    op.create_index("products_d", "products", ["d"])
    op.create_index("products_industries", "products", ["industries"], postgresql_using="gin")


def downgrade() -> None:
    op.drop_table("products")  # drops its indexes too
    op.execute("drop collation if exists natural_sort")
    op.execute("drop extension if exists pg_trgm")
