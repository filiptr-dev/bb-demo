from datetime import datetime
from typing import Annotated, Literal

from pydantic import BeforeValidator, Field

from app.core.pagination import MAX_PER_PAGE, PageParams
from app.core.schemas import ApiModel

SealCode = Literal["open", "shields", "both", "one-side", "other"]
BoreCode = Literal["cylindrical", "tapered"]
SortKey = Literal["designation", "type", "boreType", "seal", "d", "D", "B"]

MAX_SEARCH_LENGTH = 100


def _blank_is_none(value: object) -> object:
    return None if value == "" else value


# An empty query value (`?type=`) means "no filter", as it does in the catalog URL.
OptionalText = Annotated[Annotated[str, Field(max_length=100)] | None, BeforeValidator(_blank_is_none)]
OptionalNumber = Annotated[float | None, BeforeValidator(_blank_is_none)]


class Product(ApiModel):
    """A catalog row. Dimensions use SKF's notation: d = bore, D = outside diameter, B = width (all mm)."""

    slug: str
    designation: str
    brand: str
    type: str
    classification: str | None
    d: float | None
    outer_d: float | None = Field(alias="D")
    width: float | None = Field(alias="B")
    seal: SealCode | None
    bore_type: BoreCode | None
    industries: list[str]


class ProductList(ApiModel):
    data: list[Product]


class ProductSearch(ApiModel):
    """GET /products query. The keys are the catalog page's URL keys, so the frontend can forward them as-is."""

    search: Annotated[str, BeforeValidator(lambda v: v[:MAX_SEARCH_LENGTH] if isinstance(v, str) else v)] = Field(
        default="",
        description="Designation (6205-2RSH, 62052rsh, 62…), dimensions (25x52x15, 25 52) or words in `locale`",
    )
    locale: str = Field(default="mk", description="Language of the search words. Unknown locales fall back to mk")
    type: OptionalText = None
    bore: OptionalText = None
    seal: OptionalText = None
    industry: list[str] = Field(default_factory=list, description="Products used in any of these industries")
    d_min: OptionalNumber = Field(default=None, alias="dmin")
    d_max: OptionalNumber = Field(default=None, alias="dmax")
    outer_d_min: OptionalNumber = Field(default=None, alias="Dmin")
    outer_d_max: OptionalNumber = Field(default=None, alias="Dmax")
    width_min: OptionalNumber = Field(default=None, alias="Bmin")
    width_max: OptionalNumber = Field(default=None, alias="Bmax")
    sort: SortKey | None = Field(default=None, description="Default: relevance, then designation")
    dir: Literal["asc", "desc"] = "asc"
    # Paging lives in this model too: FastAPI only lists a query model's fields as separate OpenAPI parameters
    # when it is the endpoint's only query input.
    page: int = Field(default=1, ge=1, description="1-based page number")
    per_page: int = Field(default=24, ge=1, le=MAX_PER_PAGE)

    @property
    def paging(self) -> PageParams:
        return PageParams(page=self.page, per_page=self.per_page)


class ProductStats(ApiModel):
    count: int
    updated_at: datetime | None = Field(description="When the catalog was last imported")


class SitemapRow(ApiModel):
    slug: str
    updated_at: datetime


class SitemapRows(ApiModel):
    data: list[SitemapRow]
