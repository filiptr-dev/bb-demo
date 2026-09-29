"""The Alembic migrations, run for real against a throwaway database next to the test database."""

from collections.abc import Iterator
from pathlib import Path

import psycopg
import pytest
from alembic import command
from alembic.config import Config
from sqlalchemy import make_url

from tests.conftest import TEST_DATABASE_URL

BACKEND = Path(__file__).resolve().parent.parent


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


def product_indexes(conn: psycopg.Connection) -> set[str]:
    rows = conn.execute("select indexname from pg_indexes where tablename = 'products'").fetchall()
    return {r[0] for r in rows}


def test_upgrade_downgrade_upgrade(scratch_db: str) -> None:
    cfg = alembic_config(scratch_db)

    command.upgrade(cfg, "head")
    with psycopg.connect(scratch_db) as conn:
        assert product_indexes(conn) == {
            "products_pkey",
            "products_search_key_trgm",
            "products_type",
            "products_d",
            "products_industries",
        }

    command.downgrade(cfg, "base")
    with psycopg.connect(scratch_db) as conn:
        assert conn.execute("select to_regclass('products')").fetchone() == (None,)
        assert conn.execute("select count(*) from pg_collation where collname = 'natural_sort'").fetchone() == (0,)

    command.upgrade(cfg, "head")  # the downgrade left nothing behind that blocks a clean re-run


def test_models_match_the_migrations(scratch_db: str) -> None:
    """Fails when a model changed without a migration (or the other way round): write the migration."""
    cfg = alembic_config(scratch_db)
    command.upgrade(cfg, "head")
    command.check(cfg)


def test_baseline_search_key_and_natural_sort(scratch_db: str) -> None:
    command.upgrade(alembic_config(scratch_db), "head")
    with psycopg.connect(scratch_db) as conn:
        for designation in ("62010", "6210", "6205-2RSH"):
            conn.execute(
                "insert into products (slug, designation, type, source) values (%s, %s, 'deep-groove', 'test')",
                (designation.lower(), designation),
            )
        row = conn.execute("select brand, industries, search_key from products where slug = '6205-2rsh'").fetchone()
        assert row == ("SKF", [], "62052RSH")

        ordered = conn.execute("select designation from products order by designation collate natural_sort")
        assert [r[0] for r in ordered] == ["6205-2RSH", "6210", "62010"]

        # The trigram index serves "contains" searches.
        conn.execute("set enable_seqscan = off")
        plan = conn.execute("explain select slug from products where search_key like '%2RS%'").fetchall()
        assert "products_search_key_trgm" in " ".join(r[0] for r in plan)
