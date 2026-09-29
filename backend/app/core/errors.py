"""Every error leaves the API as RFC 9457 problem+json.

Each problem carries a stable machine-readable `code`, which the frontend maps to i18n text.
"""

import logging
from collections.abc import Mapping
from http import HTTPStatus
from typing import Any

from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException
from starlette.types import ASGIApp, Message, Receive, Scope, Send

from app.core.schemas import ApiModel

log = logging.getLogger(__name__)

PROBLEM_JSON = "application/problem+json"


class FieldError(ApiModel):
    field: str
    message: str


class Problem(ApiModel):
    type: str = "about:blank"
    title: str
    status: int
    code: str
    detail: str | None = None
    instance: str | None = None
    errors: list[FieldError] | None = None


class ApiError(Exception):
    """Raise from services for expected failures, e.g. ApiError(404, "product_not_found", "No product 6205-XYZ")."""

    def __init__(
        self, status: int, code: str, detail: str | None = None, headers: Mapping[str, str] | None = None
    ) -> None:
        super().__init__(detail or code)
        self.status = status
        self.code = code
        self.detail = detail
        self.headers = headers  # e.g. Retry-After on a 429


# Codes for plain HTTP errors (unknown route, wrong method, ...), so the frontend never has to parse `title`.
_http_codes = {
    400: "bad_request",
    401: "unauthorized",
    403: "forbidden",
    404: "not_found",
    405: "method_not_allowed",
    409: "conflict",
    413: "payload_too_large",
    415: "unsupported_media_type",
    422: "validation_failed",
    429: "rate_limited",
    500: "internal_error",
    503: "service_unavailable",
}


def problem_response(request: Request, problem: Problem, headers: Mapping[str, str] | None = None) -> JSONResponse:
    body = problem.model_copy(update={"instance": request.url.path}).model_dump(exclude_none=True)
    return JSONResponse(body, status_code=problem.status, media_type=PROBLEM_JSON, headers=headers)


def _problem(status: int, code: str | None = None, detail: str | None = None, **extra: Any) -> Problem:
    return Problem(
        title=HTTPStatus(status).phrase,
        status=status,
        code=code or _http_codes.get(status, "error"),
        detail=detail,
        **extra,
    )


async def _api_error(request: Request, exc: Exception) -> JSONResponse:
    assert isinstance(exc, ApiError)
    return problem_response(request, _problem(exc.status, exc.code, exc.detail), headers=exc.headers)


async def _http_error(request: Request, exc: Exception) -> JSONResponse:
    assert isinstance(exc, StarletteHTTPException)
    # Starlette's default detail is just the status phrase again, which `title` already carries.
    detail = exc.detail if isinstance(exc.detail, str) and exc.detail != HTTPStatus(exc.status_code).phrase else None
    return problem_response(request, _problem(exc.status_code, detail=detail), headers=exc.headers)


def _field(loc: tuple[int | str, ...]) -> str:
    # ("query", "page") → "page", ("body", "items", 0, "qty") → "items.0.qty"
    parts = loc[1:] if loc and loc[0] in ("query", "path", "body", "header", "cookie") else loc
    return ".".join(str(p) for p in parts) or "body"


async def _validation_error(request: Request, exc: Exception) -> JSONResponse:
    assert isinstance(exc, RequestValidationError)
    errors = [FieldError(field=_field(tuple(e["loc"])), message=e["msg"]) for e in jsonable_encoder(exc.errors())]
    return problem_response(request, _problem(422, detail="The request has invalid fields.", errors=errors))


class UnhandledErrorMiddleware:
    """Turns an unexpected exception into a 500 problem+json.

    A plain `Exception` handler would run in Starlette's outermost middleware, outside CORS, so the browser would
    see a CORS failure instead of the error. Added before CORSMiddleware, this runs inside it.
    """

    def __init__(self, app: ASGIApp) -> None:
        self.app = app

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return
        started = False

        async def tracked_send(message: Message) -> None:
            nonlocal started
            started = started or message["type"] == "http.response.start"
            await send(message)

        try:
            await self.app(scope, receive, tracked_send)
        except Exception:
            request = Request(scope)
            log.exception("unhandled error on %s %s", request.method, request.url.path)
            if started:  # a streaming response already sent its headers: nothing sane left to send
                raise
            await problem_response(request, _problem(500))(scope, receive, send)


def register_error_handlers(app: FastAPI) -> None:
    """Call before adding CORSMiddleware (see UnhandledErrorMiddleware)."""
    app.add_exception_handler(ApiError, _api_error)
    app.add_exception_handler(StarletteHTTPException, _http_error)
    app.add_exception_handler(RequestValidationError, _validation_error)
    app.add_middleware(UnhandledErrorMiddleware)


def _doc(description: str) -> dict[str, Any]:
    return {"model": Problem, "description": description, "content": {PROBLEM_JSON: {}}}


# Added to every /api/v1 route so the OpenAPI contract (and the generated TS types) know the error shape.
problem_responses: dict[int | str, dict[str, Any]] = {
    404: _doc("Not found"),
    422: _doc("Invalid request"),
    500: _doc("Server error"),
}
