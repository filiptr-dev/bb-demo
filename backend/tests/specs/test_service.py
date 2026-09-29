"""SpecService.scrape: which products it asks SKF about, and when it stops. Fakes for the repository and SKF."""

import asyncio
from datetime import UTC, datetime, timedelta
from typing import Any, cast

from app.modules.products.service import ProductService
from app.modules.specs.schemas import ProductSpecs
from app.modules.specs.scraper import ScrapedSpec, SkfClient, SkfUnavailableError
from app.modules.specs.service import MAX_FAILURES_IN_A_ROW, SpecService

CATALOG = [("6205", "6205"), ("6206", "6206"), ("6207", "6207"), ("62-22", "62/22")]


class FakeRepo:
    def __init__(self, fetched: dict[str, datetime] | None = None) -> None:
        self._fetched = fetched or {}
        self.saved: dict[str, ScrapedSpec | None] = {}

    async def get(self, slug: str) -> ProductSpecs | None:
        return None

    async def fetched(self) -> dict[str, datetime]:
        return self._fetched

    async def save(self, slug: str, spec: ScrapedSpec | None) -> None:
        self.saved[slug] = spec

    async def counts(self) -> tuple[int, int]:
        return 0, 0


class FakeProducts:
    def __init__(self, catalog: list[tuple[str, str]]) -> None:
        self.catalog = catalog

    async def designations(self, stocked_only: bool = False) -> list[tuple[str, str]]:
        return self.catalog[:2] if stocked_only else self.catalog


class FakeSkf:
    def __init__(self, answers: dict[str, ScrapedSpec | Exception | None]) -> None:
        self.answers = answers
        self.asked: list[str] = []

    async def fetch(self, designation: str) -> ScrapedSpec | None:
        self.asked.append(designation)
        answer = self.answers.get(designation, ScrapedSpec(c=1))
        if isinstance(answer, Exception):
            raise answer
        return answer


def run(repo: FakeRepo, skf: FakeSkf, catalog: list[tuple[str, str]] = CATALOG, **kwargs: Any) -> Any:
    service = SpecService(repo, cast(ProductService, FakeProducts(catalog)))
    return asyncio.run(service.scrape(cast(SkfClient, skf), delay=0, **kwargs))


def test_stocked_products_without_specs_by_default() -> None:
    repo, skf = FakeRepo({"6205": datetime.now(UTC)}), FakeSkf({"6206": None})
    report = run(repo, skf)
    assert skf.asked == ["6206"]
    assert (report.found, report.missing, report.skipped) == (0, 1, 1)
    assert repo.saved == {"6206": None}  # "not on skf.com" is stored too, so it isn't asked again


def test_all_and_limit() -> None:
    skf = FakeSkf({})
    run(FakeRepo(), skf, stocked_only=False, limit=3)
    assert skf.asked == ["6205", "6206", "6207"]


def test_max_age_refetches_old_rows() -> None:
    now = datetime.now(UTC)
    skf = FakeSkf({})
    run(FakeRepo({"6205": now - timedelta(days=100), "6206": now}), skf, max_age=timedelta(days=90))
    assert skf.asked == ["6205"]


def test_only_given_designations_even_if_fetched() -> None:
    skf = FakeSkf({})
    run(FakeRepo({"62-22": datetime.now(UTC)}), skf, only=["62/22"])
    assert skf.asked == ["62/22"]


def test_a_failure_is_skipped_and_many_in_a_row_stop_the_run() -> None:
    down = SkfUnavailableError("busy")
    report = run(FakeRepo(), FakeSkf({"6205": down}))
    assert (report.failed, report.found, report.stopped) == (["6205"], 1, False)

    catalog = [(str(n), str(n)) for n in range(MAX_FAILURES_IN_A_ROW + 3)]
    skf = FakeSkf(dict.fromkeys((d for _, d in catalog), down))
    report = run(FakeRepo(), skf, catalog, stocked_only=False)
    assert report.stopped
    assert len(skf.asked) == MAX_FAILURES_IN_A_ROW  # it stops asking
