import pytest
from fastapi.testclient import TestClient

Params = dict[str, str | int | float]


def test_decode(catalog: TestClient) -> None:
    body = catalog.get("/api/v1/catalog/decode", params={"designation": " 6205-2RSH/C3 "}).json()
    assert body == {
        "designation": "6205-2RSH/C3",
        "segments": [
            {"token": "62", "kind": "series", "id": "deep-groove", "boreMm": None},
            {"token": "05", "kind": "bore", "id": None, "boreMm": 25},
            {"token": "2RSH", "kind": "suffix", "id": "2rsh", "boreMm": None},
            {"token": "C3", "kind": "suffix", "id": "c3", "boreMm": None},
        ],
        "boreMm": 25,
    }


def test_decode_nothing_readable(catalog: TestClient) -> None:
    assert catalog.get("/api/v1/catalog/decode", params={"designation": "/"}).json()["segments"] == []
    for params in ({}, {"designation": ""}, {"designation": "x" * 101}):
        res = catalog.get("/api/v1/catalog/decode", params=params)
        assert res.status_code == 422
        assert res.json()["code"] == "validation_failed"


def test_greases(catalog: TestClient) -> None:
    body = catalog.get("/api/v1/catalog/greases").json()
    assert body["basic"][0] == {"condition": "allPurpose", "code": "LGMT 2"}
    assert body["chart"][0]["tempC"] == [-30, 120]
    assert len(body["compatibility"]["matrix"]) == len(body["compatibility"]["groups"]) == 12


@pytest.mark.usefixtures("specs_db")
def test_rating_life_of_a_product(catalog: TestClient) -> None:
    res = catalog.get("/api/v1/catalog/rating-life", params={"slug": "6205", "fr": 2, "fa": 1, "rpm": 1500})
    assert res.status_code == 200
    body = res.json()
    assert (body["designation"], body["type"], body["c"]) == ("6205", "deep-groove", 14.8)
    assert body["p"] == pytest.approx(2.4858, abs=1e-4)  # uses f0 and C0 from the SKF data
    assert body["l10"] == pytest.approx((14.8 / body["p"]) ** 3)
    assert body["l10Hours"] == pytest.approx(body["l10"] * 1e6 / (60 * 1500))
    assert body["lnmHours"] == body["l10Hours"]  # 90 %: a1 = 1
    assert body["warnings"] == []


@pytest.mark.usefixtures("specs_db")
def test_rating_life_warnings(catalog: TestClient) -> None:
    body = catalog.get("/api/v1/catalog/rating-life", params={"slug": "6205", "fr": 8, "rpm": 20000}).json()
    assert body["warnings"] == ["heavy_load", "above_limiting_speed"]  # 8 > 0.5·14.8; SKF limit 18,000 r/min


def test_rating_life_without_a_product(catalog: TestClient) -> None:
    params: Params = {"type": "spherical-roller", "c": 159, "fr": 15.6, "rpm": 500, "reliability": 99}
    body = catalog.get("/api/v1/catalog/rating-life", params=params).json()
    assert body["designation"] is None
    assert body["lnm"] == pytest.approx(0.25 * (159 / 15.6) ** (10 / 3))
    res = catalog.get("/api/v1/catalog/rating-life", params=params | {"fa": 1})  # no factors for an axial load
    assert (res.status_code, res.json()["code"]) == (422, "load_case_unsupported")


@pytest.mark.usefixtures("specs_db")
@pytest.mark.parametrize(
    ("params", "status", "code"),
    [
        ({"slug": "6206", "fr": 1, "rpm": 1000}, 404, "specs_not_found"),
        ({"slug": "nope", "fr": 1, "rpm": 1000}, 404, "product_not_found"),
        ({"slug": "720120-12", "fr": 1, "rpm": 1000}, 422, "rating_life_unsupported"),  # a housing
        ({"type": "deep-groove", "fr": 1, "rpm": 1000}, 422, "validation_failed"),  # no c
        ({"slug": "6205", "rpm": 1000}, 422, "validation_failed"),  # no load
        ({"slug": "6205", "fr": 1, "rpm": 0}, 422, "validation_failed"),
        ({"slug": "6205", "fr": 1, "rpm": 1000, "reliability": 93}, 422, "validation_failed"),
    ],
)
def test_rating_life_errors(catalog: TestClient, params: Params, status: int, code: str) -> None:
    res = catalog.get("/api/v1/catalog/rating-life", params=params)
    assert (res.status_code, res.json()["code"]) == (status, code)


def test_relubrication_of_a_product(catalog: TestClient) -> None:
    body = catalog.get("/api/v1/catalog/relubrication", params={"slug": "6205", "rpm": 3000, "temperature": 85}).json()
    assert (body["designation"], body["type"], body["d"], body["k"]) == ("6205", "deep-groove", 25, 10)
    assert body["baseHours"] == pytest.approx(8333.33, abs=0.01)
    assert body["hours"] == pytest.approx(body["baseHours"] / 2)
    assert (body["greaseSideG"], body["greaseCenterG"]) == (pytest.approx(3.9), pytest.approx(1.56))


def test_relubrication_without_a_product(catalog: TestClient) -> None:
    params: Params = {"type": "spherical-roller", "d": 60, "rpm": 1500, "verticalShaft": "true"}
    body = catalog.get("/api/v1/catalog/relubrication", params=params).json()
    assert body["hours"] == pytest.approx(body["baseHours"] / 2)
    assert body["greaseSideG"] is None


@pytest.mark.parametrize(
    ("params", "status", "code"),
    [
        ({"slug": "720120-12", "rpm": 1000}, 422, "relubrication_unsupported"),
        ({"type": "deep-groove", "d": 100, "rpm": 20000}, 422, "relubrication_out_of_range"),
        ({"type": "deep-groove", "rpm": 1000}, 422, "validation_failed"),
        ({"slug": "nope", "rpm": 1000}, 404, "product_not_found"),
    ],
)
def test_relubrication_errors(catalog: TestClient, params: Params, status: int, code: str) -> None:
    res = catalog.get("/api/v1/catalog/relubrication", params=params)
    assert (res.status_code, res.json()["code"]) == (status, code)
