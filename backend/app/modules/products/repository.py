from datetime import datetime
from typing import Any, Protocol

from sqlalchemy import ColumnElement, and_, any_, case, false, func, literal, or_, select, true
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.products.models import Product as ProductRow
from app.modules.products.schemas import Product, SitemapRow, SortKey
from app.modules.products.search import DimsQuery, SearchCriteria, TextQuery, WordMatch


class ProductRepository(Protocol):
    async def search(self, c: SearchCriteria) -> tuple[list[Product], int]: ...
    async def get(self, slug: str) -> Product | None: ...
    async def related(self, product: Product, limit: int) -> list[Product]: ...
    async def by_industry(self, industry: str, limit: int) -> list[Product]: ...
    async def stats(self) -> tuple[int, datetime | None]: ...
    async def sitemap(self, offset: int, limit: int) -> list[SitemapRow]: ...


P = ProductRow
COLUMNS = (
    P.slug,
    P.designation,
    P.brand,
    P.type,
    P.classification,
    P.d,
    P.outer_d,
    P.width,
    P.seal,
    P.bore_type,
    P.industries,
)
# Numeric-aware designation order ("6205" < "6210" < "62010"), from the natural_sort collation (migration 0001).
NATURAL = P.designation.collate("natural_sort")
SORT_COLUMNS: dict[SortKey, str] = {
    "designation": "designation",
    "type": "type",
    "boreType": "bore_type",
    "seal": "seal",
    "d": "d",
    "D": "outer_d",
    "B": "width",
}
RANGE_COLUMNS = {"d": P.d, "D": P.outer_d, "B": P.width}


def _product(row: Any) -> Product:
    return Product.model_validate(dict(row._mapping))


def _word_condition(w: WordMatch) -> ColumnElement[bool]:
    return or_(
        P.brand.ilike(w.word),
        P.classification.ilike(f"%{w.word}%"),
        P.type.in_(w.types),
        P.seal.in_(w.seals),
        P.bore_type.in_(w.bores),
        P.industries.overlap(w.industries) if w.industries else false(),
    )


def _score(query: TextQuery | DimsQuery | None) -> tuple[ColumnElement[Any], ColumnElement[bool]]:
    """(score, match). Ranking: exact designation > prefix > contains > dimension > word match."""
    if query is None:
        return literal(1), true()
    if isinstance(query, DimsQuery):
        conds = [P.d == query.d, P.outer_d == query.outer_d]
        if query.width is not None:
            conds.append(P.width == query.width)
        return literal(50), and_(*conds)

    parts: list[ColumnElement[Any]] = []
    if key := query.key:
        parts.append(
            case(
                (P.search_key == key, 100),
                (P.search_key.like(f"{key}%"), 80 - func.least(func.length(P.search_key) - len(key), 20)),
                (P.search_key.like(f"%{key}%"), 60),
                else_=0,
            )
        )
        if query.number is not None:
            n = query.number
            parts.append(case((P.d == n, 40), (or_(P.outer_d == n, P.width == n), 30), else_=0))
    parts.append(case((and_(*[_word_condition(w) for w in query.words]), 10), else_=0))
    return (parts[0] if len(parts) == 1 else func.greatest(*parts)), true()


class PgProductRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def search(self, c: SearchCriteria) -> tuple[list[Product], int]:
        score, match = _score(c.query)
        where = [match]
        if c.type:
            where.append(P.type == c.type)
        if c.bore:
            where.append(P.bore_type == c.bore)
        if c.seal:
            where.append(P.seal == c.seal)
        if c.industries:
            where.append(P.industries.overlap(c.industries))
        for dim, (lo, hi) in c.ranges.items():
            if lo is not None:
                where.append(RANGE_COLUMNS[dim] >= lo)
            if hi is not None:
                where.append(RANGE_COLUMNS[dim] <= hi)

        scored = select(*COLUMNS, score.label("score")).where(*where).subquery("r")
        r = scored.c
        natural = r.designation.collate("natural_sort")
        if c.sort:
            col = natural if c.sort == "designation" else r[SORT_COLUMNS[c.sort]]
            order = [(col.desc() if c.descending else col.asc()).nulls_last(), natural]
        else:
            order = [r.score.desc(), natural]
        stmt = (
            select(*[r[col.key] for col in COLUMNS], func.count().over().label("total"))
            .where(r.score > 0)
            .order_by(*order)
            .limit(c.limit)
            .offset(c.offset)
        )
        rows = (await self.session.execute(stmt)).all()
        return [_product(row) for row in rows], (rows[0].total if rows else 0)

    async def get(self, slug: str) -> Product | None:
        row = (await self.session.execute(select(*COLUMNS).where(P.slug == slug))).first()
        return _product(row) if row else None

    async def related(self, product: Product, limit: int) -> list[Product]:
        """Same type, closest bore first."""
        stmt = (
            select(*COLUMNS)
            .where(P.type == product.type, P.slug != product.slug)
            .order_by(func.abs(func.coalesce(P.d, 0) - (product.d or 0)), NATURAL)
            .limit(limit)
        )
        return [_product(row) for row in await self.session.execute(stmt)]

    async def by_industry(self, industry: str, limit: int) -> list[Product]:
        """Our own curated picks first, then the scraped catalog."""
        stmt = (
            select(*COLUMNS)
            .where(literal(industry) == any_(P.industries))
            .order_by(P.source == "bearingworld", NATURAL)
            .limit(limit)
        )
        return [_product(row) for row in await self.session.execute(stmt)]

    async def stats(self) -> tuple[int, datetime | None]:
        row = (await self.session.execute(select(func.count(), func.max(P.updated_at)))).one()
        return row[0], row[1]

    async def sitemap(self, offset: int, limit: int) -> list[SitemapRow]:
        stmt = select(P.slug, P.updated_at).order_by(NATURAL).offset(offset).limit(limit)
        return [SitemapRow(slug=slug, updated_at=updated) for slug, updated in await self.session.execute(stmt)]
