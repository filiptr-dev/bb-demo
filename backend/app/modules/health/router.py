import asyncio
import logging
from typing import Literal

from fastapi import APIRouter, Request

from app.core.db import ping
from app.core.errors import ApiError, problem_responses
from app.core.schemas import ApiModel

log = logging.getLogger(__name__)

router = APIRouter(prefix="/health", tags=["health"])


class Liveness(ApiModel):
    status: Literal["ok"]


class Health(ApiModel):
    status: Literal["ok"]
    database: Literal["ok"]


@router.get("", responses={503: problem_responses[500] | {"description": "Database unreachable"}})
async def health(request: Request) -> Health:
    """Readiness: the API and its database both answer. The keep-alive cron calls this, which also keeps the
    Supabase free project from pausing after 7 idle days."""
    try:
        async with asyncio.timeout(request.app.state.settings.db_health_timeout):
            await ping(request.app.state.engine)
    except Exception as exc:
        log.warning("health: database unreachable: %s", exc)
        raise ApiError(503, "database_unavailable", "The database is not reachable.") from exc
    return Health(status="ok", database="ok")


@router.get("/live")
async def live() -> Liveness:
    """Liveness: the process answers, without touching the database. Render's health check uses this, so a
    database outage doesn't make Render restart or refuse to deploy the API."""
    return Liveness(status="ok")
