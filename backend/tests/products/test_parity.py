"""The Python products module against golden output recorded from the TypeScript query layer it replaces
(frontend/server/products.ts), on the same data. Any difference is a behaviour change on the website."""

import hashlib
import json
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import pytest
from fastapi.testclient import TestClient

GOLDEN = json.loads((Path(__file__).parent / "data" / "golden.json").read_text(encoding="utf-8"))
RANGE_KEYS = {"d": ("dmin", "dmax"), "D": ("Dmin", "Dmax"), "B": ("Bmin", "Bmax")}


def search_params(args: dict[str, Any]) -> list[tuple[str, str | int | float | bool | None]]:
    """The TypeScript ProductQuery → the API's query string."""
    params: list[tuple[str, str | int | float | bool | None]] = []
    renames = {"q": "search", "limit": "perPage"}
    for key, value in args.items():
        if key == "industries":
            params += [("industry", i) for i in value]
        elif key == "ranges":
            for dim, bounds in value.items():
                params += [(k, v) for k, v in zip(RANGE_KEYS[dim], bounds, strict=True) if v is not None]
        else:
            params.append((renames.get(key, key), value))
    return params


def js_iso(value: str) -> str:
    """An API timestamp in JavaScript's Date.toISOString() form (milliseconds, Z), as the golden files have it."""
    dt = datetime.fromisoformat(value).astimezone(UTC)
    return dt.strftime("%Y-%m-%dT%H:%M:%S.") + f"{dt.microsecond // 1000:03d}Z"


@pytest.mark.parametrize("name", GOLDEN["search"])
def test_search(catalog: TestClient, name: str) -> None:
    case = GOLDEN["search"][name]
    res = catalog.get("/api/v1/products", params=search_params(case["args"]))
    assert res.status_code == 200, res.text
    body = res.json()
    expected = case["result"]
    assert (body["meta"]["total"], body["meta"]["page"]) == (expected["total"], expected["page"])
    # The TypeScript rows also carried the window count as a `total` column; the API keeps it in meta only.
    assert body["data"] == [{k: v for k, v in row.items() if k != "total"} for row in expected["rows"]]


@pytest.mark.parametrize("slug", GOLDEN["product"])
def test_product(catalog: TestClient, slug: str) -> None:
    res = catalog.get(f"/api/v1/products/{slug}")
    expected = GOLDEN["product"][slug]
    if expected is None:
        assert res.status_code == 404
        assert res.json()["code"] == "product_not_found"
    else:
        assert res.json() == expected


@pytest.mark.parametrize("slug", GOLDEN["related"])
def test_related(catalog: TestClient, slug: str) -> None:
    assert catalog.get(f"/api/v1/products/{slug}/related").json()["data"] == GOLDEN["related"][slug]


@pytest.mark.parametrize("industry", GOLDEN["byIndustry"])
def test_by_industry(catalog: TestClient, industry: str) -> None:
    res = catalog.get(f"/api/v1/industries/{industry}/products", params={"limit": 24})
    assert res.json()["data"] == GOLDEN["byIndustry"][industry]


def test_stats(catalog: TestClient) -> None:
    body = catalog.get("/api/v1/products/stats").json()
    assert body["count"] == GOLDEN["count"]
    assert js_iso(body["updatedAt"]) == GOLDEN["updatedAt"]


@pytest.mark.parametrize("offset", GOLDEN["sitemap"])
def test_sitemap(catalog: TestClient, offset: str) -> None:
    rows = catalog.get("/api/v1/products/sitemap", params={"offset": offset, "limit": 5000}).json()["data"]
    expected = GOLDEN["sitemap"][offset]
    assert len(rows) == expected["n"]
    assert [r["slug"] for r in rows[:5]] == expected["first"]
    digest = hashlib.sha256("\n".join(f"{r['slug']} {js_iso(r['updatedAt'])}" for r in rows).encode()).hexdigest()
    assert digest == expected["sha256"]
