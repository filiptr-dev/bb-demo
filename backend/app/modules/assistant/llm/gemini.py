"""Gemini through the official google-genai SDK: streaming, manual function calling (the agent runs the tools)."""

import logging
from collections.abc import AsyncIterator
from typing import Any, Literal

import httpx
from google import genai
from google.genai import errors, types

from app.modules.assistant.llm.client import (
    Chunk,
    LlmRequest,
    ModelTurn,
    ModelUnavailableError,
    TextDelta,
    ToolCall,
    ToolResults,
    TurnEnd,
    UserTurn,
)

log = logging.getLogger(__name__)

RETRYABLE = {408, 429, 500, 502, 503, 504}
REQUEST_TIMEOUT_MS = 60_000
Thinking = Literal["minimal", "low", "medium", "high"]


class GeminiClient:
    def __init__(self, api_key: str, thinking: Thinking | None = None, client: genai.Client | None = None) -> None:
        self.client = client or genai.Client(
            api_key=api_key, http_options=types.HttpOptions(timeout=REQUEST_TIMEOUT_MS)
        )
        self.thinking = thinking

    async def stream(self, model: str, request: LlmRequest) -> AsyncIterator[Chunk]:
        try:
            response = await self.client.aio.models.generate_content_stream(
                model=model, contents=_contents(request), config=self._config(request)
            )
            model_output: list[types.Content] = []
            text: list[str] = []
            finish: Literal["stop", "max_tokens", "other"] = "stop"
            async for chunk in response:
                candidate = chunk.candidates[0] if chunk.candidates else None
                if candidate is None or candidate.content is None:
                    continue
                model_output.append(candidate.content)
                for part in candidate.content.parts or []:
                    if part.thought:
                        continue
                    if part.function_call is not None and part.function_call.name:
                        yield ToolCall(name=part.function_call.name, args=dict(part.function_call.args or {}))
                    elif part.text:
                        text.append(part.text)
                        yield TextDelta(part.text)
                if candidate.finish_reason is not None:
                    finish = _finish(candidate.finish_reason)
            yield TurnEnd(turn=ModelTurn(text="".join(text), raw=model_output), finish=finish)
        except errors.APIError as e:
            if e.code in RETRYABLE:
                raise ModelUnavailableError(f"{model}: {e.code} {e.status}") from e
            raise
        except httpx.TransportError as e:
            raise ModelUnavailableError(f"{model}: {type(e).__name__}") from e

    def _config(self, request: LlmRequest) -> types.GenerateContentConfig:
        tools = (
            [
                types.Tool(
                    function_declarations=[
                        types.FunctionDeclaration(
                            name=t.name, description=t.description, parameters_json_schema=t.parameters
                        )
                        for t in request.tools
                    ]
                )
            ]
            if request.tools
            else None
        )
        return types.GenerateContentConfig(
            system_instruction=request.system,
            tools=tools,
            tool_config=(
                types.ToolConfig(
                    function_calling_config=types.FunctionCallingConfig(mode=types.FunctionCallingConfigMode.NONE)
                )
                if tools and not request.allow_tools
                else None
            ),
            automatic_function_calling=types.AutomaticFunctionCallingConfig(disable=True),
            max_output_tokens=request.max_output_tokens,
            thinking_config=(
                types.ThinkingConfig(thinking_level=types.ThinkingLevel(self.thinking.upper()))
                if self.thinking
                else None
            ),
        )


def _contents(request: LlmRequest) -> list[types.Content]:
    contents: list[types.Content] = []
    for turn in request.turns:
        if isinstance(turn, UserTurn):
            parts = [types.Part.from_bytes(data=i.data, mime_type=i.mime_type) for i in turn.images]
            if turn.text or not parts:
                parts.append(types.Part(text=turn.text))
            contents.append(types.Content(role="user", parts=parts))
        elif isinstance(turn, ModelTurn):
            if turn.raw is not None:
                contents.extend(turn.raw)  # as received: keeps Gemini's thought signatures
            elif turn.text:
                contents.append(types.Content(role="model", parts=[types.Part(text=turn.text)]))
        elif isinstance(turn, ToolResults):
            contents.append(
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_function_response(name=name, response=_response(r)) for name, r in turn.results
                    ],
                )
            )
    return contents


def _response(result: dict[str, Any]) -> dict[str, Any]:
    # Gemini expects {"output": ...} or {"error": ...}
    return result if "error" in result else {"output": result}


def _finish(reason: types.FinishReason) -> Literal["stop", "max_tokens", "other"]:
    if reason == types.FinishReason.STOP:
        return "stop"
    if reason == types.FinishReason.MAX_TOKENS:
        return "max_tokens"
    return "other"
