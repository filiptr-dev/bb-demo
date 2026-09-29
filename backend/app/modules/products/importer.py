"""Catalog import: the SKF range as listed on bearingworld.com.sa, merged with our own seed list (seed.py).

bearingworld.com.sa is a client-side app with the whole catalog (~15k rows) inlined in its Catalog chunk as compact
tuples: [designation, classificationIdx, boreTypeIdx, sealingIdx, d, D, B]. We fetch the page, follow the bundle to
that chunk and read just the array literals (JSON, apart from numbers written as `.5`). No per-page crawling.

Run it with `python -m app.cli products-import` (port of the old frontend/scripts/import-products.mts).
"""

import json
import re
from collections import Counter
from dataclasses import dataclass, field

import httpx2

from app.modules.products.seed import SEED

ORIGIN = "https://bearingworld.com.sa"
USER_AGENT = "bbunikoop-demo catalog import"


class LayoutChangedError(Exception):
    """bearingworld changed its bundle; the regexes below need updating."""


@dataclass(frozen=True)
class ScrapedRow:
    designation: str
    classification: str | None
    bore_type: str | None
    sealing: str | None
    d: float
    outer_d: float
    width: float


@dataclass(frozen=True)
class ProductRecord:
    """One row for the products table, as the importer writes it."""

    slug: str
    designation: str
    type: str
    classification: str | None
    bore_type: str | None
    seal: str | None
    sealing: str | None
    d: float | None
    outer_d: float | None
    width: float | None
    industries: tuple[str, ...]
    source: str  # bbunikoop | bearingworld | both
    brand: str = "SKF"


@dataclass
class Catalog:
    rows: list[ProductRecord]
    scraped: int
    both: int  # seed rows also found in the scrape
    unmapped: Counter[str] = field(default_factory=Counter)  # skipped SKF classifications

    def by_type(self) -> Counter[str]:
        return Counter(r.type for r in self.rows)


def slugify(designation: str) -> str:
    """ "6205-2RSH" → "6205-2rsh", "62/22" → "62-22". The URL key of a product (frontend: /catalog/<slug>)."""
    return re.sub(r"[^a-z0-9]+", "-", designation.lower()).strip("-")


def _find(src: str, pattern: str, what: str) -> str:
    m = re.search(pattern, src)
    if not m:
        raise LayoutChangedError(f"bearingworld layout changed: {what} not found")
    return m.group(1)


def parse_chunk(chunk: str) -> list[ScrapedRow]:
    """`...,$=[classifications],z=[bore types],C1=[sealings],i1=[[tuples]];function f(P){return{designation:P[0],...`"""
    decoder = _find(chunk, r"function (\w+)\(\w\)\{return\{designation:", "row decoder")
    end = chunk.index(f";function {decoder}(")
    names = _find(chunk[end:], r"classification:\w+\[1\]>=0\?([\w$]+)\[", "classification table")
    start = chunk.rfind(f",{names}=[", 0, end) + 1
    if start == 0:
        raise LayoutChangedError("bearingworld layout changed: lookup tables not found")
    # "a=[...],b=[...]" → the four array literals, in order
    literals = re.split(r",[\w$]+=(?=\[)", "," + chunk[start:end])[1:]
    if len(literals) != 4:
        raise LayoutChangedError(f"bearingworld layout changed: expected 4 arrays, found {len(literals)}")
    classes, bores, seals, rows = (json.loads(re.sub(r"(?<=[,\[])(-?)\.(?=\d)", r"\g<1>0.", s)) for s in literals)
    if not rows or not isinstance(rows[0], list):
        raise LayoutChangedError("bearingworld layout changed: product tuples not found")

    def pick(table: list[str], i: int) -> str | None:
        return table[i] if 0 <= i < len(table) else None

    return [
        ScrapedRow(designation.strip(), pick(classes, c), pick(bores, b), pick(seals, s), d, outer_d, width)
        for designation, c, b, s, d, outer_d, width in rows
    ]


async def scrape(transport: httpx2.AsyncBaseTransport | None = None) -> list[ScrapedRow]:
    async with httpx2.AsyncClient(
        base_url=ORIGIN, headers={"user-agent": USER_AGENT}, timeout=60, transport=transport
    ) as client:

        async def get(path: str) -> str:
            res = await client.get(path)
            res.raise_for_status()
            return res.text

        html = await get("/catalog")
        entry = await get(_find(html, r'src="(/assets/index-[\w-]+\.js)"', "entry bundle"))
        chunk = await get("/" + _find(entry, r"(assets/Catalog-[\w-]+\.js)", "Catalog chunk"))
    return parse_chunk(chunk)


# SKF classification → app type slug (frontend lib/domain/taxonomy.ts bearingTypes).
TYPE_OF = {
    "Radial deep groove": "deep-groove",
    "Angular contact radial": "angular-contact",
    "Angular contact thrust": "angular-contact",
    "Self-aligning": "self-aligning",
    "Spherical radial": "spherical-roller",
    "Spherical thrust": "spherical-roller",
    "Tapered radial": "tapered-roller",
    "Tapered thrust": "tapered-roller",
    "Cylindrical radial": "cylindrical-roller",
    "Thrust collar (L- shaped)": "cylindrical-roller",
    "Thrust": "thrust-ball",
    "Aligning seat washer (thrust ball bearing)": "thrust-ball",
    "Bearing unit": "unit",
    "Housing unit": "unit",
    "Bearing only": "unit",  # Y-bearing inserts
    "Toroidal radial": "toroidal",
    "Needle radial": "needle-roller",
    "Needle thrust": "needle-roller",
    "Radial needle roller/thrust ball or Radial needle roller/thrust roller": "needle-roller",
    "Yoke-type": "track-runner",
    "Stud-type": "track-runner",
    "Bushing": "plain",
    "Rod end": "plain",
    "Housing": "housing",
    "Sealing": "housing",  # housing seals (TSN …)
    "Accessories": "housing",  # locating rings, end covers
    "Tapered sleeve": "sleeve-nut",
    "Lock nut and locking device": "sleeve-nut",
    "Seal": "seal",
}

# The source has no industry data. Demo default per type, so industry pages and filters cover the whole range.
INDUSTRIES_OF = {
    "deep-groove": ("food", "power", "paper"),
    "angular-contact": ("power", "chemical", "paper"),
    "self-aligning": ("paper", "food", "recycling"),
    "spherical-roller": ("cement", "mining", "metallurgy", "paper"),
    "tapered-roller": ("mining", "metallurgy", "power"),
    "cylindrical-roller": ("power", "metallurgy", "cement"),
    "thrust-ball": ("chemical", "power"),
    "unit": ("food", "recycling"),
    "toroidal": ("paper", "cement", "mining"),
    "needle-roller": ("chemical", "food"),
    "track-runner": ("food", "recycling", "metallurgy"),
    "plain": ("metallurgy", "mining", "recycling"),
    "housing": ("cement", "mining", "paper"),
    "sleeve-nut": ("cement", "mining", "paper"),
    "seal": ("food", "chemical"),
}


def seal_of(sealing: str | None) -> str | None:
    if not sealing:
        return None
    if sealing == "Without":
        return "open"
    if re.fullmatch(r"Shields? on both sides", sealing):
        return "shields"
    if "one side" in sealing:
        return "one-side"
    if "both sides" in sealing or sealing.startswith("Contact"):
        return "both"
    return "other"  # gap seals, special


def bore_of(bore_type: str | None) -> str | None:
    return {"Tapered": "tapered", "Cylindrical": "cylindrical"}.get(bore_type or "")


def build_catalog(scraped: list[ScrapedRow]) -> Catalog:
    unmapped: Counter[str] = Counter()
    rows: dict[str, ProductRecord] = {}
    for s in scraped:
        type_ = TYPE_OF.get(s.classification or "")
        if type_ is None:
            unmapped[s.classification or "(none)"] += 1
            continue
        slug = slugify(s.designation)
        rows[slug] = ProductRecord(
            slug=slug,
            designation=s.designation,
            type=type_,
            classification=s.classification,
            bore_type=bore_of(s.bore_type),
            seal=seal_of(s.sealing),
            sealing=s.sealing,
            d=s.d or None,  # 0 = not applicable (housings, end covers)
            outer_d=s.outer_d or None,
            width=s.width or None,
            industries=INDUSTRIES_OF[type_],
            source="bearingworld",
        )
    # Our curated rows win on type, seal and industries; the scraped row adds its SKF classification and sealing.
    both = 0
    for designation, type_, d, outer_d, width, seal, industries in SEED:
        slug = slugify(designation)
        hit = rows.get(slug)
        both += hit is not None
        rows[slug] = ProductRecord(
            slug=slug,
            designation=designation,
            type=type_,
            classification=hit.classification if hit else None,
            bore_type="tapered" if re.search(r"EK|CCK", designation) else "cylindrical",
            seal=seal,
            sealing=hit.sealing if hit else None,
            d=d,
            outer_d=outer_d,
            width=width,
            industries=industries,
            source="both" if hit else "bbunikoop",
        )
    return Catalog(rows=list(rows.values()), scraped=len(scraped), both=both, unmapped=unmapped)
