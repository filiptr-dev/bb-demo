"""Small pieces of the assistant: designation guesses, product mentions, tool schemas, the prompt, the Gemini adapter's
conversions and error mapping."""

import asyncio
from collections.abc import AsyncIterator
from types import SimpleNamespace
from typing import Any

import pytest
from google.genai import errors, types

from app.core.ratelimit import client_key
from app.modules.assistant.flows.base import candidates
from app.modules.assistant.llm.agent import mentioned
from app.modules.assistant.llm.client import (
    Chunk,
    LlmRequest,
    ModelTurn,
    ModelUnavailableError,
    ToolResults,
    ToolSpec,
    UserTurn,
)
from app.modules.assistant.llm.gemini import GeminiClient, _contents
from app.modules.assistant.llm.prompt import system_prompt
from app.modules.assistant.llm.tools import SearchArgs, json_schema, rounded
from app.modules.products.schemas import Product


def product(designation: str) -> Product:
    return Product.model_validate(
        {
            "slug": designation.lower().replace("/", "-"),
            "designation": designation,
            "brand": "SKF",
            "type": "deep-groove",
            "classification": None,
            "d": 25,
            "D": 52,
            "B": 15,
            "seal": None,
            "boreType": None,
            "industries": [],
        }
    )


@pytest.mark.parametrize(
    ("message", "expected"),
    [
        ("6205-2RSH", ["6205-2RSH"]),
        ("data for 22212 EK please", ["data for 22212 EK please", "22212 EK", "22212"]),
        ("6205, 6206.", ["6205, 6206.", "6205 6206.", "6205", "6206"]),
        ("hello", ["hello"]),
    ],
)
def test_candidates(message: str, expected: list[str]) -> None:
    assert candidates(message) == expected


def test_mentioned_matches_whole_designations_and_links() -> None:
    p6205, p6205rs, p6206 = product("6205"), product("6205-2RSH"), product("6206")
    text = "The **6205-2RSH** fits; see also [this one](/catalog/6206)."
    assert mentioned(text, [p6205, p6205rs, p6206]) == [p6205rs, p6206]
    assert mentioned("Take the 6205.", [p6205, p6205rs]) == [p6205]


def test_tool_schema_is_plain() -> None:
    schema = json_schema(SearchArgs)
    assert "title" not in schema
    kind = schema["properties"]["type"]
    assert (kind["type"], kind["default"]) == ("string", None)  # `str | None` without anyOf/null
    assert "anyOf" not in str(schema)


def test_tool_results_are_rounded() -> None:
    result = {"l10": 405.22400000000005, "hours": [4502.488888888889, 0.335], "rpm": 28000.0, "n": 3, "s": "6205"}
    assert rounded(result) == {"l10": 405.22, "hours": [4502.5, 0.335], "rpm": 28000.0, "n": 3, "s": "6205"}


def test_system_prompt() -> None:
    en = system_prompt("en")
    assert en.rstrip().endswith("Site language: English.")  # last, so everything before it is cacheable
    assert system_prompt("xx").rstrip().endswith("Site language: Macedonian.")
    assert "{" not in en
    assert "[Greases](/products/greases)" in en
    assert "/industries/cement" in en


def test_client_key_hashes_the_ip() -> None:
    key = client_key("assistant", "203.0.113.7")
    assert key.startswith("assistant:")
    assert "203.0.113.7" not in key
    assert key == client_key("assistant", "203.0.113.7") != client_key("assistant", "203.0.113.8")


def test_gemini_contents() -> None:
    raw = [types.Content(role="model", parts=[types.Part(text="kept as is")])]
    contents = _contents(
        LlmRequest(
            system="s",
            turns=[
                UserTurn("hi"),
                ModelTurn(text="from the database"),
                ModelTurn(text="", raw=raw),
                ToolResults([("get_product", {"designation": "6205"}), ("decode", {"error": "x", "detail": "y"})]),
            ],
        )
    )
    assert [c.role for c in contents] == ["user", "model", "model", "user"]
    assert contents[1].parts is not None
    assert contents[1].parts[0].text == "from the database"
    assert contents[2] is raw[0]
    parts = contents[3].parts or []
    responses = [p.function_response for p in parts]
    assert [(r.name, r.response) for r in responses if r] == [
        ("get_product", {"output": {"designation": "6205"}}),
        ("decode", {"error": "x", "detail": "y"}),
    ]


class FakeModels:
    def __init__(self, error: Exception) -> None:
        self.error = error
        self.config: types.GenerateContentConfig | None = None

    async def generate_content_stream(self, **kwargs: Any) -> AsyncIterator[Any]:
        self.config = kwargs["config"]
        raise self.error


def gemini(error: Exception) -> tuple[GeminiClient, FakeModels]:
    models = FakeModels(error)
    fake = SimpleNamespace(aio=SimpleNamespace(models=models))
    return GeminiClient("key", thinking="low", client=fake), models  # type: ignore[arg-type]


def run(client: GeminiClient, request: LlmRequest) -> list[Chunk]:
    async def collect() -> list[Chunk]:
        return [c async for c in client.stream("m", request)]

    return asyncio.run(collect())


TOOL = ToolSpec("search_products", "Search", {"type": "object", "properties": {}})


def test_gemini_overloaded_is_unavailable() -> None:
    client, _ = gemini(errors.APIError(503, {"error": {"code": 503, "status": "UNAVAILABLE"}}))
    with pytest.raises(ModelUnavailableError, match="503"):
        run(client, LlmRequest(system="s", turns=[UserTurn("hi")]))


def test_gemini_bad_request_is_raised() -> None:
    client, models = gemini(errors.APIError(400, {"error": {"code": 400, "status": "INVALID_ARGUMENT"}}))
    with pytest.raises(errors.APIError):
        run(client, LlmRequest(system="s", turns=[UserTurn("hi")], tools=[TOOL], allow_tools=False))
    config = models.config
    assert config is not None
    assert config.tool_config is not None
    assert config.tool_config.function_calling_config is not None
    assert config.tool_config.function_calling_config.mode == types.FunctionCallingConfigMode.NONE
    assert config.thinking_config is not None
    assert config.thinking_config.thinking_level == types.ThinkingLevel.LOW
