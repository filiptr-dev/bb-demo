"""App factory. Run with `uvicorn app.main:create_app --factory`."""

import logging
import sys
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.db import create_engine, create_sessionmaker
from app.core.errors import problem_responses, register_error_handlers
from app.core.settings import Settings, get_settings
from app.modules.health.router import router as health_router
from app.modules.products.router import router as products_router

API_PREFIX = "/api/v1"


def _configure_logging(settings: Settings) -> None:
    # stderr only: Render (and any container host) collects it, and the filesystem is wiped on restart anyway.
    logging.basicConfig(
        level=settings.log_level.upper(),
        stream=sys.stderr,
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
        force=True,
    )


def create_app(settings: Settings | None = None) -> FastAPI:
    settings = settings or get_settings()
    _configure_logging(settings)

    @asynccontextmanager
    async def lifespan(app: FastAPI) -> AsyncIterator[None]:
        engine = create_engine(settings)
        app.state.engine = engine
        app.state.sessionmaker = create_sessionmaker(engine)
        try:
            yield
        finally:
            await engine.dispose()

    app = FastAPI(
        title="B&B Unikoop API",
        version="1",
        summary="Products, catalog data and the assistant for the B&B Unikoop website.",
        lifespan=lifespan,
        docs_url="/docs",
        redoc_url=None,
        openapi_url="/openapi.json",
    )
    app.state.settings = settings

    register_error_handlers(app)  # before CORS, so error responses still carry CORS headers
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_allowed_origins,
        allow_origin_regex=settings.cors_allowed_origin_regex,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
        allow_headers=["Content-Type", "Authorization"],
        max_age=600,
    )

    api = APIRouter(prefix=API_PREFIX, responses=problem_responses)
    api.include_router(health_router)
    api.include_router(products_router)
    app.include_router(api)
    return app
