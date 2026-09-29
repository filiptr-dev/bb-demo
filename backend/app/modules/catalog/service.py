from app.core.errors import ApiError
from app.modules.catalog import calculations, designation, greases
from app.modules.catalog.calculations import CalculationError
from app.modules.catalog.schemas import (
    LIFE_TYPES,
    RELUBRICATION_TYPES,
    DecodedDesignation,
    DesignationSegment,
    GreaseChartRow,
    GreaseCompatibility,
    GreaseGuide,
    GreaseRecommendation,
    LifeType,
    LifeWarning,
    RatingLife,
    RatingLifeQuery,
    Relubrication,
    RelubricationQuery,
    RelubricationType,
)
from app.modules.products.schemas import Product
from app.modules.products.service import ProductService
from app.modules.specs.service import SpecService

GREASE_GUIDE = GreaseGuide(
    basic=[GreaseRecommendation(condition=c, code=code) for c, code in greases.BASIC_SELECTION],
    columns=list(greases.CHART_COLUMNS),
    chart=[
        GreaseChartRow(
            code=r.code,
            temp_c=r.temp_c,
            viscosity=r.viscosity,
            temp=r.temp,
            speed=r.speed,
            load=r.load,
            fit=list(r.fit),
        )
        for r in greases.CHART
    ],
    compatibility=GreaseCompatibility(
        groups=list(greases.COMPATIBILITY_GROUPS), matrix=[list(row) for row in greases.COMPATIBILITY]
    ),
)


class CatalogService:
    """Bearing know-how: designation decoder, grease guide, rating life and relubrication. The module's public API
    (the assistant's tools wrap it later). Product data comes from the products and specs services."""

    def __init__(self, products: ProductService, specs: SpecService) -> None:
        self.products = products
        self.specs = specs

    def decode(self, text: str) -> DecodedDesignation:
        result = designation.decode(text)
        return DecodedDesignation(
            designation=text.strip(),
            segments=[
                DesignationSegment(token=s.token, kind=s.kind, id=s.id, bore_mm=s.bore_mm) for s in result.segments
            ],
            bore_mm=result.bore_mm,
        )

    def greases(self) -> GreaseGuide:
        return GREASE_GUIDE

    async def rating_life(self, q: RatingLifeQuery) -> RatingLife:
        factors: dict[str, float] = {}
        c0 = limiting_speed = None
        name = None
        if q.slug is not None:
            product = await self.products.get(q.slug)
            bearing_type = _life_type(product)
            spec = await self.specs.get(q.slug)
            if spec.c is None:
                raise ApiError(404, "specs_not_found", f"No load rating for '{q.slug}'.")
            c, c0, limiting_speed, factors, name = (
                spec.c,
                spec.c0,
                spec.limiting_speed,
                spec.factors,
                product.designation,
            )
        else:
            assert q.type is not None  # RatingLifeQuery checks both
            assert q.c is not None
            bearing_type, c = q.type, q.c
        try:
            load = calculations.equivalent_load(bearing_type, q.fr, q.fa, factors, c0)
            life = calculations.rating_life(c, load.p, q.rpm, calculations.is_ball(bearing_type), q.reliability)
        except CalculationError as e:
            raise ApiError(422, e.code, e.detail) from e
        warnings: list[LifeWarning] = []
        if calculations.is_heavy_load(c, load.p):
            warnings.append("heavy_load")
        if limiting_speed is not None and q.rpm > limiting_speed:
            warnings.append("above_limiting_speed")
        return RatingLife(
            designation=name,
            type=bearing_type,
            c=c,
            p=load.p,
            x=load.x,
            y=load.y,
            e=load.e,
            exponent=life.exponent,
            l10=life.l10,
            l10_hours=life.l10h,
            reliability=q.reliability,
            a1=life.a1,
            lnm=life.lnm,
            lnm_hours=life.lnmh,
            warnings=warnings,
        )

    async def relubrication(self, q: RelubricationQuery) -> Relubrication:
        name = None
        if q.slug is not None:
            product = await self.products.get(q.slug)
            if product.d is None:
                raise ApiError(422, "relubrication_unsupported", f"'{q.slug}' has no bore diameter in the catalog.")
            bearing_type, d, outer_d, width = _relubrication_type(product), product.d, product.outer_d, product.width
            name = product.designation
        else:
            assert q.type is not None  # RelubricationQuery checks both
            assert q.d is not None
            bearing_type, d, outer_d, width = q.type, q.d, q.outer_d, q.width
        try:
            r = calculations.relubrication_interval(
                bearing_type, d, q.rpm, q.temperature, q.vertical_shaft, outer_d=outer_d, width=width
            )
        except CalculationError as e:
            raise ApiError(422, e.code, e.detail) from e
        return Relubrication(
            designation=name,
            type=bearing_type,
            d=d,
            k=r.k,
            base_hours=r.base_hours,
            hours=r.hours,
            capped=r.capped,
            grease_side_g=r.grease_side_g,
            grease_center_g=r.grease_center_g,
        )


def _life_type(product: Product) -> LifeType:
    for t in LIFE_TYPES:
        if product.type == t:
            return t
    raise ApiError(422, "rating_life_unsupported", f"No rating life for a '{product.type}' product.")


def _relubrication_type(product: Product) -> RelubricationType:
    for t in RELUBRICATION_TYPES:
        if product.type == t:
            return t
    raise ApiError(422, "relubrication_unsupported", f"No relubrication formula for a '{product.type}' product.")
