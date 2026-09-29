"""What the agent needs from a model provider, kept provider-neutral so tests use a fake (tests/assistant/fakes.py)
and a different provider is one new adapter. The Gemini adapter is gemini.py."""

from collections.abc import AsyncIterator
from dataclasses import dataclass, field
from typing import Any, Literal, Protocol


@dataclass(frozen=True)
class ToolSpec:
    name: str
    description: str
    parameters: dict[str, Any]  # JSON schema of an object


@dataclass(frozen=True)
class UserTurn:
    text: str


@dataclass(frozen=True)
class ModelTurn:
    """A model reply as the provider returned it (`raw`: e.g. Gemini's Content, with its thought signatures), or
    plain text for one loaded from the database (`raw` None)."""

    text: str
    raw: Any = None


@dataclass(frozen=True)
class ToolResults:
    results: list[tuple[str, dict[str, Any]]]  # (tool name, result), in the order the calls came


Turn = UserTurn | ModelTurn | ToolResults


@dataclass(frozen=True)
class LlmRequest:
    system: str
    turns: list[Turn]
    tools: list[ToolSpec] = field(default_factory=list)
    allow_tools: bool = True  # False: answer now (the tool-call budget is used up)
    max_output_tokens: int = 2048


@dataclass(frozen=True)
class TextDelta:
    text: str


@dataclass(frozen=True)
class ToolCall:
    name: str
    args: dict[str, Any]


@dataclass(frozen=True)
class TurnEnd:
    """Last item of a stream: the whole reply, to append to the history before sending tool results."""

    turn: ModelTurn
    finish: Literal["stop", "max_tokens", "other"] = "stop"


Chunk = TextDelta | ToolCall | TurnEnd


class ModelUnavailableError(Exception):
    """Overloaded, rate limited or unreachable (429, 503, network): try the next model."""


class LlmClient(Protocol):
    def stream(self, model: str, request: LlmRequest) -> AsyncIterator[Chunk]: ...
