"""Data jobs, run by hand against DATABASE_URL (local .env, or the production URL in the environment).

    uv run python -m app.cli products-import [--dry]
    uv run python -m app.cli specs-scrape [--all] [--limit N] [--delay 1.5] [--max-age-days 90] [DESIGNATION ...]

After a change they ask the frontend to refresh its cached pages (FRONTEND_REVALIDATE_URL + REVALIDATE_SECRET).
"""

import argparse
import asyncio
import logging
import sys
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from datetime import timedelta

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.db import create_engine, create_sessionmaker
from app.core.revalidator import Revalidator
from app.core.settings import Settings, get_settings
from app.modules.products.importer import build_catalog, scrape
from app.modules.products.repository import PgProductRepository
from app.modules.products.search import vocabulary
from app.modules.products.service import ProductService
from app.modules.specs.repository import PgSpecRepository
from app.modules.specs.scraper import SkfClient
from app.modules.specs.service import SpecService


@asynccontextmanager
async def session(settings: Settings) -> AsyncIterator[AsyncSession]:
    engine = create_engine(settings)
    try:
        async with create_sessionmaker(engine)() as s:
            yield s
    finally:
        await engine.dispose()


async def products_import(settings: Settings, dry: bool) -> int:
    catalog = build_catalog(await scrape())
    print(f"scraped {catalog.scraped}, seed overlap {catalog.both} → {len(catalog.rows)} products")
    print(", ".join(f"{t} {n}" for t, n in sorted(catalog.by_type().items())))
    if catalog.unmapped:
        print(f"skipped unmapped classifications: {dict(catalog.unmapped)}", file=sys.stderr)
    if dry:
        return 0
    async with session(settings) as s:
        counts = await ProductService(PgProductRepository(s), vocabulary()).replace_catalog(catalog.rows)
    print(f"inserted {counts.inserted}, updated {counts.updated}, deleted {counts.deleted}")
    if counts.inserted or counts.updated or counts.deleted:
        await Revalidator(settings).revalidate("products")
    return 0


async def specs_scrape(settings: Settings, args: argparse.Namespace) -> int:
    def progress(i: int, n: int, designation: str, outcome: str) -> None:
        print(f"[{i}/{n}] {designation}: {outcome}", flush=True)

    async with session(settings) as s, SkfClient() as skf:
        specs = SpecService(PgSpecRepository(s), ProductService(PgProductRepository(s), vocabulary()))
        report = await specs.scrape(
            skf,
            stocked_only=not args.all,
            max_age=timedelta(days=args.max_age_days) if args.max_age_days is not None else None,
            limit=args.limit,
            delay=args.delay,
            only=args.designations or None,
            progress=progress,
        )
        found, missing = await specs.counts()
    print(
        f"found {report.found}, not on skf.com {report.missing}, skipped {report.skipped} (already fetched), "
        f"failed {len(report.failed)}. Table: {found} with data, {missing} without."
    )
    if report.failed:
        print("failed: " + ", ".join(report.failed), file=sys.stderr)
    if report.changed:
        await Revalidator(settings).revalidate("products")
    if report.stopped:
        print("stopped: SKF kept failing. Run the same command again later; it resumes.", file=sys.stderr)
        return 1
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="python -m app.cli")
    jobs = parser.add_subparsers(dest="job", required=True)

    imp = jobs.add_parser("products-import", help="scrape the SKF catalog + our seed list into products")
    imp.add_argument("--dry", action="store_true", help="scrape and print stats, don't write")

    spec = jobs.add_parser("specs-scrape", help="fetch SKF technical data for products that have none yet")
    spec.add_argument("designations", nargs="*", help="only these designations (re-fetched even if present)")
    spec.add_argument("--all", action="store_true", help="the whole catalog, not only our stocked (seed) products")
    spec.add_argument("--limit", type=int, help="at most this many requests")
    spec.add_argument("--delay", type=float, default=1.0, help="seconds between requests (default 1)")
    spec.add_argument("--max-age-days", type=int, help="also re-fetch data older than this")

    args = parser.parse_args(argv)
    settings = get_settings()
    logging.basicConfig(
        level=settings.log_level.upper(), stream=sys.stderr, format="%(levelname)s %(name)s: %(message)s"
    )
    logging.getLogger("httpx2").setLevel(logging.WARNING)  # a line per request otherwise
    if args.job == "products-import":
        return asyncio.run(products_import(settings, args.dry))
    return asyncio.run(specs_scrape(settings, args))


if __name__ == "__main__":
    sys.exit(main())
