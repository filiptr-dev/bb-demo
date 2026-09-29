from typing import Annotated, Any

from fastapi import APIRouter, Path, Query

from app.core.errors import problem_responses
from app.core.pagination import Page
from app.modules.products.deps import Products
from app.modules.products.schemas import Product, ProductList, ProductSearch, ProductStats, SitemapRows

router = APIRouter(tags=["products"])

SITEMAP_CHUNK = 5000
not_found: dict[int | str, dict[str, Any]] = {
    404: problem_responses[500] | {"description": "No product with this slug"}
}


@router.get("/products")
async def search_products(params: Annotated[ProductSearch, Query()], products: Products) -> Page[Product]:
    """Catalog search. Without `sort`, results are ranked: exact designation, prefix, contains, dimension match,
    word match; then natural designation order. A page past the end returns the last page (see `meta.page`)."""
    return await products.search(params)


@router.get("/products/stats")
async def product_stats(products: Products) -> ProductStats:
    count, updated_at = await products.stats()
    return ProductStats(count=count, updated_at=updated_at)


@router.get("/products/sitemap")
async def product_sitemap(
    products: Products,
    offset: Annotated[int, Query(ge=0)] = 0,
    limit: Annotated[int, Query(ge=1, le=SITEMAP_CHUNK)] = SITEMAP_CHUNK,
) -> SitemapRows:
    """Slugs in catalog order with their last import time, one sitemap file at a time."""
    return SitemapRows(data=await products.sitemap(offset, limit))


@router.get("/products/{slug}", responses=not_found)
async def get_product(slug: Annotated[str, Path(max_length=200)], products: Products) -> Product:
    return await products.get(slug)


@router.get("/products/{slug}/related", responses=not_found)
async def related_products(
    slug: Annotated[str, Path(max_length=200)],
    products: Products,
    limit: Annotated[int, Query(ge=1, le=24)] = 4,
) -> ProductList:
    """Same type, closest bore diameter first."""
    return ProductList(data=await products.related(slug, limit))


@router.get("/industries/{slug}/products")
async def industry_products(
    slug: Annotated[str, Path(max_length=100)],
    products: Products,
    limit: Annotated[int, Query(ge=1, le=100)] = 24,
) -> ProductList:
    """Products used in an industry, B&B Unikoop's own picks first. An unknown industry has none."""
    return ProductList(data=await products.by_industry(slug, limit))
