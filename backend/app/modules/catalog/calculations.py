"""Bearing life and relubrication estimates: plain functions on numbers. The service feeds them catalog data.

Rating life (ISO 281): L10 = (C/P)^p million revolutions, p = 3 for ball and 10/3 for roller bearings, and
Lnm = a1 · L10 for a reliability above 90 %. The SKF life modification factor (lubrication, contamination) is not
included, i.e. aSKF = 1: it needs the operating viscosity and cleanliness, which we don't ask for.

Equivalent dynamic load P = X·Fr + Y·Fa from the bearing's SKF calculation factors (e, X, Y, Y1, Y2, f0), with the
formulas SKF gives per bearing type.

Relubrication interval: SKF's simplified formula tf = k · (14·10⁶ / (n·√d) - 4·d) operating hours, for a lithium
grease at 70 °C on a horizontal shaft; halved for every 15 °C above 70 °C, and halved on a vertical shaft.
Replenishment quantity Gp = 0.005·D·B g from the side, 0.002·D·B g through the outer ring.
"""

import math
from bisect import bisect_left
from dataclasses import dataclass
from typing import Literal

Reliability = Literal[90, 95, 96, 97, 98, 99]

BALL = frozenset({"deep-groove", "angular-contact", "self-aligning", "thrust-ball", "unit"})
ROLLER = frozenset({"cylindrical-roller", "spherical-roller", "tapered-roller", "needle-roller", "toroidal"})
RADIAL_ONLY = frozenset({"needle-roller", "toroidal"})  # no axial load (CARB, needle roller bearings)

# ISO 281:2007 reliability factor a1
A1: dict[int, float] = {90: 1.0, 95: 0.64, 96: 0.55, 97: 0.47, 98: 0.37, 99: 0.25}

# Radial deep groove ball bearings, normal clearance: f0·Fa/C0 → (e, Y), X = 0.56 (ISO 281 / SKF catalogue).
DEEP_GROOVE = (
    (0.172, 0.19, 2.30),
    (0.345, 0.22, 1.99),
    (0.689, 0.26, 1.71),
    (1.03, 0.28, 1.55),
    (1.38, 0.30, 1.45),
    (2.07, 0.34, 1.31),
    (3.45, 0.38, 1.15),
    (5.17, 0.42, 1.04),
    (6.89, 0.44, 1.00),
)

HEAVY_LOAD = 0.5  # P/C above this: outside the range the life equation is meant for

# Relubrication: bearing type → k
RELUBRICATION_K: dict[str, float] = {
    "deep-groove": 10,
    "angular-contact": 10,
    "self-aligning": 10,
    "unit": 10,
    "cylindrical-roller": 5,
    "needle-roller": 5,
    "spherical-roller": 1,
    "tapered-roller": 1,
    "thrust-ball": 1,
}
REFERENCE_TEMPERATURE = 70.0  # °C
HALVING_STEP = 15.0  # °C
MAX_INTERVAL = 30_000.0  # h; grease ages anyway, so SKF doesn't go beyond this


class CalculationError(ValueError):
    """The inputs are outside what the formulas cover. `code` is the API error code."""

    def __init__(self, code: str, detail: str) -> None:
        super().__init__(detail)
        self.code = code
        self.detail = detail


@dataclass(frozen=True)
class EquivalentLoad:
    p: float  # kN
    x: float  # P = x·Fr + y·Fa
    y: float
    e: float | None  # the Fa/Fr limit that picked x and y, when the type has one


@dataclass(frozen=True)
class Life:
    exponent: float
    l10: float  # million revolutions
    l10h: float  # operating hours
    a1: float
    lnm: float
    lnmh: float


@dataclass(frozen=True)
class RelubricationInterval:
    k: float
    base_hours: float  # at 70 °C, horizontal shaft
    hours: float  # for the given temperature and shaft, capped at MAX_INTERVAL
    capped: bool
    grease_side_g: float | None  # replenishment from the side
    grease_center_g: float | None  # through the outer ring groove and holes


def is_ball(bearing_type: str) -> bool:
    return bearing_type in BALL


def supports_life(bearing_type: str) -> bool:
    return bearing_type in BALL or bearing_type in ROLLER


def _deep_groove_factors(relative_axial: float) -> tuple[float, float]:
    """(e, Y) for f0·Fa/C0, interpolated linearly in the table and held at its ends."""
    xs = [row[0] for row in DEEP_GROOVE]
    if relative_axial <= xs[0]:
        return DEEP_GROOVE[0][1], DEEP_GROOVE[0][2]
    if relative_axial >= xs[-1]:
        return DEEP_GROOVE[-1][1], DEEP_GROOVE[-1][2]
    i = bisect_left(xs, relative_axial)
    (x0, e0, y0), (x1, e1, y1) = DEEP_GROOVE[i - 1], DEEP_GROOVE[i]
    t = (relative_axial - x0) / (x1 - x0)
    return e0 + t * (e1 - e0), y0 + t * (y1 - y0)


def equivalent_load(
    bearing_type: str, fr: float, fa: float, factors: dict[str, float], c0: float | None = None
) -> EquivalentLoad:
    """P for a radial load Fr and an axial load Fa (kN) on one bearing. An axial load needs the bearing's factors."""
    if bearing_type == "thrust-ball":
        if fr > 0:
            raise CalculationError("load_case_unsupported", "A thrust ball bearing takes no radial load.")
        return EquivalentLoad(p=fa, x=0, y=1, e=None)
    if fa == 0:
        return EquivalentLoad(p=fr, x=1, y=0, e=None)
    if bearing_type in RADIAL_ONLY:
        raise CalculationError("load_case_unsupported", "This bearing type takes no axial load.")

    ratio = fa / fr if fr > 0 else math.inf
    e = factors.get("e")
    x, y, y1, y2 = (factors.get(k) for k in ("X", "Y", "Y1", "Y2"))

    if bearing_type in ("deep-groove", "unit") and "f0" in factors and c0:
        e, y = _deep_groove_factors(factors["f0"] * fa / c0)
        return _load(fr, fa, 1, 0, 0.56, y, ratio, e)
    if e is not None and y1 is not None and y2 is not None:
        # double row / paired bearings: P = Fr + Y1·Fa below e, X·Fr + Y2·Fa above
        big_x = {"spherical-roller": 0.67, "self-aligning": 0.65}.get(bearing_type, x)
        if big_x is not None:
            return _load(fr, fa, 1, y1, big_x, y2, ratio, e)
    if e is not None and y is not None:
        big_x = {"tapered-roller": 0.4, "cylindrical-roller": 0.92}.get(bearing_type)
        if big_x is not None:
            return _load(fr, fa, 1, 0, big_x, y, ratio, e)
    raise CalculationError(
        "load_case_unsupported", "No SKF calculation factors for an axial load on this bearing; give Fa = 0."
    )


def _load(fr: float, fa: float, x1: float, y1: float, x2: float, y2: float, ratio: float, e: float) -> EquivalentLoad:
    x, y = (x1, y1) if ratio <= e else (x2, y2)
    return EquivalentLoad(p=x * fr + y * fa, x=x, y=y, e=e)


def rating_life(c: float, p: float, rpm: float, ball: bool, reliability: Reliability = 90) -> Life:
    if p <= 0:
        raise CalculationError("load_case_unsupported", "The equivalent load must be above zero.")
    exponent = 3.0 if ball else 10 / 3
    l10 = (c / p) ** exponent
    hours = 1e6 / (60 * rpm)
    a1 = A1[reliability]
    return Life(exponent=exponent, l10=l10, l10h=l10 * hours, a1=a1, lnm=a1 * l10, lnmh=a1 * l10 * hours)


def is_heavy_load(c: float, p: float) -> bool:
    return p > HEAVY_LOAD * c


def relubrication_interval(
    bearing_type: str,
    d: float,
    rpm: float,
    temperature: float = REFERENCE_TEMPERATURE,
    vertical_shaft: bool = False,
    outer_d: float | None = None,
    width: float | None = None,
) -> RelubricationInterval:
    k = RELUBRICATION_K.get(bearing_type)
    if k is None:
        raise CalculationError("relubrication_unsupported", "No relubrication formula for this bearing type.")
    base = k * (14e6 / (rpm * math.sqrt(d)) - 4 * d)
    if base <= 0:
        raise CalculationError(
            "relubrication_out_of_range", "The speed is too high for grease at this size; ask us about oil."
        )
    hours = base * 0.5 ** (max(0.0, temperature - REFERENCE_TEMPERATURE) / HALVING_STEP)
    if vertical_shaft:
        hours /= 2
    capped = hours > MAX_INTERVAL
    size = outer_d * width if outer_d and width else None
    return RelubricationInterval(
        k=k,
        base_hours=base,
        hours=min(hours, MAX_INTERVAL),
        capped=capped,
        grease_side_g=0.005 * size if size else None,
        grease_center_g=0.002 * size if size else None,
    )
