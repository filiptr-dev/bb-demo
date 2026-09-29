from datetime import datetime
from math import ceil

from app.core.errors import ApiError
from app.core.pagination import Page, PageParams
from app.modules.products.importer import ProductRecord
from app.modules.products.repository import ImportCounts, ProductRepository
from app.modules.products.schemas import Product, ProductSearch, SitemapRow
from app.modules.products.search import Vocabulary, criteria


class ProductService:
    """The products module's public API. Other modules (the assistant, later) use this, never the repository."""

    def __init__(self, repo: ProductRepository, vocabulary: Vocabulary) -> None:
        self.repo = repo
        self.vocabulary = vocabulary

    async def search(self, params: ProductSearch) -> Page[Product]:
        paging = params.paging
        rows, total = await self.repo.search(criteria(params, self.vocabulary))
        if not rows and paging.page > 1:
            # The page is past the end (filters narrowed the results): serve the last page instead.
            first = params.model_copy(update={"page": 1, "per_page": 1})
            _, total = await self.repo.search(criteria(first, self.vocabulary))
            if not total:
                return Page.of([], 0, PageParams(page=1, per_page=paging.per_page))
            return await self.search(params.model_copy(update={"page": ceil(total / paging.per_page)}))
        return Page.of(rows, total, paging)

    async def get(self, slug: str) -> Product:
        product = await self.repo.get(slug)
        if product is None:
            raise ApiError(404, "product_not_found", f"No product with slug '{slug}'.")
        return product

    async def related(self, slug: str, limit: int) -> list[Product]:
        return await self.repo.related(await self.get(slug), limit)

    async def by_industry(self, industry: str, limit: int) -> list[Product]:
        return await self.repo.by_industry(industry, limit)

    async def stats(self) -> tuple[int, datetime | None]:
        return await self.repo.stats()

    async def sitemap(self, offset: int, limit: int) -> list[SitemapRow]:
        return await self.repo.sitemap(offset, limit)

    async def replace_catalog(self, rows: list[ProductRecord]) -> ImportCounts:
        """The importer's write: the table becomes exactly `rows`."""
        if not rows:
            raise ValueError("refusing to replace the catalog with nothing")
        return await self.repo.replace_all(rows)

    async def designations(self, stocked_only: bool = False) -> list[tuple[str, str]]:
        """(slug, designation) of every product, or only the ones on our curated list."""
        return await self.repo.designations(stocked_only)
