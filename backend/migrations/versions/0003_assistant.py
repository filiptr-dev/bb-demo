"""Assistant: conversations, messages, feedback, and the rate limiter's windows (core/ratelimit.py).

Conversations hold no user or IP data; rate limit keys are hashed client IPs.

Revision ID: 0003
Revises: 0002
Create Date: 2026-09-29
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql

revision: str = "0003"
down_revision: str | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "assistant_conversations",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("locale", sa.String(length=8), nullable=False),
        sa.Column("pending_flow", sa.String(length=40), nullable=True),
        sa.Column("flow_state", postgresql.JSONB(astext_type=sa.Text()), server_default="{}", nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id", name=op.f("assistant_conversations_pkey")),
    )
    op.create_table(
        "rate_limits",
        sa.Column("key", sa.String(), nullable=False),
        sa.Column("window_start", sa.DateTime(timezone=True), nullable=False),
        sa.Column("hits", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint("key", "window_start", name=op.f("rate_limits_pkey")),
    )
    op.create_table(
        "assistant_messages",
        sa.Column("id", sa.UUID(), nullable=False),
        sa.Column("conversation_id", sa.UUID(), nullable=False),
        sa.Column("role", sa.String(length=10), nullable=False),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("events", postgresql.JSONB(astext_type=sa.Text()), server_default="[]", nullable=False),
        sa.Column("preset", sa.String(length=40), nullable=True),
        sa.Column("flow", sa.String(length=40), nullable=True),
        sa.Column("model", sa.String(length=80), nullable=True),
        sa.Column("tool_calls", sa.Integer(), server_default="0", nullable=False),
        sa.Column("duration_ms", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("role in ('user', 'assistant')", name=op.f("assistant_messages_role_check")),
        sa.ForeignKeyConstraint(
            ["conversation_id"],
            ["assistant_conversations.id"],
            name=op.f("assistant_messages_conversation_id_fkey"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("id", name=op.f("assistant_messages_pkey")),
    )
    op.create_index(op.f("assistant_messages_conversation_id"), "assistant_messages", ["conversation_id"], unique=False)
    op.create_table(
        "assistant_feedback",
        sa.Column("message_id", sa.UUID(), nullable=False),
        sa.Column("rating", sa.String(length=4), nullable=False),
        sa.Column("reason", sa.String(length=40), nullable=True),
        sa.Column("comment", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.CheckConstraint("rating in ('up', 'down')", name=op.f("assistant_feedback_rating_check")),
        sa.ForeignKeyConstraint(
            ["message_id"],
            ["assistant_messages.id"],
            name=op.f("assistant_feedback_message_id_fkey"),
            ondelete="CASCADE",
        ),
        sa.PrimaryKeyConstraint("message_id", name=op.f("assistant_feedback_pkey")),
    )


def downgrade() -> None:
    op.drop_table("assistant_feedback")
    op.drop_index(op.f("assistant_messages_conversation_id"), table_name="assistant_messages")
    op.drop_table("assistant_messages")
    op.drop_table("rate_limits")
    op.drop_table("assistant_conversations")
