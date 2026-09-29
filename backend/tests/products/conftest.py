import gzip
from collections.abc import Iterator
from pathlib import Path

import psycopg
import pytest
from alembic import command
from fastapi.testclient import TestClient
from sqlalchemy import make_url

from app.main import create_app
from tests.conftest import TEST_DATABASE_URL, make_settings
from tests.test_migrations import alembic_config

DATA = Path(__file__).parent / "data"
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
            copy.write(gzip.decompress((DATA / "products.csv.gz").read_bytes()))
        yield db_url
    finally:
        with psycopg.connect(TEST_DATABASE_URL, autocommit=True) as admin:
            admin.execute(f'drop database if exists "{name}" with (force)')


@pytest.fixture(scope="session")
def catalog(catalog_db: str) -> Iterator[TestClient]:
    with TestClient(create_app(make_settings(database_url=catalog_db)), raise_server_exceptions=False) as c:
        yield c
