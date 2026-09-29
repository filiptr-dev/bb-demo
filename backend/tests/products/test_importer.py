"""The catalog importer: bearingworld's bundle format, the merge with our seed list, and the write."""

import asyncio
from dataclasses import replace

import httpx2
import psycopg
import pytest
from alembic import command

from app.core.db import create_engine, create_sessionmaker
from app.modules.products.importer import (
    LayoutChangedError,
    ProductRecord,
    ScrapedRow,
    build_catalog,
    parse_chunk,
    scrape,
    seal_of,
    slugify,
)
from app.modules.products.repository import PgProductRepository
from app.modules.products.seed import SEED
from tests.conftest import alembic_config, make_settings

# The shape of bearingworld's Catalog chunk, cut down: lookup tables, then the tuples, then the row decoder.
CHUNK = (
    'import{a as b}from"./index.js";const q=1,$=["Radial deep groove","Housing","Mystery"],z=["Cylindrical","Tapered"],'
    'C1=["Without","Shields on both sides","Contact seal on one side"],'
    'i1=[["6205 ",0,0,0,25,52,15],["W 03",1,-1,-1,17.246,33.731,.812],["X 1",2,0,0,1,2,3],["6204-2Z",0,0,1,20,47,14]]'
    ";function f(P){return{designation:P[0],classification:P[1]>=0?$[P[1]]:null}}export{f as default};"
)


def test_parse_chunk_reads_the_tuples() -> None:
    rows = parse_chunk(CHUNK)
    assert rows[0] == ScrapedRow("6205", "Radial deep groove", "Cylindrical", "Without", 25, 52, 15)
    assert rows[1] == ScrapedRow("W 03", "Housing", None, None, 17.246, 33.731, 0.812)  # ".812", index -1
    assert len(rows) == 4


def test_parse_chunk_fails_loudly_on_a_new_layout() -> None:
    with pytest.raises(LayoutChangedError):
        parse_chunk("const a=[1,2];export default a;")


def test_scrape_follows_the_bundle_to_the_chunk() -> None:
    files = {
        "/catalog": '<script type="module" src="/assets/index-Ab1_c.js"></script>',
        "/assets/index-Ab1_c.js": 'import("./assets/Catalog-Zz9-q.js")',
        "/assets/Catalog-Zz9-q.js": CHUNK,
    }
    transport = httpx2.MockTransport(lambda req: httpx2.Response(200, text=files[req.url.path]))
    assert len(asyncio.run(scrape(transport))) == 4


def test_build_catalog_maps_and_merges_the_seed() -> None:
    catalog = build_catalog(parse_chunk(CHUNK))
    by_slug = {r.slug: r for r in catalog.rows}
    assert catalog.unmapped == {"Mystery": 1}
    assert "x-1" not in by_slug
    assert catalog.both == 2  # 6205 and 6204-2Z are also on the seed list
    assert len(catalog.rows) == 3 + len(SEED) - 2  # 4 scraped - 1 unmapped + seed - overlap

    housing = by_slug["w-03"]
    assert (housing.type, housing.seal, housing.bore_type, housing.source) == ("housing", None, None, "bearingworld")
    assert housing.industries == ("cement", "mining", "paper")

    seeded = by_slug["6204-2z"]  # the seed wins on type, seal and industries, keeps SKF's classification
    assert (seeded.source, seeded.seal, seeded.sealing) == ("both", "shields", "Shields on both sides")
    assert seeded.classification == "Radial deep groove"
    assert seeded.industries == ("food", "paper", "power")
    assert by_slug["22212-ek"].bore_type == "tapered"
    assert by_slug["22212-ek"].source == "bbunikoop"


def test_zero_dimensions_mean_not_applicable() -> None:
    [row] = build_catalog([ScrapedRow("ECY 214", "Accessories", None, None, 0, 135, 45)]).rows[:1]
    assert (row.d, row.outer_d, row.width) == (None, 135, 45)


@pytest.mark.parametrize(
    ("sealing", "code"),
    [
        (None, None),
        ("Without", "open"),
        ("Shield on both sides", "shields"),
        ("Shields on both sides", "shields"),
        ("Contact seal on one side", "one-side"),
        ("Contact seal on both sides", "both"),
        ("Contact seal", "both"),
        ("Gap-type seal", "other"),
    ],
)
def test_seal_codes(sealing: str | None, code: str | None) -> None:
    assert seal_of(sealing) == code


def test_slugify() -> None:
    assert slugify("6205-2RSH") == "6205-2rsh"
    assert slugify("62/22") == "62-22"
    assert slugify("  23222 CCK/W33 ") == "23222-cck-w33"


def test_replace_all_upserts_and_deletes(scratch_db: str) -> None:
    command.upgrade(alembic_config(scratch_db), "head")
    rows = build_catalog(parse_chunk(CHUNK)).rows

    async def run(records: list[ProductRecord]) -> tuple[int, int, int]:
        engine = create_engine(make_settings(database_url=scratch_db))
        try:
            async with create_sessionmaker(engine)() as session:
                c = await PgProductRepository(session).replace_all(records)
                return c.inserted, c.updated, c.deleted
        finally:
            await engine.dispose()

    assert asyncio.run(run(rows)) == (len(rows), 0, 0)
    assert asyncio.run(run(rows)) == (0, 0, 0)  # nothing changed: nothing written

    with psycopg.connect(scratch_db) as conn:
        conn.execute("update products set updated_at = '2020-01-01'")
        conn.execute("insert into specs (slug, found) values ('w-03', true), ('6205', true)")

    changed = [replace(r, width=0.9) if r.slug == "6205" else r for r in rows if r.slug != "w-03"]
    assert asyncio.run(run(changed)) == (0, 1, 1)

    with psycopg.connect(scratch_db) as conn:
        fresh = conn.execute("select slug from products where updated_at > '2020-01-01'").fetchall()
        assert fresh == [("6205",)]  # only the changed row gets a new lastmod
        assert conn.execute("select slug from specs").fetchall() == [("6205",)]  # w-03's specs went with it
