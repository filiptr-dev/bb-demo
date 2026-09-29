import json
from collections.abc import Iterator
from pathlib import Path

import psycopg
import pytest
from fastapi.testclient import TestClient

from app.modules.specs.scraper import parse

DATA = Path(__file__).parent / "data"


@pytest.fixture(scope="module")
def specs_db(catalog_db: str) -> Iterator[None]:
    spec = parse(json.loads((DATA / "skf-6205.json").read_text())["documentList"]["documents"][0])
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


@pytest.mark.usefixtures("specs_db")
def test_specs_of_a_product(catalog: TestClient) -> None:
    body = catalog.get("/api/v1/products/6205/specs").json()
    assert {k: body[k] for k in ("slug", "c", "c0", "pu", "referenceSpeed", "limitingSpeed", "mass")} == {
        "slug": "6205",
        "c": 14.8,
        "c0": 7.8,
        "pu": 0.335,
        "referenceSpeed": 28000,
        "limitingSpeed": 18000,
        "mass": 0.125,
    }
    assert body["factors"] == {"kr": 0.03, "f0": 14}
    assert body["datasheet"][0]["title"] == "Dimensions"
    assert body["datasheet"][0]["rows"][0] == {
        "name": "Bore diameter",
        "symbol": "d",
        "value": 25,
        "min": None,
        "max": None,
        "unit": "mm",
        "qualifier": None,
    }
    assert body["sourceUrl"].endswith("/productid-6205")


@pytest.mark.usefixtures("specs_db")
def test_no_specs_is_a_404_problem(catalog: TestClient) -> None:
    for slug in ("6205-2rs1", "6206", "does-not-exist"):  # SKF has none / never fetched / no such product
        res = catalog.get(f"/api/v1/products/{slug}/specs")
        assert res.status_code == 404
        assert res.json()["code"] == "specs_not_found"


def test_openapi_documents_specs(catalog: TestClient) -> None:
    spec = catalog.get("/openapi.json").json()
    assert "/api/v1/products/{slug}/specs" in spec["paths"]
    props = spec["components"]["schemas"]["ProductSpecs"]["properties"]
    assert {"c", "c0", "pu", "referenceSpeed", "limitingSpeed", "mass", "factors", "datasheet", "sourceUrl"} <= set(
        props
    )
