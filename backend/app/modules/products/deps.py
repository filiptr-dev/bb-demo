from typing import Annotated

from fastapi import Depends

from app.core.db import Session
from app.modules.products.repository import PgProductRepository, ProductRepository
from app.modules.products.search import vocabulary
from app.modules.products.service import ProductService


def get_product_repository(session: Session) -> ProductRepository:
    return PgProductRepository(session)


def get_product_service(repo: Annotated[ProductRepository, Depends(get_product_repository)]) -> ProductService:
    return ProductService(repo, vocabulary())


Products = Annotated[ProductService, Depends(get_product_service)]
