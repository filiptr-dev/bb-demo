from fastapi.testclient import TestClient

from app.core.pagination import Page, PageParams
from app.core.schemas import ApiModel
from app.main import create_app
from tests.conftest import ORIGIN, make_settings


def test_cors_allows_the_frontend_origin(client: TestClient) -> None:
    res = client.options("/api/v1/health", headers={"Origin": ORIGIN, "Access-Control-Request-Method": "GET"})
    assert res.status_code == 200
    assert res.headers["access-control-allow-origin"] == ORIGIN


def test_cors_rejects_other_origins(client: TestClient) -> None:
    res = client.get("/api/v1/health", headers={"Origin": "https://evil.example"})
    assert "access-control-allow-origin" not in res.headers


def test_openapi_contract(client: TestClient) -> None:
    spec = client.get("/openapi.json").json()
    assert spec["info"]["title"] == "B&B Unikoop API"
    assert "/api/v1/health" in spec["paths"]
    assert "Problem" in spec["components"]["schemas"]
    assert client.get("/docs").status_code == 200


def test_settings_normalise_urls_and_origins() -> None:
    s = make_settings(
        database_url="postgres://u:p@host:5432/db",
        cors_allowed_origins="https://a.example/, http://localhost:3000 ,",
    )
    assert s.database_url == "postgresql+psycopg://u:p@host:5432/db"
    assert s.cors_allowed_origins == ["https://a.example", "http://localhost:3000"]


class Row(ApiModel):
    slug: str


def test_page_envelope() -> None:
    params = PageParams(page=2, per_page=10)
    assert params.offset == 10
    page = Page[Row].of([Row(slug="6205")], total=21, params=params)
    assert page.model_dump() == {
        "data": [{"slug": "6205"}],
        "meta": {"total": 21, "page": 2, "perPage": 10, "pages": 3},
    }
    assert Page[Row].of([], total=0, params=PageParams()).meta.pages == 0


def test_cors_origin_regex_allows_preview_deployments() -> None:
    app = create_app(make_settings(cors_allowed_origin_regex=r"https://bb-demo-[a-z0-9-]+\.vercel\.app"))
    with TestClient(app) as client:
        ok = client.get("/api/v1/health/live", headers={"Origin": "https://bb-demo-git-main-x.vercel.app"})
        bad = client.get("/api/v1/health/live", headers={"Origin": "https://bb-demo.evil.app"})
    assert ok.headers["access-control-allow-origin"] == "https://bb-demo-git-main-x.vercel.app"
    assert "access-control-allow-origin" not in bad.headers
