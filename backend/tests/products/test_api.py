from fastapi.testclient import TestClient


def test_search_envelope(catalog: TestClient) -> None:
    body = catalog.get("/api/v1/products", params={"search": "6205", "perPage": 2}).json()
    assert body["meta"] == {"total": 74, "page": 1, "perPage": 2, "pages": 37}
    assert [p["slug"] for p in body["data"]] == ["6205", "6205-n"]


def test_empty_filters_are_ignored(catalog: TestClient) -> None:
    plain = catalog.get("/api/v1/products", params={"perPage": 1}).json()
    blank = catalog.get("/api/v1/products", params={"perPage": 1, "type": "", "dmin": "", "search": ""}).json()
    assert blank == plain


def test_long_search_text_is_cut_not_rejected(catalog: TestClient) -> None:
    assert catalog.get("/api/v1/products", params={"search": "6205" + " " * 200 + "x"}).status_code == 200


def test_invalid_query_values_are_problems(catalog: TestClient) -> None:
    for params in ({"perPage": 0}, {"perPage": 101}, {"sort": "price"}, {"dmin": "abc"}, {"dir": "up"}, {"page": 0}):
        res = catalog.get("/api/v1/products", params=params)
        assert res.status_code == 422, params
        assert res.headers["content-type"] == "application/problem+json"


def test_related_of_a_missing_product_is_404(catalog: TestClient) -> None:
    res = catalog.get("/api/v1/products/does-not-exist/related")
    assert res.status_code == 404
    assert res.json()["code"] == "product_not_found"


def test_sitemap_limit_is_capped(catalog: TestClient) -> None:
    assert catalog.get("/api/v1/products/sitemap", params={"limit": 5001}).status_code == 422


def test_openapi_documents_the_product_contract(catalog: TestClient) -> None:
    spec = catalog.get("/openapi.json").json()
    for path in (
        "/api/v1/products",
        "/api/v1/products/stats",
        "/api/v1/products/sitemap",
        "/api/v1/products/{slug}",
        "/api/v1/products/{slug}/related",
        "/api/v1/industries/{slug}/products",
    ):
        assert path in spec["paths"], path
    product = spec["components"]["schemas"]["Product"]["properties"]
    assert {"slug", "designation", "d", "D", "B", "boreType", "industries"} <= set(product)
    params = {p["name"] for p in spec["paths"]["/api/v1/products"]["get"]["parameters"]}
    assert {"search", "locale", "type", "industry", "dmin", "Dmax", "Bmin", "sort", "dir", "page", "perPage"} <= params
