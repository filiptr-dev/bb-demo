"""One real call per configured model, to catch API or model-name changes. Not part of the default run:
`uv run pytest -m live` (reads GEMINI_* from the environment or backend/.env)."""

import asyncio

import pytest

from app.core.settings import Settings
from app.modules.assistant.llm.client import (
    Chunk,
    LlmRequest,
    ModelUnavailableError,
    TextDelta,
    ToolCall,
    ToolResults,
    ToolSpec,
    TurnEnd,
    UserTurn,
)
from app.modules.assistant.llm.gemini import GeminiClient
from app.modules.assistant.llm.tools import DesignationArgs, json_schema
from tests.conftest import BACKEND

pytestmark = pytest.mark.live

settings = Settings(_env_file=BACKEND / ".env", database_url="unused")
MODELS = [m for m in (settings.gemini_model, settings.gemini_fallback_model) if m]
TOOL = ToolSpec("decode_designation", "Split an SKF designation into its parts.", json_schema(DesignationArgs))


async def collect(client: GeminiClient, model: str, request: LlmRequest) -> list[Chunk]:
    return [c async for c in client.stream(model, request)]


async def round_trip(client: GeminiClient, model: str) -> tuple[ToolCall, str]:
    """The model calls the tool, gets a result, and answers. One event loop: the SDK's HTTP client is bound to it."""
    request = LlmRequest(
        system="Use the tool, then answer in one short sentence.",
        turns=[UserTurn("What does the 2RSH in 6205-2RSH mean?")],
        tools=[TOOL],
    )
    first = await collect(client, model, request)
    [call] = [c for c in first if isinstance(c, ToolCall)]
    [end] = [c for c in first if isinstance(c, TurnEnd)]
    result = {"segments": [{"token": "2RSH", "kind": "suffix", "meaning": "contact seal on both sides"}]}
    turns = [*request.turns, end.turn, ToolResults([(call.name, result)])]
    second = await collect(client, model, LlmRequest(request.system, turns, [TOOL], allow_tools=False))
    return call, "".join(c.text for c in second if isinstance(c, TextDelta))


@pytest.mark.skipif(settings.gemini_api_key is None, reason="GEMINI_API_KEY not set")
@pytest.mark.parametrize("model", MODELS)
def test_tool_round_trip(model: str) -> None:
    assert settings.gemini_api_key is not None
    client = GeminiClient(settings.gemini_api_key.get_secret_value(), thinking=settings.gemini_thinking_level)
    try:
        call, text = asyncio.run(round_trip(client, model))
    except ModelUnavailableError as e:
        pytest.skip(f"{model} unavailable right now: {e}")
    assert call.name == "decode_designation"
    assert "6205" in call.args["designation"]
    assert text.strip()
