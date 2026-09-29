import asyncio
import json

import httpx2

from app.core.revalidator import Revalidator
from tests.conftest import make_settings

URL = "https://site.test/api/revalidate"


def revalidator(handler: object = None, **settings: str | None) -> Revalidator:
    values = {"frontend_revalidate_url": URL, "revalidate_secret": "s3cret"} | settings
    transport = httpx2.MockTransport(handler) if handler else None  # type: ignore[arg-type]
    return Revalidator(make_settings(**values), transport)


def test_posts_the_tags_with_the_secret() -> None:
    seen: list[httpx2.Request] = []

    def handler(req: httpx2.Request) -> httpx2.Response:
        seen.append(req)
        return httpx2.Response(200, json={"revalidated": ["products"]})

    assert asyncio.run(revalidator(handler).revalidate("products", "product:6205"))
    assert str(seen[0].url) == URL
    assert seen[0].headers["x-revalidate-secret"] == "s3cret"
    assert json.loads(seen[0].content) == {"tags": ["products", "product:6205"]}


def test_not_configured_is_skipped() -> None:
    r = revalidator(frontend_revalidate_url=None)
    assert not r.configured
    assert not asyncio.run(r.revalidate("products"))


def test_a_failing_frontend_is_logged_not_raised() -> None:
    assert not asyncio.run(revalidator(lambda _: httpx2.Response(401)).revalidate("products"))

    def down(_: httpx2.Request) -> httpx2.Response:
        raise httpx2.ConnectError("refused")

    assert not asyncio.run(revalidator(down).revalidate("products"))
