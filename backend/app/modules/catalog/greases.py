# ruff: noqa: RUF001  (the level ranges use en dashes, as the chart displays them)
"""SKF bearing grease selection data, transcribed from the legacy /masti/ page (itself a copy of SKF's bearing grease
selection chart). Moved from the frontend's old lib/domain/greases.ts; the frontend renders it from the API."""

from dataclasses import dataclass
from typing import Literal

GreaseCondition = Literal["allPurpose", "highTemp", "extremeTemp", "lowTemp", "highLoad", "food", "green"]
Suitability = Literal["+", "o", "-"]  # recommended, suitable, not suitable
Compatibility = Literal["+", "-", "="]  # compatible, incompatible, the same grease (diagonal)
ChartColumn = Literal["verticalShaft", "outerRing", "oscillating", "vibration", "shockLoad", "rust"]

# Basic selection: LGMT 2 unless one of the conditions applies.
BASIC_SELECTION: tuple[tuple[GreaseCondition, str], ...] = (
    ("allPurpose", "LGMT 2"),
    ("highTemp", "LGHP 2"),
    ("extremeTemp", "LGET 2"),
    ("lowTemp", "LGLT 2"),
    ("highLoad", "LGEP 2"),
    ("food", "LGFP 2"),
    ("green", "LGGB 2"),
)

CHART_COLUMNS: tuple[ChartColumn, ...] = ("verticalShaft", "outerRing", "oscillating", "vibration", "shockLoad", "rust")


@dataclass(frozen=True)
class ChartRow:
    code: str
    temp_c: tuple[int, int]  # operating range, °C
    viscosity: int  # base oil viscosity at 40 °C, mm²/s
    temp: str  # L, M, H, VH ... levels, see the chart legend
    speed: str
    load: str
    fit: tuple[Suitability, ...]  # one per CHART_COLUMNS


def _fit(marks: str) -> tuple[Suitability, ...]:
    values: dict[str, Suitability] = {"+": "+", "o": "o", "-": "-"}
    return tuple(values[m] for m in marks.split())


CHART: tuple[ChartRow, ...] = (
    ChartRow("LGMT 2", (-30, 120), 110, "M", "M", "L–M", _fit("o - - + - +")),
    ChartRow("LGMT 3", (-30, 120), 120, "M", "M", "L–M", _fit("+ o - + - o")),
    ChartRow("LGEP 2", (-20, 110), 200, "M", "L–M", "H", _fit("o - o + + +")),
    ChartRow("LGFP 2", (-20, 110), 130, "M", "M", "L–M", _fit("o - - - - +")),
    ChartRow("LGEM 2", (-20, 120), 500, "M", "VL", "H–VH", _fit("o - + + + +")),
    ChartRow("LGEV 2", (-10, 120), 1020, "M", "VL", "H–VH", _fit("o - + + + +")),
    ChartRow("LGLT 2", (-50, 110), 18, "L–M", "M–EH", "L", _fit("o - - - o o")),
    ChartRow("LGGB 2", (-40, 90), 110, "L–M", "L–M", "M–H", _fit("o - + + + o")),
    ChartRow("LGWM 1", (-30, 110), 200, "L–M", "L–M", "H", _fit("- - + - + +")),
    ChartRow("LGWM 2", (-40, 110), 80, "L–M", "L–M", "L–H", _fit("o o + + + +")),
    ChartRow("LGWA 2", (-30, 140), 185, "M–H", "L–M", "L–H", _fit("o o o o + +")),
    ChartRow("LGHB 2", (-20, 150), 400, "M–H", "VL–M", "L–VH", _fit("o + + + + +")),
    ChartRow("LGHP 2", (-40, 150), 96, "M–H", "M–H", "L–M", _fit("+ - - o o +")),
    ChartRow("LGET 2", (-40, 260), 400, "VH", "L–M", "H–VH", _fit("o + + o o o")),
)

# SKF bearing grease compatibility chart. Greases sharing a group behave the same (e.g. LGMT 2 and LGMT 3).
COMPATIBILITY_GROUPS: tuple[str, ...] = (
    "LGMT 2 · LGMT 3",
    "LGEP 2 · LGWM 1",
    "LGLT 2",
    "LGHP 2",
    "LGWA 2",
    "LGFP 2",
    "LGGB 2",
    "LGFB 2 · LGFL 1",
    "LGHB 2 · LGWM 2",
    "LGET 2",
    "LGEM 2",
    "LGEV 2",
)

# The chart is symmetric; each row lists the other groups in order ("+" compatible, "-" incompatible).
_OTHERS: dict[str, str] = {
    "LGMT 2 · LGMT 3": "+ + + + - + - + - + +",
    "LGEP 2 · LGWM 1": "+ + + + - + - + - + +",
    "LGLT 2": "+ + + + - + - + - + +",
    "LGHP 2": "+ + + + - + - + - + +",
    "LGWA 2": "+ + + + + + + + - + +",
    "LGFP 2": "- - - - + - + - - - -",
    "LGGB 2": "+ + + + + - + + - + +",
    "LGFB 2 · LGFL 1": "- - - - + + + - - - -",
    "LGHB 2 · LGWM 2": "+ + + + + - + - - + +",
    "LGET 2": "- - - - - - - - - - -",
    "LGEM 2": "+ + + + + - + - + - +",
    "LGEV 2": "+ + + + + - + - + - +",
}


def _matrix() -> tuple[tuple[Compatibility, ...], ...]:
    values: dict[str, Compatibility] = {"+": "+", "-": "-"}
    rows = []
    for r, group in enumerate(COMPATIBILITY_GROUPS):
        rest = [values[v] for v in _OTHERS[group].split()]
        rows.append(tuple("=" if c == r else rest[c if c < r else c - 1] for c in range(len(COMPATIBILITY_GROUPS))))
    return tuple(rows)


# compatibility[row][col], diagonal "="
COMPATIBILITY: tuple[tuple[Compatibility, ...], ...] = _matrix()
