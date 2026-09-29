from fastapi.testclient import TestClient

from app.main import create_app
from tests.conftest import make_settings


def test_health_checks_the_database(client: TestClient) -> None:
    res = client.get("/api/v1/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok", "database": "ok"}


def test_health_reports_an_unreachable_database_as_503() -> None:
    # Nothing listens on port 1, so the connection is refused straight away.
    app = create_app(make_settings(database_url="postgresql://postgres:postgres@127.0.0.1:1/none"))
    with TestClient(app) as client:
        res = client.get("/api/v1/health")
    assert res.status_code == 503
    assert res.headers["content-type"] == "application/problem+json"
    assert res.json()["code"] == "database_unavailable"


def test_liveness_does_not_need_the_database() -> None:
    app = create_app(make_settings(database_url="postgresql://postgres:postgres@127.0.0.1:1/none"))
    with TestClient(app) as client:
        res = client.get("/api/v1/health/live")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}
