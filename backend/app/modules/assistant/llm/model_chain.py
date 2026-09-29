"""Try GEMINI_MODEL, then GEMINI_FALLBACK_MODEL: on 429/503/network errors, or when the first chunk takes longer
than the first-token timeout. Once a model answered, the rest of the turn stays on it."""

import asyncio
import logging
from collections.abc import AsyncIterator

from app.modules.assistant.llm.client import Chunk, LlmClient, LlmRequest, ModelUnavailableError

log = logging.getLogger(__name__)


class ModelChain:
    def __init__(self, client: LlmClient, models: list[str], first_token_timeout: float) -> None:
        if not models:
            raise ValueError("no models")
        self.client = client
        self.models = models
        self.first_token_timeout = first_token_timeout
        self.used: str | None = None  # the model that answered this turn

    async def stream(self, request: LlmRequest) -> AsyncIterator[Chunk]:
        candidates = [self.used] if self.used else self.models
        for i, model in enumerate(candidates):
            chunks = aiter(self.client.stream(model, request))
            try:
                first = await asyncio.wait_for(anext(chunks), self.first_token_timeout)
            except (ModelUnavailableError, TimeoutError, StopAsyncIteration) as e:
                await _close(chunks)
                last = i == len(candidates) - 1
                log.warning("model %s unavailable (%s)%s", model, type(e).__name__, "" if last else ", trying next")
                if last:
                    raise ModelUnavailableError(f"{model}: {type(e).__name__}") from e
                continue
            self.used = model
            yield first
            async for chunk in chunks:
                yield chunk
            return


async def _close(chunks: AsyncIterator[Chunk]) -> None:
    aclose = getattr(chunks, "aclose", None)
    if aclose is not None:
        try:
            await aclose()
        except Exception:
            log.debug("closing a failed stream", exc_info=True)
