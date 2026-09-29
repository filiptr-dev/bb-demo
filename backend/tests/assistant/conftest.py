import json
from collections.abc import Iterator
from typing import Any

import psycopg
import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.main import create_app
from app.modules.assistant.deps import get_llm_client
from tests.assistant.fakes import FakeLlm
from tests.conftest import make_settings

Event = dict[str, Any]


def assistant_app(catalog_db: str, **settings: Any) -> FastAPI:
    values: dict[str, Any] = {"database_url": catalog_db, "assistant_rate_limit": 1000, "gemini_model": "lite"}
    values["gemini_fallback_model"] = "flash"
    return create_app(make_settings(**(values | settings)))


@pytest.fixture(autouse=True)
def clean_assistant_tables(catalog_db: str) -> None:
    with psycopg.connect(catalog_db) as conn:
        conn.execute("truncate assistant_conversations, assistant_messages, assistant_feedback, rate_limits")


@pytest.fixture(scope="module")
def app(catalog_db: str) -> FastAPI:
    return assistant_app(catalog_db)


@pytest.fixture(scope="module")
def chat_client(app: FastAPI) -> Iterator[TestClient]:
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c


@pytest.fixture
def llm(app: FastAPI) -> Iterator[FakeLlm]:
    """The model the app talks to; queue replies with `llm.replies.append(...)` before the request."""
    fake = FakeLlm()
    app.dependency_overrides[get_llm_client] = lambda: fake
    yield fake
    app.dependency_overrides.clear()


def stream(client: TestClient, **body: Any) -> list[Event]:
    res = client.post("/api/v1/assistant/chat", json=body)
    assert res.status_code == 200, res.text
    assert res.headers["content-type"].startswith("application/jsonl")
    assert (res.headers["cache-control"], res.headers["x-accel-buffering"]) == ("no-cache", "no")
    return [json.loads(line) for line in res.text.splitlines()]


def types_of(events: list[Event]) -> list[str]:
    return [e["type"] for e in events]


def text_of(events: list[Event]) -> str:
    return "".join(e["text"] for e in events if e["type"] == "text")


def one(events: list[Event], kind: str) -> Event:
    found = [e for e in events if e["type"] == kind]
    assert len(found) == 1, types_of(events)
    return found[0]


def rows(db: str, sql: str, *params: Any) -> list[tuple[Any, ...]]:
    with psycopg.connect(db) as conn:
        return conn.execute(sql, params).fetchall()
