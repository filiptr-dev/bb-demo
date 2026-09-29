import gzip
import json
import os
from collections.abc import Iterator
from pathlib import Path
from typing import Any

import psycopg
import pytest
from alembic import command
from alembic.config import Config
from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import make_url

from app.core.settings import Settings
from app.main import create_app
from app.modules.specs.scraper import parse

# The compose database (docker compose up -d db) unless CI points elsewhere.
TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL", "postgresql://postgres:postgres@localhost:5433/bbunikoop")

ORIGIN = "http://localhost:3000"
BACKEND = Path(__file__).resolve().parent.parent


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


@pytest.fixture
def scratch_db() -> Iterator[str]:
    """A fresh, empty database for one test, dropped afterwards."""
    url = make_url(TEST_DATABASE_URL)
    name = f"{url.database}_migrations"
    with psycopg.connect(TEST_DATABASE_URL, autocommit=True) as admin:
        admin.execute(f'drop database if exists "{name}" with (force)')
        admin.execute(f'create database "{name}"')
    try:
        yield url.set(database=name).render_as_string(hide_password=False)
    finally:
        with psycopg.connect(TEST_DATABASE_URL, autocommit=True) as admin:
            admin.execute(f'drop database if exists "{name}" with (force)')


def alembic_config(url: str) -> Config:
    cfg = Config(BACKEND / "alembic.ini")
    cfg.attributes["database_url"] = url
    cfg.attributes["configure_logger"] = False  # keep pytest's logging setup
    return cfg


CATALOG_DATA = Path(__file__).parent / "products" / "data"
COLUMNS = (
    "slug, designation, brand, type, classification, bore_type, seal, sealing, d, outer_d, width, industries, source, "
    "updated_at"
)


@pytest.fixture(scope="session")
def catalog_db() -> Iterator[str]:
    """A database with the real catalog: data/products.csv.gz is the 15,420 rows the golden files were recorded on
    (frontend importer, 2026-09-29). Created once per test run, next to the test database."""
    url = make_url(TEST_DATABASE_URL)
    name = f"{url.database}_catalog"
    with psycopg.connect(TEST_DATABASE_URL, autocommit=True) as admin:
        admin.execute(f'drop database if exists "{name}" with (force)')
        admin.execute(f'create database "{name}"')
    db_url = url.set(database=name).render_as_string(hide_password=False)
    try:
        command.upgrade(alembic_config(db_url), "head")
        with (
            psycopg.connect(db_url) as conn,
            conn.cursor().copy(f"copy products ({COLUMNS}) from stdin with (format csv, header)") as copy,
        ):
            copy.write(gzip.decompress((CATALOG_DATA / "products.csv.gz").read_bytes()))
        yield db_url
    finally:
        with psycopg.connect(TEST_DATABASE_URL, autocommit=True) as admin:
            admin.execute(f'drop database if exists "{name}" with (force)')


@pytest.fixture(scope="session")
def catalog(catalog_db: str) -> Iterator[TestClient]:
    with TestClient(create_app(make_settings(database_url=catalog_db)), raise_server_exceptions=False) as c:
        yield c


SPECS_DATA = Path(__file__).parent / "specs" / "data"


@pytest.fixture(scope="module")
def specs_db(catalog_db: str) -> Iterator[None]:
    """SKF data for 6205 (recorded response) and a miss for 6205-2RS1, on top of `catalog_db`."""
    spec = parse(json.loads((SPECS_DATA / "skf-6205.json").read_text())["documentList"]["documents"][0])
    datasheet = json.dumps([s.model_dump(mode="json") for s in spec.datasheet])
    with psycopg.connect(catalog_db) as conn:
        conn.execute(
            "insert into specs (slug, found, c, c0, pu, reference_speed, limiting_speed, mass, performance_class,"
            " factors, datasheet, source_url) values ('6205', true, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s),"
            " ('6205-2rs1', false, null, null, null, null, null, null, null, '{}', '[]', null)",
            (
                spec.c,
                spec.c0,
                spec.pu,
                spec.reference_speed,
                spec.limiting_speed,
                spec.mass,
                spec.performance_class,
                json.dumps(spec.factors),
                datasheet,
                spec.source_url,
            ),
        )
    yield
    with psycopg.connect(catalog_db) as conn:
        conn.execute("delete from specs")
