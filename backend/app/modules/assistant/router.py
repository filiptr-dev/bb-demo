from collections.abc import AsyncIterator
from typing import Any

from fastapi import APIRouter, Depends, Request, Response, status

from app.core.errors import problem_responses
from app.modules.assistant.deps import Assistant
from app.modules.assistant.schemas import ChatEvent, ChatRequest, FeedbackRequest

router = APIRouter(prefix="/assistant", tags=["assistant"])

limited: dict[int | str, dict[str, Any]] = {429: problem_responses[500] | {"description": "`rate_limited`"}}


def _ip(request: Request) -> str | None:
    return request.client.host if request.client else None


async def chat_limit(request: Request, response: Response, assistant: Assistant) -> None:
    """A dependency, so it runs before the stream starts: an over-limit client gets a 429 problem with Retry-After."""
    await assistant.check_rate(_ip(request))
    response.headers["Cache-Control"] = "no-cache"
    response.headers["X-Accel-Buffering"] = "no"  # proxies pass each line on at once


@router.post(
    "/chat",
    dependencies=[Depends(chat_limit)],
    response_description="JSON Lines: one event per line, ending with `done`",
    responses=limited,
)
async def chat(body: ChatRequest, assistant: Assistant) -> AsyncIterator[ChatEvent]:
    """A chat turn, streamed. Starter prompts (`preset`) are answered from catalog data without the model; free
    text goes to the model with the catalog tools. Limits: 10 messages per 10 min per client, 2,000 characters."""
    async for event in assistant.chat(body):
        yield event


@router.post("/feedback", status_code=status.HTTP_204_NO_CONTENT, responses=limited)
async def feedback(body: FeedbackRequest, request: Request, assistant: Assistant) -> None:
    """Thumbs up/down on an answer (`messageId` from its `done` event). Sending again replaces it."""
    await assistant.check_rate(_ip(request), feedback=True)
    await assistant.feedback(body)
