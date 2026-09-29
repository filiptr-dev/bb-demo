from typing import Annotated, Any

from fastapi import APIRouter, Path

from app.core.errors import problem_responses
from app.modules.specs.deps import Specs
from app.modules.specs.schemas import ProductSpecs

router = APIRouter(tags=["specs"])

not_found: dict[int | str, dict[str, Any]] = {
    404: problem_responses[500] | {"description": "No technical data for this product (yet)"}
}


@router.get("/products/{slug}/specs", responses=not_found)
async def product_specs(slug: Annotated[str, Path(max_length=200)], specs: Specs) -> ProductSpecs:
    """SKF technical data: load ratings, speeds, mass, calculation factors and the full data sheet.
    404 `specs_not_found` when the product has none: link to `https://www.skf.com` instead of guessing values."""
    return await specs.get(slug)
