from typing import Annotated, Literal, Self, get_args

from pydantic import BeforeValidator, Field, model_validator

from app.core.schemas import ApiModel
from app.modules.catalog.calculations import Reliability
from app.modules.catalog.designation import SegmentKind
from app.modules.catalog.greases import ChartColumn, Compatibility, GreaseCondition, Suitability

MAX_DESIGNATION = 100
MAX_RPM = 1_000_000

# --- designation decoder


class DesignationSegment(ApiModel):
    token: str = Field(description="The part as typed, e.g. '62', '05', '2RSH'")
    kind: SegmentKind
    id: str | None = Field(description="Meaning key (frontend `Decoder.codes.<id>`); null for unknown parts")
    bore_mm: int | None = Field(description="Bore diameter for a bore segment, mm")


class DecodedDesignation(ApiModel):
    """An empty `segments` list means nothing could be read (blank or separators only)."""

    designation: str
    segments: list[DesignationSegment]
    bore_mm: int | None


# --- greases


class GreaseRecommendation(ApiModel):
    condition: GreaseCondition
    code: str


class GreaseChartRow(ApiModel):
    code: str
    temp_c: tuple[int, int] = Field(description="Operating temperature range, °C")
    viscosity: int = Field(description="Base oil viscosity at 40 °C, mm²/s")
    temp: str = Field(description="Temperature level: L, M, H, VH (ranges like 'L–M')")  # noqa: RUF001
    speed: str = Field(description="Speed level: VL, L, M, H, EH")
    load: str = Field(description="Load level: L, M, H, VH")
    fit: list[Suitability] = Field(description="One mark per `columns` entry: + recommended, o suitable, - not")


class GreaseCompatibility(ApiModel):
    groups: list[str] = Field(description="Greases in one group behave the same, e.g. 'LGMT 2 · LGMT 3'")
    matrix: list[list[Compatibility]] = Field(description="matrix[row][col]: + compatible, - not, = same grease")


class GreaseGuide(ApiModel):
    """SKF bearing grease selection: the basic choice per condition, the selection chart and compatibility."""

    basic: list[GreaseRecommendation]
    columns: list[ChartColumn]
    chart: list[GreaseChartRow]
    compatibility: GreaseCompatibility


# --- calculators

LifeType = Literal[
    "deep-groove",
    "angular-contact",
    "self-aligning",
    "thrust-ball",
    "unit",
    "cylindrical-roller",
    "spherical-roller",
    "tapered-roller",
    "needle-roller",
    "toroidal",
]
RelubricationType = Literal[
    "deep-groove",
    "angular-contact",
    "self-aligning",
    "unit",
    "cylindrical-roller",
    "needle-roller",
    "spherical-roller",
    "tapered-roller",
    "thrust-ball",
]
LifeWarning = Literal["heavy_load", "above_limiting_speed"]
LIFE_TYPES: tuple[LifeType, ...] = get_args(LifeType)
RELUBRICATION_TYPES: tuple[RelubricationType, ...] = get_args(RelubricationType)


# A query string gives "99"; an int Literal only matches 99.
QueryReliability = Annotated[
    Reliability, BeforeValidator(lambda v: int(v) if isinstance(v, str) and v.isdigit() else v)
]


class RatingLifeQuery(ApiModel):
    """A catalog product (`slug`: its type, C and calculation factors come from the catalog and SKF data), or a
    bearing described by `type` + `c`, which then takes a radial load only."""

    slug: str | None = Field(default=None, max_length=200)
    type: LifeType | None = None
    c: float | None = Field(default=None, gt=0, description="Basic dynamic load rating, kN")
    fr: float = Field(default=0, ge=0, description="Radial load, kN")
    fa: float = Field(default=0, ge=0, description="Axial load, kN")
    rpm: float = Field(gt=0, le=MAX_RPM, description="Rotational speed, r/min")
    reliability: QueryReliability = Field(default=90, description="%, for the a1 factor (ISO 281)")

    @model_validator(mode="after")
    def _bearing_and_load(self) -> Self:
        if self.slug is None and (self.type is None or self.c is None):
            raise ValueError("give either slug, or type and c")
        if self.fr == 0 and self.fa == 0:
            raise ValueError("give a load: fr, fa or both")
        return self


class RatingLife(ApiModel):
    """ISO 281 basic rating life, without the SKF life modification factor (aSKF = 1)."""

    designation: str | None = Field(description="When computed for a catalog product")
    type: LifeType
    c: float = Field(description="kN")
    p: float = Field(description="Equivalent dynamic load P = x·Fr + y·Fa, kN")
    x: float
    y: float
    e: float | None = Field(description="Fa/Fr limit that selected x and y")
    exponent: float = Field(description="3 for ball bearings, 10/3 for roller bearings")
    l10: float = Field(description="Basic rating life, million revolutions")
    l10_hours: float = Field(description="Basic rating life, operating hours")
    reliability: Reliability
    a1: float
    lnm: float = Field(description="Life at the requested reliability, million revolutions")
    lnm_hours: float = Field(description="Life at the requested reliability, operating hours")
    warnings: list[LifeWarning] = Field(
        description="heavy_load: P > 0.5 C, outside the equation's range; above_limiting_speed: rpm > SKF's limit"
    )


class RelubricationQuery(ApiModel):
    """A catalog product (`slug`), or a bearing described by `type` + `d` (+ `D`, `B` for the grease quantity)."""

    slug: str | None = Field(default=None, max_length=200)
    type: RelubricationType | None = None
    d: float | None = Field(default=None, gt=0, description="Bore diameter, mm")
    outer_d: float | None = Field(default=None, gt=0, alias="D", description="Outside diameter, mm")
    width: float | None = Field(default=None, gt=0, alias="B", description="Width, mm")
    rpm: float = Field(gt=0, le=MAX_RPM, description="Rotational speed, r/min")
    temperature: float = Field(default=70, ge=-60, le=300, description="Operating temperature, °C")
    vertical_shaft: bool = False

    @model_validator(mode="after")
    def _bearing(self) -> Self:
        if self.slug is None and (self.type is None or self.d is None):
            raise ValueError("give either slug, or type and d")
        return self


class Relubrication(ApiModel):
    """SKF's simplified relubrication interval for a lithium-base grease. An estimate: conditions like
    contamination, water or vibration shorten it."""

    designation: str | None
    type: RelubricationType
    d: float
    k: float = Field(description="Bearing type factor: 10 ball, 5 cylindrical/needle roller, 1 other roller/thrust")
    base_hours: float = Field(description="Interval at 70 °C on a horizontal shaft, operating hours")
    hours: float = Field(description="Interval for the given temperature and shaft, at most 30,000 h")
    capped: bool = Field(description="The formula gave more than 30,000 h")
    grease_side_g: float | None = Field(description="Replenishment from the side, 0.005·D·B, g")
    grease_center_g: float | None = Field(description="Replenishment through the outer ring, 0.002·D·B, g")
