"""Specs: SKF technical data per product (load ratings, speeds, mass, calculation factors, the full data sheet).

Filled by `python -m app.cli specs-scrape`. A product deleted by the importer takes its specs with it.

Revision ID: 0002
Revises: 0001
Create Date: 2026-09-29
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "specs",
        sa.Column("slug", sa.Text(), nullable=False),
        sa.Column("found", sa.Boolean(), nullable=False),  # false: SKF has no data for this designation
        sa.Column("c", sa.Double()),  # basic dynamic load rating, kN
        sa.Column("c0", sa.Double()),  # basic static load rating, kN
        sa.Column("pu", sa.Double()),  # fatigue load limit, kN
        sa.Column("reference_speed", sa.Double()),  # r/min
        sa.Column("limiting_speed", sa.Double()),  # r/min
        sa.Column("mass", sa.Double()),  # kg
        sa.Column("performance_class", sa.Text()),
        sa.Column("factors", postgresql.JSONB(astext_type=sa.Text()), server_default="{}", nullable=False),
        sa.Column("datasheet", postgresql.JSONB(astext_type=sa.Text()), server_default="[]", nullable=False),
        sa.Column("source_url", sa.Text()),
        sa.Column("fetched_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["slug"], ["products.slug"], name=op.f("specs_slug_fkey"), ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("slug", name=op.f("specs_pkey")),
    )


def downgrade() -> None:
    op.drop_table("specs")
