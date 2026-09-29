"""Reading SKF's product data. The fixtures are real responses (data/skf-*.json, trimmed of marketing text)."""

import asyncio
import json
from pathlib import Path
from typing import Any

import httpx2
import pytest

from app.modules.specs.scraper import SkfClient, SkfUnavailableError, parse, pick, plain_symbol

DATA = Path(__file__).parent / "data"


def response(name: str) -> dict[str, Any]:
    data: dict[str, Any] = json.loads((DATA / f"skf-{name}.json").read_text())
    return data


def document(name: str) -> dict[str, Any]:
    doc: dict[str, Any] = response(name)["documentList"]["documents"][0]
    return doc


def test_parse_a_deep_groove_ball_bearing() -> None:
    spec = parse(document("6205"))
    assert (spec.c, spec.c0, spec.pu) == (14.8, 7.8, 0.335)
    assert (spec.reference_speed, spec.limiting_speed, spec.mass) == (28000, 18000, 0.125)
    assert spec.performance_class == "SKF Explorer"
    assert spec.factors == {"kr": 0.03, "f0": 14}
    assert spec.source_url == (
        "https://www.skf.com/group/products/rolling-bearings/ball-bearings/deep-groove-ball-bearings/productid-6205"
    )
    titles = [s.title for s in spec.datasheet]
    assert titles[:3] == ["Dimensions", "Abutment dimensions", "Calculation data"]
    assert titles[-1] == "Properties"

    dims = {r.symbol: r for r in spec.datasheet[0].rows}
    assert (dims["d"].value, dims["d"].unit) == (25, "mm")
    assert (dims["d1"].value, dims["d1"].qualifier) == (34.35, "≈")
    assert (dims["tΔdmp"].min, dims["tΔdmp"].max) == (-0.008, 0)
    props = {r.name: r.value for r in spec.datasheet[-1].rows}
    assert props["Cage"] == "Sheet metal"


def test_parse_a_spherical_roller_bearing_keeps_its_factors() -> None:
    spec = parse(document("22212-EK"))
    assert (spec.c, spec.c0, spec.pu) == (159, 166, 18.6)
    assert spec.factors == {"e": 0.24, "Y0": 2.8, "Y1": 2.8, "Y2": 4.2}
    assert spec.source_url is not None
    assert spec.source_url.endswith("/spherical-roller-bearings/productid-22212%20EK")
    assert "General" in [s.title for s in spec.datasheet]  # SKF's untitled section


def test_parse_falls_back_to_the_summary_block() -> None:
    doc = document("6205") | {"technical_specification": []}
    spec = parse(doc)
    assert (spec.c, spec.c0, spec.pu, spec.limiting_speed) == (14.8, 7.8, None, 18000)


def test_plain_symbol() -> None:
    assert plain_symbol("C<sub>0</sub>") == "C0"
    assert plain_symbol("r<sub>1,2</sub>") == "r1,2"
    assert plain_symbol("") is None
    assert plain_symbol(None) is None


def test_pick_only_takes_the_same_designation() -> None:
    docs = [{"designation": "6205-2RSH"}, {"designation": "6205"}]
    assert pick(docs, "6205") == {"designation": "6205"}
    assert pick([{"designation": "6205 "}], "6205") == {"designation": "6205 "}  # same search key
    assert pick(docs, "6206") is None


def fetch(handler: Any, designation: str = "6205") -> Any:
    async def go() -> Any:
        async with SkfClient(httpx2.MockTransport(handler), retries=2, backoff=0) as skf:
            return await skf.fetch(designation)

    return asyncio.run(go())


def test_fetch_sends_the_designation_and_parses() -> None:
    seen: list[httpx2.Request] = []

    def handler(req: httpx2.Request) -> httpx2.Response:
        seen.append(req)
        return httpx2.Response(200, json=response("6205"))

    assert fetch(handler).c == 14.8
    assert seen[0].url.params["designation"] == "6205"
    assert "bbunikoop" in seen[0].headers["user-agent"]


def test_fetch_no_hits_is_none() -> None:
    empty: dict[str, Any] = {"documentList": {"documents": []}}
    assert fetch(lambda _: httpx2.Response(200, json=empty), "6205-2RS1") is None


def test_fetch_retries_a_busy_skf() -> None:
    answers = iter([httpx2.Response(503), httpx2.Response(429), httpx2.Response(200, json=response("6205"))])
    assert fetch(lambda _: next(answers)).c == 14.8


def test_fetch_gives_up_after_the_retries() -> None:
    with pytest.raises(SkfUnavailableError, match="HTTP 429 after 3 attempts"):
        fetch(lambda _: httpx2.Response(429))


def test_fetch_does_not_retry_a_client_error() -> None:
    with pytest.raises(httpx2.HTTPStatusError):
        fetch(lambda _: httpx2.Response(400))
