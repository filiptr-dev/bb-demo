"""Reads SKF's product data for one designation: the JSON that skf.com's own product pages load.

One request per product, sequential, with a pause between requests (see SpecService.scrape). The response is the
PIM record behind https://www.skf.com/group/products/.../productid-<designation>.
"""

import asyncio
import logging
import re
from dataclasses import dataclass, field
from typing import Any, Self
from urllib.parse import quote

import httpx2

from app.modules.specs.schemas import DatasheetRow, DatasheetSection

log = logging.getLogger(__name__)

DETAILS_URL = "https://search.skf.com/prod/search-skfcom/rest/apps/skfcom/searchers/details"
PRODUCT_PAGE = "https://www.skf.com/group{path}/productid-{designation}"
USER_AGENT = "bbunikoop-demo specs import (SKF distributor site; one request at a time)"
RETRY_STATUSES = {429, 500, 502, 503, 504}


class SkfUnavailableError(Exception):
    """SKF kept failing (rate limit, outage) after the retries."""


@dataclass(frozen=True)
class ScrapedSpec:
    c: float | None = None
    c0: float | None = None
    pu: float | None = None
    reference_speed: float | None = None
    limiting_speed: float | None = None
    mass: float | None = None
    performance_class: str | None = None
    factors: dict[str, float] = field(default_factory=dict)
    datasheet: list[DatasheetSection] = field(default_factory=list)
    source_url: str | None = None


def search_key(designation: str) -> str:
    """Same normalisation as products.search_key: "6205-2RSH" → "62052RSH"."""
    return re.sub(r"[^A-Z0-9]", "", designation.upper())


def plain_symbol(html: str | None) -> str | None:
    """SKF writes symbols as HTML: "C<sub>0</sub>" → "C0", "k<sub>r</sub>" → "kr"."""
    return re.sub(r"<[^>]+>", "", html).strip() or None if html else None


def _number(value: Any) -> float | None:
    return float(value) if isinstance(value, int | float) and not isinstance(value, bool) else None


def _row(feature: dict[str, Any]) -> DatasheetRow:
    strings = feature.get("string_values") or []
    rng = feature.get("range_value") or {}
    return DatasheetRow(
        name=feature.get("name") or "",
        symbol=plain_symbol(feature.get("symbol") or feature.get("description")),
        value=_number(feature.get("real_value")) if "real_value" in feature else ("; ".join(strings) or None),
        min=_number(rng.get("min")),
        max=_number(rng.get("max")),
        unit=feature.get("unit"),
        qualifier=feature.get("qualifier"),
    )


# Calculation data rows that have their own column; every other symbol there is a calculation factor.
NAMED = {
    "Basic dynamic load rating": "c",
    "Basic static load rating": "c0",
    "Fatigue load limit": "pu",
    "Reference speed": "reference_speed",
    "Limiting speed": "limiting_speed",
}


def parse(doc: dict[str, Any]) -> ScrapedSpec:
    """One PIM document → the values we keep."""
    datasheet: list[DatasheetSection] = []
    values: dict[str, float | None] = {}
    factors: dict[str, float] = {}
    performance_class: str | None = None

    for category in doc.get("technical_specification") or []:
        rows = [_row(f) for table in category.get("tables") or [] for f in table.get("features") or []]
        datasheet.append(DatasheetSection(title=category.get("category") or "General", rows=rows))
        if category.get("category") != "Calculation data":
            continue
        for r in rows:
            if r.name in NAMED:
                values[NAMED[r.name]] = r.value if isinstance(r.value, float) else None
            elif r.name == "SKF performance class":
                performance_class = r.value if isinstance(r.value, str) else None
            elif r.symbol and isinstance(r.value, float):
                factors[r.symbol] = r.value

    # The summary block: fallback for the load ratings and speeds, and the only place with mass and properties.
    summary = {row.get("id"): row for group in doc.get("technical_data") or [] for row in group.get("rows") or []}
    for key, pim in (("c", "PIM003"), ("c0", "PIM004"), ("reference_speed", "PIM006"), ("limiting_speed", "PIM005")):
        if values.get(key) is None and pim in summary:
            values[key] = _number(summary[pim].get("value"))
    if performance_class is None and "PIM131" in summary:
        performance_class = str(summary["PIM131"].get("value") or "") or None
    properties = next((g for g in doc.get("technical_data") or [] if g.get("name_en") == "Properties"), None)
    if properties:
        rows = [
            DatasheetRow(name=r.get("name") or "", value=r.get("value"), unit=plain_symbol(r.get("unit")))
            for r in properties.get("rows") or []
        ]
        datasheet.append(DatasheetSection(title="Properties", rows=rows))

    path = (doc.get("contentstack_taxonomy") or {}).get("path")
    designation = doc.get("designation") or ""
    return ScrapedSpec(
        c=values.get("c"),
        c0=values.get("c0"),
        pu=values.get("pu"),
        reference_speed=values.get("reference_speed"),
        limiting_speed=values.get("limiting_speed"),
        mass=_number((summary.get("FR_PRODUCT_NET_WEIGHT") or {}).get("value")),
        performance_class=performance_class,
        factors=factors,
        datasheet=datasheet,
        source_url=PRODUCT_PAGE.format(path=path, designation=quote(designation, safe="")) if path else None,
    )


def pick(documents: list[dict[str, Any]], designation: str) -> dict[str, Any] | None:
    """The document for exactly this designation: SKF's search may also return near matches."""
    key = search_key(designation)
    same = [d for d in documents if search_key(d.get("designation") or "") == key]
    exact = [d for d in same if d.get("designation") == designation]
    return next(iter(exact or same), None)


class SkfClient:
    """HTTP access to SKF's product data. Use as `async with SkfClient() as skf: await skf.fetch("6205")`."""

    def __init__(self, transport: httpx2.AsyncBaseTransport | None = None, retries: int = 3, backoff: float = 5.0):
        self.retries = retries
        self.backoff = backoff
        self.client = httpx2.AsyncClient(
            headers={"user-agent": USER_AGENT, "accept": "application/json"}, timeout=30, transport=transport
        )

    async def __aenter__(self) -> Self:
        return self

    async def __aexit__(self, *_: object) -> None:
        await self.client.aclose()

    async def fetch(self, designation: str) -> ScrapedSpec | None:
        """None: SKF has no product with this designation."""
        params = {"designation": designation, "language": "en", "system": "metric", "searcher": "details"}
        for attempt in range(self.retries + 1):
            try:
                res = await self.client.get(DETAILS_URL, params=params | {"locale": "en"})
                if res.status_code not in RETRY_STATUSES:
                    res.raise_for_status()
                    documents = (res.json().get("documentList") or {}).get("documents") or []
                    doc = pick(documents, designation)
                    return parse(doc) if doc else None
                wait = float(res.headers.get("retry-after") or 0) or self.backoff * 2**attempt
                reason = f"HTTP {res.status_code}"
            except (httpx2.TimeoutException, httpx2.TransportError) as exc:
                wait, reason = self.backoff * 2**attempt, type(exc).__name__
            if attempt == self.retries:
                raise SkfUnavailableError(f"{designation}: {reason} after {self.retries + 1} attempts")
            log.warning("skf %s: %s, retrying in %.0f s", designation, reason, wait)
            await asyncio.sleep(wait)
        raise AssertionError("unreachable")
