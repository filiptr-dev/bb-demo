import os
from collections.abc import Iterator
from typing import Any

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core.settings import Settings
from app.main import create_app

# The compose database (docker compose up -d db) unless CI points elsewhere.
TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL", "postgresql://postgres:postgres@localhost:5433/bbunikoop")

ORIGIN = "http://localhost:3000"


def make_settings(**overrides: Any) -> Settings:
    values: dict[str, Any] = {
        "app_env": "test",
        "database_url": TEST_DATABASE_URL,
        "cors_allowed_origins": [ORIGIN],
        "db_health_timeout": 3.0,
    }
    values.update(overrides)
    return Settings(_env_file=None, **values)  # _env_file=None: ignore any local .env


@pytest.fixture
def app() -> FastAPI:
    return create_app(make_settings())


@pytest.fixture
def client(app: FastAPI) -> Iterator[TestClient]:
    # raise_server_exceptions=False: assert on the 500 problem response instead of the exception
    with TestClient(app, raise_server_exceptions=False) as c:
        yield c
