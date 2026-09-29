from typing import Annotated

import pytest
from fastapi import APIRouter, FastAPI, Query
from fastapi.testclient import TestClient
from httpx2 import Response

from app.core.errors import ApiError
from app.core.schemas import ApiModel
from tests.conftest import ORIGIN


class Item(ApiModel):
    item_name: str
    qty: int


@pytest.fixture
def client(app: FastAPI) -> TestClient:
    """The real app plus a few routes that fail on purpose."""
    router = APIRouter(prefix="/api/v1/_test")

    @router.get("/api-error")
    async def api_error() -> None:
        raise ApiError(409, "already_exists", "That product already exists.")

    @router.get("/crash")
    async def crash() -> None:
        raise RuntimeError("boom: secret internals")

    @router.get("/query")
    async def query(page: Annotated[int, Query(ge=1)]) -> int:
        return page

    @router.post("/items")
    async def items(item: Item) -> Item:
        return item

    app.include_router(router)
    return TestClient(app, raise_server_exceptions=False)


def assert_problem(res: Response, status: int, code: str) -> dict[str, object]:
    assert res.status_code == status
    assert res.headers["content-type"] == "application/problem+json"
    body = res.json()
    assert body["status"] == status
    assert body["code"] == code
    assert body["type"] == "about:blank"
    assert isinstance(body["title"], str)
    assert body["instance"] == res.request.url.path
    return body  # type: ignore[no-any-return]


def test_api_error(client: TestClient) -> None:
    body = assert_problem(client.get("/api/v1/_test/api-error"), 409, "already_exists")
    assert body["detail"] == "That product already exists."
    assert body["title"] == "Conflict"


def test_unknown_route_is_a_404_problem(client: TestClient) -> None:
    assert_problem(client.get("/api/v1/nope"), 404, "not_found")


def test_wrong_method_is_a_405_problem(client: TestClient) -> None:
    assert_problem(client.delete("/api/v1/health"), 405, "method_not_allowed")


def test_query_validation_lists_the_fields(client: TestClient) -> None:
    body = assert_problem(client.get("/api/v1/_test/query?page=0"), 422, "validation_failed")
    assert body["errors"] == [{"field": "page", "message": "Input should be greater than or equal to 1"}]


def test_body_uses_camel_case_and_reports_nested_fields(client: TestClient) -> None:
    ok = client.post("/api/v1/_test/items", json={"itemName": "6205-2RSH", "qty": 2})
    assert ok.status_code == 200
    assert ok.json() == {"itemName": "6205-2RSH", "qty": 2}

    body = assert_problem(
        client.post("/api/v1/_test/items", json={"itemName": "x", "qty": "many"}), 422, "validation_failed"
    )
    assert body["errors"] == [
        {"field": "qty", "message": "Input should be a valid integer, unable to parse string as an integer"}
    ]


def test_crash_is_a_500_problem_without_internals(client: TestClient) -> None:
    body = assert_problem(client.get("/api/v1/_test/crash"), 500, "internal_error")
    assert "boom" not in str(body)


def test_error_responses_keep_cors_headers(client: TestClient) -> None:
    # Otherwise the browser reports a CORS failure instead of the error.
    for path in ("/api/v1/_test/crash", "/api/v1/_test/api-error", "/api/v1/nope"):
        res = client.get(path, headers={"Origin": ORIGIN})
        assert res.headers.get("access-control-allow-origin") == ORIGIN, path
