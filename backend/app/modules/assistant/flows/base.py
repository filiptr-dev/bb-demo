"""Scripted flows: a starter prompt answered from catalog data, without the model. A flow can ask for input
(`pending`), and hands the message to the model (returns None) when it can't answer it itself."""

import re
from dataclasses import dataclass, field
from itertools import pairwise
from typing import Any, Protocol

from app.modules.assistant.schemas import (
    AskEvent,
    ContactEvent,
    DecodeEvent,
    FlowId,
    GreasesEvent,
    ProductsEvent,
    SpecsEvent,
)

FlowEvent = ProductsEvent | AskEvent | SpecsEvent | DecodeEvent | GreasesEvent | ContactEvent

# Tokens that may be a designation: contain a digit ("6205-2RSH", "22212", "NU208").
_CANDIDATE = re.compile(r"[A-Za-z0-9][A-Za-z0-9/.-]*\d[A-Za-z0-9/.-]*|\d[A-Za-z0-9/.-]*")
MAX_CANDIDATES = 6


@dataclass(frozen=True)
class FlowContext:
    message: str
    locale: str
    state: dict[str, Any] = field(default_factory=dict)


@dataclass(frozen=True)
class FlowReply:
    events: list[FlowEvent]
    summary: str  # what the model sees of this answer in later turns
    pending: bool = False  # the flow waits for the next message
    state: dict[str, Any] = field(default_factory=dict)


class Flow(Protocol):
    id: FlowId

    async def start(self, ctx: FlowContext) -> FlowReply:
        """The starter prompt was chosen with no text of its own."""
        ...

    async def reply(self, ctx: FlowContext) -> FlowReply | None:
        """Answer `ctx.message`, or None to let the model answer it."""
        ...


def candidates(message: str) -> list[str]:
    """Designation guesses, most specific first: the whole text, then pairs ("22212 EK"), then single tokens."""
    tokens = message.replace(",", " ").split()
    guesses = [message.strip()]
    guesses += [f"{a} {b}" for a, b in pairwise(tokens) if _CANDIDATE.fullmatch(a)]
    guesses += [t.strip(".?!:;") for t in tokens if _CANDIDATE.fullmatch(t.strip(".?!:;"))]
    unique = list(dict.fromkeys(g for g in guesses if g and len(g) <= 100))
    return unique[:MAX_CANDIDATES]
