from typing import Annotated

from fastapi import Depends

from app.core.db import Session
from app.modules.products.deps import Products
from app.modules.specs.repository import PgSpecRepository, SpecRepository
from app.modules.specs.service import SpecService


def get_spec_repository(session: Session) -> SpecRepository:
    return PgSpecRepository(session)


def get_spec_service(repo: Annotated[SpecRepository, Depends(get_spec_repository)], products: Products) -> SpecService:
    return SpecService(repo, products)


Specs = Annotated[SpecService, Depends(get_spec_service)]
