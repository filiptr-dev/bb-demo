"""A scripted model client, so the agent and the chat API are tested without Gemini."""

import asyncio
from collections.abc import AsyncIterator, Callable
from typing import Any

from app.modules.assistant.llm.client import (
    Chunk,
    LlmRequest,
    ModelTurn,
    ModelUnavailableError,
    TextDelta,
    ToolCall,
    TurnEnd,
)

Reply = list[Chunk] | Exception


def answer(*pieces: str) -> list[Chunk]:
    """A text reply, streamed in these pieces."""
    return [*(TextDelta(p) for p in pieces), TurnEnd(ModelTurn(text="".join(pieces)))]


def calls(*tool_calls: tuple[str, dict[str, Any]]) -> list[Chunk]:
    """A reply that only calls tools."""
    return [*(ToolCall(name, args) for name, args in tool_calls), TurnEnd(ModelTurn(text=""))]


class FakeLlm:
    """Answers each `stream` call with the next reply in `replies` (or from `script`), and records every request.

    `down`: models that fail with ModelUnavailableError; `slow`: seconds a model waits before its first chunk."""

    def __init__(
        self,
        *replies: Reply,
        script: Callable[[LlmRequest], Reply] | None = None,
        down: tuple[str, ...] = (),
        slow: dict[str, float] | None = None,
    ) -> None:
        self.replies = list(replies)
        self.script = script
        self.down = down
        self.slow = slow or {}
        self.requests: list[tuple[str, LlmRequest]] = []

    async def stream(self, model: str, request: LlmRequest) -> AsyncIterator[Chunk]:
        self.requests.append((model, request))
        if model in self.down:
            raise ModelUnavailableError(f"{model}: 503")
        reply = self.script(request) if self.script else self.replies.pop(0)
        if model in self.slow:
            await asyncio.sleep(self.slow[model])
        if isinstance(reply, Exception):
            raise reply
        for chunk in reply:
            yield chunk

    @property
    def models(self) -> list[str]:
        return [model for model, _ in self.requests]
