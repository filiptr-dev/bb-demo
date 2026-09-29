import asyncio
import logging
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import UTC, datetime, timedelta

from app.core.errors import ApiError
from app.modules.products.service import ProductService
from app.modules.specs.repository import SpecRepository
from app.modules.specs.schemas import ProductSpecs
from app.modules.specs.scraper import SkfClient, SkfUnavailableError

log = logging.getLogger(__name__)

MAX_FAILURES_IN_A_ROW = 5  # SKF is down or blocking us: stop instead of hammering it


@dataclass
class ScrapeReport:
    found: int = 0
    missing: int = 0  # SKF has no data for the designation
    skipped: int = 0  # fetched recently enough
    failed: list[str] = field(default_factory=list)
    stopped: bool = False  # gave up after MAX_FAILURES_IN_A_ROW

    @property
    def changed(self) -> bool:
        return self.found + self.missing > 0


class SpecService:
    """The specs module's public API (the assistant's datasheet answers use it later)."""

    def __init__(self, repo: SpecRepository, products: ProductService) -> None:
        self.repo = repo
        self.products = products

    async def get(self, slug: str) -> ProductSpecs:
        specs = await self.repo.get(slug)
        if specs is None:
            raise ApiError(404, "specs_not_found", f"No technical data for '{slug}'.")
        return specs

    async def counts(self) -> tuple[int, int]:
        return await self.repo.counts()

    async def scrape(
        self,
        skf: SkfClient,
        *,
        stocked_only: bool = True,
        max_age: timedelta | None = None,
        limit: int | None = None,
        delay: float = 1.0,
        only: list[str] | None = None,
        progress: Callable[[int, int, str, str], None] | None = None,
    ) -> ScrapeReport:
        """Fetch SKF data for the products that have none yet (or older than `max_age`), one at a time with `delay`
        seconds between requests. `only` = these designations, regardless of age."""
        fetched = await self.repo.fetched()
        cutoff = datetime.now(UTC) - max_age if max_age is not None else None
        targets = await self.products.designations(stocked_only=stocked_only and not only)
        report = ScrapeReport()
        if only:
            wanted = {d.upper() for d in only}
            targets = [t for t in targets if t[1].upper() in wanted]
        else:
            todo = [t for t in targets if t[0] not in fetched or (cutoff is not None and fetched[t[0]] < cutoff)]
            report.skipped = len(targets) - len(todo)
            targets = todo
        targets = targets[:limit] if limit is not None else targets

        failures_in_a_row = 0
        for i, (slug, designation) in enumerate(targets):
            if i:
                await asyncio.sleep(delay)
            try:
                spec = await skf.fetch(designation)
            except SkfUnavailableError as exc:
                log.warning("%s", exc)
                report.failed.append(designation)
                failures_in_a_row += 1
                if failures_in_a_row >= MAX_FAILURES_IN_A_ROW:
                    report.stopped = True
                    break
                continue
            failures_in_a_row = 0
            await self.repo.save(slug, spec)
            if spec is None:
                report.missing += 1
            else:
                report.found += 1
            if progress:
                progress(i + 1, len(targets), designation, "found" if spec else "not on skf.com")
        return report
