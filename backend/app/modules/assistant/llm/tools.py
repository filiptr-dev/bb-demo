"""The model's tools. Each wraps a module service; arguments are validated by a Pydantic model whose JSON schema is
what the model sees. A failing tool returns {"error": code, "detail": ...} to the model instead of raising.

The tools also remember the products and SKF pages they returned, so the answer can end with product cards and
sources for the ones it mentions."""

from collections.abc import Awaitable, Callable
from dataclasses import dataclass
from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, ValidationError

from app.core.errors import ApiError
from app.modules.assistant.llm.client import ToolSpec
from app.modules.assistant.schemas import Source
from app.modules.catalog.schemas import LifeType, RatingLifeQuery, RelubricationQuery, RelubricationType
from app.modules.catalog.service import CatalogService
from app.modules.products.schemas import Product, ProductSearch
from app.modules.products.service import ProductService
from app.modules.specs.service import SpecService

MAX_RESULTS = 10


class _Args(BaseModel):
    model_config = ConfigDict(extra="ignore", frozen=True)


class SearchArgs(_Args):
    query: str = Field(
        default="",
        max_length=100,
        description="Designation or its start (6205, 6205-2RSH, 222), or dimensions 'd x D x B' (25x52x15). "
        "Leave empty to filter by type and dimensions only.",
    )
    type: str | None = Field(
        default=None,
        description="Product type: deep-groove, angular-contact, self-aligning, spherical-roller, tapered-roller, "
        "cylindrical-roller, thrust-ball, unit, toroidal, needle-roller, track-runner, plain, housing, sleeve-nut, "
        "seal",
    )
    d: float | None = Field(default=None, gt=0, description="Bore diameter, mm (exact)")
    outer_d: float | None = Field(default=None, gt=0, description="Outside diameter D, mm (exact)")
    width: float | None = Field(default=None, gt=0, description="Width B, mm (exact)")
    limit: int = Field(default=5, ge=1, le=MAX_RESULTS)


class DesignationArgs(_Args):
    designation: str = Field(min_length=1, max_length=100, description="An SKF designation, e.g. 6205-2RSH/C3")


class NoArgs(_Args):
    pass


class RatingLifeArgs(_Args):
    designation: str | None = Field(default=None, description="A catalog product; its C and factors are used")
    type: LifeType | None = Field(default=None, description="Without a designation: the bearing type")
    c: float | None = Field(default=None, gt=0, description="Without a designation: basic dynamic load rating, kN")
    fr: float = Field(default=0, ge=0, description="Radial load, kN")
    fa: float = Field(default=0, ge=0, description="Axial load, kN")
    rpm: float = Field(gt=0, description="Speed, r/min")
    reliability: Literal[90, 95, 96, 97, 98, 99] = Field(default=90, description="%")


class RelubricationArgs(_Args):
    designation: str | None = Field(default=None, description="A catalog product; its type and size are used")
    type: RelubricationType | None = Field(default=None, description="Without a designation: the bearing type")
    d: float | None = Field(default=None, gt=0, description="Without a designation: bore diameter, mm")
    rpm: float = Field(gt=0, description="Speed, r/min")
    temperature: float = Field(default=70, description="Operating temperature, °C")
    vertical_shaft: bool = False


@dataclass(frozen=True)
class Tool:
    spec: ToolSpec
    args: type[_Args]
    run: Callable[[Any], Awaitable[dict[str, Any]]]
    status: Literal["searching", "reading", "calculating"]


def json_schema(model: type[BaseModel]) -> dict[str, Any]:
    """The model's JSON schema without titles, and `X | None` as plain optional X (simpler for the model)."""

    def clean(node: Any) -> Any:
        if isinstance(node, dict):
            any_of = node.get("anyOf")
            if isinstance(any_of, list):
                others = [s for s in any_of if s != {"type": "null"}]
                if len(others) == 1:
                    rest = {k: v for k, v in node.items() if k != "anyOf"}
                    return clean({**others[0], **rest})
            return {k: clean(v) for k, v in node.items() if k != "title"}
        if isinstance(node, list):
            return [clean(v) for v in node]
        return node

    schema: dict[str, Any] = clean(model.model_json_schema())
    return schema


def _product(p: Product) -> dict[str, Any]:
    return {
        "designation": p.designation,
        "url": f"/catalog/{p.slug}",
        "type": p.type,
        "d": p.d,
        "D": p.outer_d,
        "B": p.width,
        "seal": p.seal,
        "boreType": p.bore_type,
    }


def rounded(node: Any) -> Any:
    """Floats to 5 significant digits: 405.22400000000005 → 405.22. Long digit strings are where a model miscopies."""
    if isinstance(node, float):
        return float(f"{node:.5g}")
    if isinstance(node, dict):
        return {k: rounded(v) for k, v in node.items()}
    if isinstance(node, list):
        return [rounded(v) for v in node]
    return node


def _error(e: ApiError) -> dict[str, Any]:
    return {"error": e.code, "detail": e.detail}


class AssistantTools:
    def __init__(self, products: ProductService, specs: SpecService, catalog: CatalogService, locale: str) -> None:
        self.products = products
        self.specs = specs
        self.catalog = catalog
        self.locale = locale
        self.seen: dict[str, Product] = {}  # designation → product, in the order the tools returned them
        self.sources: dict[str, Source] = {}  # url → source
        self.tools = {
            t.spec.name: t
            for t in (
                self._tool(
                    "search_products",
                    "Search the B&B Unikoop catalog (SKF products in stock or orderable). Returns the total and "
                    "the first matches with their page url.",
                    SearchArgs,
                    self.search_products,
                    "searching",
                ),
                self._tool(
                    "get_product",
                    "One catalog product by exact designation, with SKF technical data (C, C0, Pu, speeds, mass, "
                    "calculation factors) when available, and the skf.com page.",
                    DesignationArgs,
                    self.get_product,
                    "searching",
                ),
                self._tool(
                    "decode_designation",
                    "Split an SKF designation into prefix, series, bore code and suffixes (ids name each part).",
                    DesignationArgs,
                    self.decode_designation,
                    "reading",
                ),
                self._tool(
                    "grease_guide",
                    "The SKF bearing grease selection chart: basic choice per condition, each grease's "
                    "temperature range, viscosity, speed/load levels and suitability, and which greases must not "
                    "be mixed.",
                    NoArgs,
                    self.grease_guide,
                    "reading",
                ),
                self._tool(
                    "rating_life",
                    "ISO 281 basic rating life L10 (million revolutions and hours) and the life at a higher "
                    "reliability, for a catalog product or a given C. Loads in kN.",
                    RatingLifeArgs,
                    self.rating_life,
                    "calculating",
                ),
                self._tool(
                    "relubrication",
                    "SKF's simplified grease relubrication interval (hours) and replenishment quantity (g).",
                    RelubricationArgs,
                    self.relubrication,
                    "calculating",
                ),
            )
        }

    @staticmethod
    def _tool(
        name: str,
        description: str,
        args: type[_Args],
        run: Callable[[Any], Awaitable[dict[str, Any]]],
        status: Literal["searching", "reading", "calculating"],
    ) -> Tool:
        return Tool(ToolSpec(name, description, json_schema(args)), args, run, status)

    @property
    def specs_list(self) -> list[ToolSpec]:
        return [t.spec for t in self.tools.values()]

    async def call(self, name: str, raw_args: dict[str, Any]) -> dict[str, Any]:
        tool = self.tools.get(name)
        if tool is None:
            return {"error": "unknown_tool", "detail": f"No tool '{name}'."}
        try:
            args = tool.args.model_validate(raw_args)
        except ValidationError as e:
            return {"error": "invalid_arguments", "detail": str(e)[:500]}
        try:
            result: dict[str, Any] = rounded(await tool.run(args))
        except ApiError as e:
            return _error(e)
        return result

    def _remember(self, products: list[Product]) -> None:
        for p in products:
            self.seen.setdefault(p.designation, p)

    async def search_products(self, args: SearchArgs) -> dict[str, Any]:
        page = await self.products.search(
            ProductSearch(
                search=args.query,
                locale=self.locale,
                type=args.type,
                dmin=args.d,
                dmax=args.d,
                Dmin=args.outer_d,
                Dmax=args.outer_d,
                Bmin=args.width,
                Bmax=args.width,
                per_page=args.limit,
            )
        )
        self._remember(page.data)
        return {"total": page.meta.total, "products": [_product(p) for p in page.data]}

    async def _find(self, designation: str) -> Product:
        product = await self.products.find_by_designation(designation)
        if product is None:
            raise ApiError(404, "product_not_found", f"'{designation}' is not in the catalog. Try search_products.")
        return product

    async def get_product(self, args: DesignationArgs) -> dict[str, Any]:
        product = await self._find(args.designation)
        self._remember([product])
        result = _product(product)
        try:
            spec = await self.specs.get(product.slug)
        except ApiError:
            result["specs"] = None
            result["note"] = "No SKF technical data stored for this product; link to skf.com instead of guessing."
            return result
        result["specs"] = {
            "C_kN": spec.c,
            "C0_kN": spec.c0,
            "Pu_kN": spec.pu,
            "referenceSpeed_rpm": spec.reference_speed,
            "limitingSpeed_rpm": spec.limiting_speed,
            "mass_kg": spec.mass,
            "performanceClass": spec.performance_class,
            "factors": spec.factors,
        }
        if spec.source_url:
            result["skfUrl"] = spec.source_url
            self.sources[spec.source_url] = Source(title=f"SKF {product.designation}", url=spec.source_url)
        return result

    async def decode_designation(self, args: DesignationArgs) -> dict[str, Any]:
        return self.catalog.decode(args.designation).model_dump(mode="json")

    async def grease_guide(self, _: NoArgs) -> dict[str, Any]:
        guide = self.catalog.greases()
        groups = guide.compatibility.groups
        return {
            "basicSelection": [{"condition": b.condition, "grease": b.code} for b in guide.basic],
            "legend": "fit: + recommended, o suitable, - not suitable; levels VL very low .. EH extremely high",
            "fitColumns": guide.columns,
            "chart": [r.model_dump(mode="json") for r in guide.chart],
            "doNotMix": {
                g: [groups[c] for c, v in enumerate(guide.compatibility.matrix[r]) if v == "-"]
                for r, g in enumerate(groups)
            },
            "page": "/products/greases",
        }

    async def rating_life(self, args: RatingLifeArgs) -> dict[str, Any]:
        slug = (await self._find(args.designation)).slug if args.designation else None
        query = RatingLifeQuery(
            slug=slug, type=args.type, c=args.c, fr=args.fr, fa=args.fa, rpm=args.rpm, reliability=args.reliability
        )
        return (await self.catalog.rating_life(query)).model_dump(mode="json")

    async def relubrication(self, args: RelubricationArgs) -> dict[str, Any]:
        slug = (await self._find(args.designation)).slug if args.designation else None
        query = RelubricationQuery(
            slug=slug,
            type=args.type,
            d=args.d,
            rpm=args.rpm,
            temperature=args.temperature,
            vertical_shaft=args.vertical_shaft,
        )
        return (await self.catalog.relubrication(query)).model_dump(mode="json")
