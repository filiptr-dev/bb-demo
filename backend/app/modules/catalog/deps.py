from typing import Annotated

from fastapi import Depends

from app.modules.catalog.service import CatalogService
from app.modules.products.deps import Products
from app.modules.specs.deps import Specs


def get_catalog_service(products: Products, specs: Specs) -> CatalogService:
    return CatalogService(products, specs)


Catalog = Annotated[CatalogService, Depends(get_catalog_service)]
