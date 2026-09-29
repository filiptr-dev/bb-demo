import pytest
from fastapi.testclient import TestClient


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
