from typing import Annotated

from fastapi import Depends, Request

from app.core.db import Session
from app.core.ratelimit import RateLimiter
from app.core.settings import Settings
from app.modules.assistant.llm.client import LlmClient
from app.modules.assistant.llm.gemini import GeminiClient
from app.modules.assistant.repository import AssistantRepository, PgAssistantRepository
from app.modules.assistant.service import AssistantService
from app.modules.catalog.deps import Catalog
from app.modules.products.deps import Products
from app.modules.specs.deps import Specs


def make_llm_client(settings: Settings) -> LlmClient | None:
    """The app's model client (one per process, see main.py); None without GEMINI_API_KEY."""
    if settings.gemini_api_key is None:
        return None
    return GeminiClient(settings.gemini_api_key.get_secret_value(), thinking=settings.gemini_thinking_level)


def get_llm_client(request: Request) -> LlmClient | None:
    client: LlmClient | None = request.app.state.llm
    return client


def get_assistant_repository(session: Session) -> AssistantRepository:
    return PgAssistantRepository(session)


def get_assistant_service(
    request: Request,
    session: Session,
    repo: Annotated[AssistantRepository, Depends(get_assistant_repository)],
    llm: Annotated[LlmClient | None, Depends(get_llm_client)],
    products: Products,
    specs: Specs,
    catalog: Catalog,
) -> AssistantService:
    settings: Settings = request.app.state.settings
    return AssistantService(repo, RateLimiter(session), products, specs, catalog, settings, llm)


Assistant = Annotated[AssistantService, Depends(get_assistant_service)]
