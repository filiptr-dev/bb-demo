from dataclasses import asdict
from datetime import datetime
from typing import Protocol

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.specs.models import Spec
from app.modules.specs.schemas import ProductSpecs
from app.modules.specs.scraper import ScrapedSpec


class SpecRepository(Protocol):
    async def get(self, slug: str) -> ProductSpecs | None: ...
    async def fetched(self) -> dict[str, datetime]: ...
    async def save(self, slug: str, spec: ScrapedSpec | None) -> None: ...
    async def counts(self) -> tuple[int, int]: ...


S = Spec


class PgSpecRepository:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def get(self, slug: str) -> ProductSpecs | None:
        row = await self.session.scalar(select(S).where(S.slug == slug, S.found))
        if row is None:
            return None
        return ProductSpecs.model_validate(
            {c.key: getattr(row, c.key) for c in S.__table__.columns if c.key != "found"}
        )

    async def fetched(self) -> dict[str, datetime]:
        """slug → when it was last asked for, found or not."""
        return {slug: at for slug, at in await self.session.execute(select(S.slug, S.fetched_at))}

    async def save(self, slug: str, spec: ScrapedSpec | None) -> None:
        """Upsert one product's data (None = SKF has none) and commit, so an interrupted scrape keeps its progress."""
        values = asdict(spec or ScrapedSpec())
        values["datasheet"] = [s.model_dump(mode="json") for s in (spec.datasheet if spec else [])]
        stmt = insert(S).values(slug=slug, found=spec is not None, fetched_at=func.now(), **values)
        stmt = stmt.on_conflict_do_update(
            index_elements=[S.slug], set_={k: stmt.excluded[k] for k in (*values, "found", "fetched_at")}
        )
        await self.session.execute(stmt)
        await self.session.commit()

    async def counts(self) -> tuple[int, int]:
        """(found, not found)."""
        row = (await self.session.execute(select(func.count().filter(S.found), func.count().filter(~S.found)))).one()
        return row[0], row[1]
