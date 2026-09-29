import uuid
from datetime import datetime
from typing import Any

from sqlalchemy import CheckConstraint, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base


class Conversation(Base):
    """One chat thread. No user account and no IP: the browser keeps the id."""

    __tablename__ = "assistant_conversations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    locale: Mapped[str] = mapped_column(String(8))
    # A scripted flow waiting for the user's next message (it asked for a designation, ...), and its state.
    pending_flow: Mapped[str | None] = mapped_column(String(40))
    flow_state: Mapped[dict[str, Any]] = mapped_column(JSONB, server_default="{}")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Message(Base):
    __tablename__ = "assistant_messages"
    __table_args__ = (CheckConstraint("role in ('user', 'assistant')", name="role"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("assistant_conversations.id", ondelete="CASCADE"), index=True
    )
    role: Mapped[str] = mapped_column(String(10))
    # What the model sees as history: the user's text, or the answer as text (a flow writes a short summary).
    content: Mapped[str] = mapped_column(Text)
    # Assistant only: the stream as sent (products, specs, confidence, ...), so a transcript can be shown again.
    events: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, server_default="[]")
    preset: Mapped[str | None] = mapped_column(String(40))
    flow: Mapped[str | None] = mapped_column(String(40))
    model: Mapped[str | None] = mapped_column(String(80))
    tool_calls: Mapped[int] = mapped_column(Integer, server_default="0")
    duration_ms: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())


class Feedback(Base):
    """Thumbs on one answer; sending again replaces it."""

    __tablename__ = "assistant_feedback"
    __table_args__ = (CheckConstraint("rating in ('up', 'down')", name="rating"),)

    message_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("assistant_messages.id", ondelete="CASCADE"), primary_key=True
    )
    rating: Mapped[str] = mapped_column(String(4))
    reason: Mapped[str | None] = mapped_column(String(40))
    comment: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
