"""The Alembic migrations, run for real against a throwaway database next to the test database."""

import psycopg
from alembic import command

from tests.conftest import alembic_config

# Created by the revisions after the baseline.
LATER_TABLES = ("specs", "assistant_conversations", "assistant_messages", "assistant_feedback", "rate_limits")


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
        for table in LATER_TABLES:
            assert conn.execute("select to_regclass(%s)", (table,)).fetchone() == (table,)

    command.downgrade(cfg, "base")
    with psycopg.connect(scratch_db) as conn:
        assert conn.execute("select to_regclass('products')").fetchone() == (None,)
        for table in LATER_TABLES:
            assert conn.execute("select to_regclass(%s)", (table,)).fetchone() == (None,)
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


def test_baseline_adopts_a_database_from_before_alembic(scratch_db: str) -> None:
    """Supabase was created by the old frontend/scripts/schema.sql: upgrading it records 0001 and changes nothing."""
    with psycopg.connect(scratch_db) as conn:
        conn.execute("create extension pg_trgm")
        conn.execute("create table products (slug text primary key, designation text not null)")
        conn.execute("insert into products values ('6205', '6205')")

    command.upgrade(alembic_config(scratch_db), "head")

    with psycopg.connect(scratch_db) as conn:
        assert conn.execute("select version_num from alembic_version").fetchall() == [("0003",)]
        assert conn.execute("select * from products").fetchall() == [("6205", "6205")]
