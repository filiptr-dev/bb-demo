"""The chat pipeline: conversation → user message → route (scripted flow or the model) → stream → save the answer.

Routing: a `preset` runs its flow; otherwise a flow that asked a question gets the reply; everything else, and any
message a flow can't answer, goes to the model (Agent)."""

import logging
import time
import uuid
from collections.abc import AsyncIterator, Callable, Sequence

from pydantic import BaseModel

from app.core.errors import ApiError
from app.core.ratelimit import RateLimiter, client_key
from app.core.settings import Settings
from app.modules.assistant.flows import Flow, FlowContext, FlowReply, flows
from app.modules.assistant.llm.agent import Agent, EmptyAnswerError
from app.modules.assistant.llm.client import LlmClient, ModelTurn, ModelUnavailableError, Turn, UserTurn
from app.modules.assistant.llm.model_chain import ModelChain
from app.modules.assistant.llm.prompt import system_prompt
from app.modules.assistant.llm.tools import AssistantTools
from app.modules.assistant.repository import AssistantRepository, ConversationRecord, NewMessage
from app.modules.assistant.schemas import (
    ChatEventModel,
    ChatRequest,
    DoneEvent,
    ErrorCode,
    ErrorEvent,
    FeedbackRequest,
)
from app.modules.catalog.service import CatalogService
from app.modules.products.service import ProductService
from app.modules.specs.service import SpecService

log = logging.getLogger(__name__)

HISTORY = 20  # messages of context for the model
HISTORY_CHARS = 4000  # per message
DAY = 86_400
FEEDBACK_LIMIT = 30  # per client per window


class AssistantService:
    def __init__(
        self,
        repo: AssistantRepository,
        limiter: RateLimiter,
        products: ProductService,
        specs: SpecService,
        catalog: CatalogService,
        settings: Settings,
        llm: LlmClient | None,
    ) -> None:
        self.repo = repo
        self.limiter = limiter
        self.products = products
        self.specs = specs
        self.catalog = catalog
        self.settings = settings
        self.llm = llm
        self.flows = flows(products, specs, catalog)

    async def check_rate(self, ip: str | None, feedback: bool = False) -> None:
        """Before the stream starts, so an over-limit client gets a plain 429 problem with Retry-After."""
        s = self.settings
        key, limit = ("assistant-feedback", FEEDBACK_LIMIT) if feedback else ("assistant", s.assistant_rate_limit)
        hit = await self.limiter.hit(client_key(key, ip), limit, s.assistant_rate_window)
        if not hit.allowed:
            raise ApiError(
                429,
                "rate_limited",
                f"Too many messages. Try again in {hit.retry_after} s.",
                headers={"Retry-After": str(hit.retry_after)},
            )

    async def feedback(self, request: FeedbackRequest) -> None:
        if not await self.repo.is_answer(request.message_id):
            raise ApiError(404, "message_not_found", "No assistant answer with this id.")
        await self.repo.save_feedback(request.message_id, request.rating, request.reason, request.comment)

    async def chat(self, request: ChatRequest) -> AsyncIterator[ChatEventModel]:
        started = time.monotonic()
        conversation = await self._conversation(request)
        if conversation is None:
            yield ErrorEvent(code="conversation_not_found", detail="Start a new conversation.")
            return
        message = request.message.strip()
        await self.repo.add_message(
            NewMessage(
                conversation_id=conversation.id,
                role="user",
                content=message or f"[{request.preset}]",
                preset=request.preset,
            )
        )

        flow, reply = await self._route(conversation, request, message)
        if reply is not None and flow is not None:
            await self.repo.set_flow(conversation.id, flow.id if reply.pending else None, reply.state)
            for event in reply.events:
                yield event
            answer_id = await self.repo.add_message(
                NewMessage(
                    conversation_id=conversation.id,
                    role="assistant",
                    content=reply.summary,
                    events=_dump(reply.events),
                    flow=flow.id,
                    duration_ms=_ms(started),
                )
            )
            yield DoneEvent(conversation_id=conversation.id, message_id=answer_id)
            return

        if conversation.pending_flow:  # a flow asked, but this message is for the model
            await self.repo.set_flow(conversation.id, None, {})
        async for answer_event in self._answer(conversation, message, started):
            yield answer_event

    async def _conversation(self, request: ChatRequest) -> ConversationRecord | None:
        if request.conversation_id is None:
            return await self.repo.create_conversation(request.locale)
        return await self.repo.get_conversation(request.conversation_id)

    async def _route(
        self, conversation: ConversationRecord, request: ChatRequest, message: str
    ) -> tuple[Flow | None, FlowReply | None]:
        name = request.preset or conversation.pending_flow
        flow = self.flows.get(name) if name else None
        if flow is None:
            return None, None
        ctx = FlowContext(message=message, locale=request.locale, state=conversation.flow_state)
        if request.preset and not message:
            return flow, await flow.start(ctx)
        return flow, await flow.reply(ctx)

    async def _answer(
        self, conversation: ConversationRecord, message: str, started: float
    ) -> AsyncIterator[ChatEventModel]:
        agent: Agent | None = None
        error: ErrorEvent | None = None
        if self.llm is None:
            error = _error("assistant_unavailable", "The assistant can't answer free-text questions right now.")
        elif not (await self.limiter.hit("assistant-daily", self.settings.assistant_daily_limit, DAY)).allowed:
            error = _error("assistant_busy", "The assistant reached today's limit. Please call or write to us.")
        else:
            history = await self._history(conversation.id)
            agent = Agent(self._chain(self.llm), self._tools(conversation.locale), system_prompt(conversation.locale))
            try:
                async for event in agent.run(history, message):
                    yield event
            except ModelUnavailableError as e:
                log.warning("assistant: no model answered: %s", e)
                error = _error("assistant_unavailable", "The AI model is overloaded. Please try again in a minute.")
            except EmptyAnswerError:
                error = _error("assistant_failed", "The answer came back empty. Please ask again.")
            except Exception:
                log.exception("assistant: answer failed")
                error = _error("assistant_failed", "Something went wrong while answering. Please ask again.")
        if error:
            yield error
        events: Sequence[BaseModel] = [*(agent.result.events if agent else []), *([error] if error else [])]
        answer_id = await self.repo.add_message(
            NewMessage(
                conversation_id=conversation.id,
                role="assistant",
                content=agent.result.text if agent else "",
                events=_dump(events),
                model=agent.result.model if agent else None,
                tool_calls=agent.result.tool_calls if agent else 0,
                duration_ms=_ms(started),
            )
        )
        yield DoneEvent(conversation_id=conversation.id, message_id=answer_id)

    async def _history(self, conversation_id: uuid.UUID) -> list[Turn]:
        items = await self.repo.history(conversation_id, HISTORY + 1)
        items = items[:-1]  # the message being answered, which the agent adds itself
        turns: list[Turn] = []
        for item in items:
            text = item.content[:HISTORY_CHARS]
            if not text:
                continue
            turns.append(UserTurn(text) if item.role == "user" else ModelTurn(text=text))
        return turns

    def _chain(self, llm: LlmClient) -> ModelChain:
        s = self.settings
        models = [s.gemini_model] + ([s.gemini_fallback_model] if s.gemini_fallback_model else [])
        return ModelChain(llm, list(dict.fromkeys(models)), s.gemini_first_token_timeout)

    def _tools(self, locale: str) -> AssistantTools:
        return AssistantTools(self.products, self.specs, self.catalog, locale)


def _error(code: ErrorCode, detail: str) -> ErrorEvent:
    return ErrorEvent(code=code, detail=detail)


def _dump(events: Sequence[BaseModel]) -> list[dict[str, object]]:
    return [e.model_dump(mode="json", by_alias=True) for e in events]


def _ms(started: float) -> int:
    return int((time.monotonic() - started) * 1000)


# for deps.py: a factory so tests can swap the model client
LlmFactory = Callable[[Settings], LlmClient | None]
