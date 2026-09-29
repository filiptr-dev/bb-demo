from typing import Annotated, Any

from fastapi import APIRouter, Query

from app.core.errors import problem_responses
from app.modules.catalog.deps import Catalog
from app.modules.catalog.schemas import (
    MAX_DESIGNATION,
    DecodedDesignation,
    GreaseGuide,
    RatingLife,
    RatingLifeQuery,
    Relubrication,
    RelubricationQuery,
)

router = APIRouter(prefix="/catalog", tags=["catalog"])

calculation_errors: dict[int | str, dict[str, Any]] = {
    404: problem_responses[500] | {"description": "`product_not_found`, or `specs_not_found` (no load rating yet)"},
    422: problem_responses[500]
    | {"description": "Invalid fields, or a case the formulas don't cover (`load_case_unsupported`, ...)"},
}


@router.get("/decode")
async def decode_designation(
    catalog: Catalog, designation: Annotated[str, Query(min_length=1, max_length=MAX_DESIGNATION)]
) -> DecodedDesignation:
    """Splits an SKF designation (6205-2RSH/C3, 22212 EK, NU 208 ECP) into prefix, series, bore code and suffixes."""
    return catalog.decode(designation)


@router.get("/greases")
async def grease_guide(catalog: Catalog) -> GreaseGuide:
    return catalog.greases()


@router.get("/rating-life", responses=calculation_errors)
async def rating_life(params: Annotated[RatingLifeQuery, Query()], catalog: Catalog) -> RatingLife:
    """ISO 281 basic rating life L10 and the life at a higher reliability (a1), for a catalog product or a given C.
    Loads in kN. Errors: `rating_life_unsupported` (not a rolling bearing), `load_case_unsupported` (e.g. an axial
    load without SKF factors)."""
    return await catalog.rating_life(params)


@router.get("/relubrication", responses=calculation_errors)
async def relubrication(params: Annotated[RelubricationQuery, Query()], catalog: Catalog) -> Relubrication:
    """SKF's simplified grease relubrication interval and replenishment quantity. Errors: `relubrication_unsupported`,
    `relubrication_out_of_range` (too fast for grease)."""
    return await catalog.relubrication(params)
