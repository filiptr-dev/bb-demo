import uuid
from dataclasses import dataclass
from typing import Any, Protocol

from sqlalchemy import func, select, update
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.assistant.models import Conversation, Feedback, Message


@dataclass(frozen=True)
class ConversationRecord:
    id: uuid.UUID
    locale: str
    pending_flow: str | None
    flow_state: dict[str, Any]


@dataclass(frozen=True)
class HistoryItem:
    role: str  # user | assistant
    content: str


@dataclass(frozen=True)
class NewMessage:
    conversation_id: uuid.UUID
    role: str
    content: str
    events: list[dict[str, Any]] | None = None
    preset: str | None = None
    flow: str | None = None
    model: str | None = None
    tool_calls: int = 0
    duration_ms: int | None = None


class AssistantRepository(Protocol):
    async def create_conversation(self, locale: str) -> ConversationRecord: ...
    async def get_conversation(self, conversation_id: uuid.UUID) -> ConversationRecord | None: ...
    async def set_flow(self, conversation_id: uuid.UUID, flow: str | None, state: dict[str, Any]) -> None: ...
    async def add_message(self, message: NewMessage) -> uuid.UUID: ...
    async def history(self, conversation_id: uuid.UUID, limit: int) -> list[HistoryItem]: ...
    async def is_answer(self, message_id: uuid.UUID) -> bool: ...
    async def save_feedback(
        self, message_id: uuid.UUID, rating: str, reason: str | None, comment: str | None
    ) -> None: ...


def _record(c: Conversation) -> ConversationRecord:
    return ConversationRecord(id=c.id, locale=c.locale, pending_flow=c.pending_flow, flow_state=dict(c.flow_state))


class PgAssistantRepository:
    """Each write commits: the stream saves as it goes, and a dropped connection keeps what was saved."""

    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def create_conversation(self, locale: str) -> ConversationRecord:
        conversation = Conversation(id=uuid.uuid4(), locale=locale, flow_state={})
        self.session.add(conversation)
        await self.session.commit()
        return _record(conversation)

    async def get_conversation(self, conversation_id: uuid.UUID) -> ConversationRecord | None:
        conversation = await self.session.get(Conversation, conversation_id)
        return _record(conversation) if conversation else None

    async def set_flow(self, conversation_id: uuid.UUID, flow: str | None, state: dict[str, Any]) -> None:
        await self.session.execute(
            update(Conversation)
            .where(Conversation.id == conversation_id)
            .values(pending_flow=flow, flow_state=state, updated_at=func.now())
        )
        await self.session.commit()

    async def add_message(self, message: NewMessage) -> uuid.UUID:
        row = Message(
            id=uuid.uuid4(),
            conversation_id=message.conversation_id,
            role=message.role,
            content=message.content,
            events=message.events or [],
            preset=message.preset,
            flow=message.flow,
            model=message.model,
            tool_calls=message.tool_calls,
            duration_ms=message.duration_ms,
        )
        self.session.add(row)
        await self.session.execute(
            update(Conversation).where(Conversation.id == message.conversation_id).values(updated_at=func.now())
        )
        await self.session.commit()
        return row.id

    async def history(self, conversation_id: uuid.UUID, limit: int) -> list[HistoryItem]:
        rows = (
            await self.session.execute(
                select(Message.role, Message.content)
                .where(Message.conversation_id == conversation_id)
                .order_by(Message.created_at.desc(), Message.id)
                .limit(limit)
            )
        ).all()
        return [HistoryItem(role=r.role, content=r.content) for r in reversed(rows)]

    async def is_answer(self, message_id: uuid.UUID) -> bool:
        role = await self.session.scalar(select(Message.role).where(Message.id == message_id))
        return role == "assistant"

    async def save_feedback(self, message_id: uuid.UUID, rating: str, reason: str | None, comment: str | None) -> None:
        values = {"message_id": message_id, "rating": rating, "reason": reason, "comment": comment}
        await self.session.execute(
            insert(Feedback)
            .values(**values)
            .on_conflict_do_update(
                index_elements=[Feedback.message_id],
                set_={"rating": rating, "reason": reason, "comment": comment, "created_at": func.now()},
            )
        )
        await self.session.commit()
