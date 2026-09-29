"""The free-text path: the model answers with tools, streamed as events.

Loop: stream a reply; if it called tools, run them (status events), append the results and ask again; at most
MAX_TOOL_CALLS per turn, then the model must answer without tools. Text passes through the FooterFilter, so the
confidence footer becomes a `confidence` event. Products and SKF pages the tools returned become `products` and
`sources` events when the answer mentions them.
"""

import re
from collections.abc import AsyncIterator
from dataclasses import dataclass, field

from app.modules.assistant.confidence import FooterFilter
from app.modules.assistant.llm.client import (
    LlmRequest,
    ModelTurn,
    TextDelta,
    ToolCall,
    ToolResults,
    Turn,
    TurnEnd,
    UserTurn,
)
from app.modules.assistant.llm.model_chain import ModelChain
from app.modules.assistant.llm.tools import AssistantTools
from app.modules.assistant.schemas import (
    ConfidenceEvent,
    ProductsEvent,
    SourcesEvent,
    StatusEvent,
    TextEvent,
)
from app.modules.products.schemas import Product

MAX_TOOL_CALLS = 8
MAX_CARDS = 6
MAX_OUTPUT_TOKENS = 2048

AgentEvent = StatusEvent | TextEvent | ProductsEvent | SourcesEvent | ConfidenceEvent


class EmptyAnswerError(Exception):
    """The model ended the turn without any text."""


@dataclass
class AgentResult:
    text: str = ""
    model: str | None = None
    tool_calls: int = 0
    confidence: ConfidenceEvent | None = None
    events: list[AgentEvent] = field(default_factory=list)


def mentioned(text: str, products: list[Product]) -> list[Product]:
    """Products the answer names (by designation) or links (/catalog/<slug>)."""
    found = []
    for p in products:
        by_name = re.search(rf"(?<![\w/-]){re.escape(p.designation)}(?![\w/-])", text, re.IGNORECASE)
        if by_name or f"/catalog/{p.slug})" in text:
            found.append(p)
    return found


class Agent:
    def __init__(self, chain: ModelChain, tools: AssistantTools, system: str) -> None:
        self.chain = chain
        self.tools = tools
        self.system = system
        self.result = AgentResult()

    async def run(self, history: list[Turn], message: str) -> AsyncIterator[AgentEvent]:
        async for event in self._run(history, message):
            self.result.events.append(event)
            yield event

    async def _run(self, history: list[Turn], message: str) -> AsyncIterator[AgentEvent]:
        result = self.result
        turns: list[Turn] = [*history, UserTurn(message)]
        footer = FooterFilter()
        text: list[str] = []
        yield StatusEvent(status="thinking")
        while True:
            allow_tools = result.tool_calls < MAX_TOOL_CALLS
            request = LlmRequest(
                system=self.system,
                turns=[*turns],  # a snapshot: the loop keeps appending to `turns`
                tools=self.tools.specs_list,
                allow_tools=allow_tools,
                max_output_tokens=MAX_OUTPUT_TOKENS,
            )
            calls: list[ToolCall] = []
            end: TurnEnd | None = None
            async for chunk in self.chain.stream(request):
                if isinstance(chunk, TextDelta):
                    if out := footer.feed(chunk.text):
                        text.append(out)
                        yield TextEvent(text=out)
                elif isinstance(chunk, ToolCall):
                    calls.append(chunk)
                elif isinstance(chunk, TurnEnd):
                    end = chunk
            result.model = self.chain.used
            turns.append(end.turn if end else ModelTurn(text=""))
            if not calls or not allow_tools:
                break
            results = []
            for call in calls[: MAX_TOOL_CALLS - result.tool_calls]:
                tool = self.tools.tools.get(call.name)
                yield StatusEvent(status=tool.status if tool else "thinking")
                result.tool_calls += 1
                results.append((call.name, await self.tools.call(call.name, call.args)))
            turns.append(ToolResults(results))

        finished = footer.finish()
        if finished.text:
            text.append(finished.text)
            yield TextEvent(text=finished.text)
        result.text = "".join(text).strip()
        if not result.text:
            raise EmptyAnswerError
        cards = mentioned(result.text, list(self.tools.seen.values()))[:MAX_CARDS]
        if cards:
            yield ProductsEvent(products=cards)
        names = {p.designation for p in cards}
        sources = [s for s in self.tools.sources.values() if s.title.removeprefix("SKF ") in names]
        if sources:
            yield SourcesEvent(sources=sources)
        if finished.confidence:
            result.confidence = finished.confidence
            yield finished.confidence
