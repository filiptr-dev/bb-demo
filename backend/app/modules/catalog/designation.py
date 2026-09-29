"""SKF/ISO 15 bearing designation decoder, ported from the frontend's old lib/domain/designation.ts.

Covers the common industrial series and suffix codes this catalog sells, and deliberately skips miniature/instrument
series and rare suffixes rather than guess. Segment ids are keys into the frontend's `Decoder.codes.<id>` messages.

Fixed on the way (tests/catalog/test_designation.py lists each case): spaces separate parts like dashes, as SKF
writes them ("22212 EK", "NU 208 ECP"); "62/22" reads the bore after the slash; 16xxx is a deep groove series; a
two-digit number alone is a series without a bore code; GE plain bearing numbers are the bore in mm; "/" no longer
crashes.
"""

import re
from dataclasses import dataclass
from typing import Literal

SegmentKind = Literal["prefix", "series", "bore", "suffix", "unknown"]


@dataclass(frozen=True)
class Segment:
    token: str
    kind: SegmentKind
    id: str | None = None
    bore_mm: int | None = None


@dataclass(frozen=True)
class Decoded:
    segments: tuple[Segment, ...]
    bore_mm: int | None


# Leading letters before the numeric core (checked longest-first).
TYPE_PREFIXES: tuple[tuple[str, str], ...] = (
    ("NUP", "nup"),
    ("NJ", "nj"),
    ("NU", "nu"),
    ("NN", "nn"),
    ("QJ", "qj"),
    ("GE", "ge"),
    ("N", "n"),
    ("W", "w-stainless"),
)

# Suffix codes, matched as a whole token (case-insensitive).
SUFFIXES: dict[str, str] = {
    "Z": "z",
    "2Z": "2z",
    "RS1": "rs1",
    "2RS1": "2rs1",
    "RSH": "rsh",
    "2RSH": "2rsh",
    "RSL": "rsl",
    "2RSL": "2rsl",
    "N": "snap-ring-groove",
    "NR": "snap-ring",
    "M": "brass-cage",
    "MA": "brass-cage-outer",
    "TN9": "tn9-cage",
    "P6": "p6",
    "P5": "p5",
    "P4": "p4",
    "C2": "c2",
    "C3": "c3",
    "C4": "c4",
    "C5": "c5",
    "E": "e-design",
    "HT": "ht",
    "VA201": "va201",
    "VA208": "va208",
    "W64": "w64",
    "W203": "w203",
}

SMALL_BORES = {"00": 10, "01": 12, "02": 15, "03": 17}
DIGITS = re.compile(r"[0-9]+")
SEPARATORS = re.compile(r"[\s-]+")
EMPTY = Decoded(segments=(), bore_mm=None)


def bore_from_code(code: str) -> int | None:
    """ISO bore code → mm: 00-03 are 10, 12, 15, 17; from 04 on, code * 5."""
    if not re.fullmatch(r"[0-9]{2}", code):
        return None
    return SMALL_BORES.get(code, int(code) * 5)


def classify_series(core: str) -> str:
    """Bearing type from the numeric core (series digits + bore code)."""
    first, n = core[0], len(core)
    if first == "6" or (core.startswith("16") and n == 5):
        return "deep-groove"
    if first == "7":
        return "angular-contact"
    if first == "3":
        return "tapered-roller"
    if first in "12" and n == 4:
        return "self-aligning"
    if first == "2" and n == 5:
        return "spherical-roller"
    if first == "5" and n == 5:
        return "thrust-ball"
    return "unknown-series"


def _parts(text: str) -> list[str]:
    return [t for t in SEPARATORS.split(text) if t]


def decode(raw: str) -> Decoded:
    slash_parts = [p for p in raw.strip().split("/") if p.strip()]
    if not slash_parts:
        return EMPTY
    main, *after_slash = slash_parts
    tokens = _parts(main)
    if not tokens:
        return EMPTY
    base, *suffixes = tokens
    slash_tokens = [t for part in after_slash for t in _parts(part)]

    upper = base.upper()
    prefix = next(((p, i) for p, i in TYPE_PREFIXES if upper.startswith(p)), None)
    # "NU 208", "GE 20", "W 6205": a type prefix written apart from its number
    if prefix and upper == prefix[0] and suffixes and DIGITS.fullmatch(suffixes[0]):
        upper += suffixes.pop(0)
    letters = prefix[0] if prefix else ""
    core = upper[len(letters) :]

    segments: list[Segment] = []
    bore_mm: int | None = None
    if prefix:
        segments.append(Segment(letters, "prefix", prefix[1]))

    numeric = DIGITS.fullmatch(core) is not None
    if numeric and 2 <= len(core) <= 3 and not suffixes and slash_tokens and DIGITS.fullmatch(slash_tokens[0]):
        # "62/22", "230/500": the bore in mm after the slash (bores without a code)
        bore_token = slash_tokens.pop(0)
        bore_mm = int(bore_token)
        segments.append(Segment(core, "series", "dimension-series" if letters else classify_series(core + "00")))
        segments.append(Segment(bore_token, "bore", bore_mm=bore_mm))
    elif numeric and letters == "GE":
        bore_mm = int(core)  # GE 20 E: spherical plain bearing, 20 mm bore
        segments.append(Segment(core, "bore", bore_mm=bore_mm))
    elif numeric and (len(core) >= 3 or (letters and len(core) == 2)):
        bore_code, series = core[-2:], core[:-2]
        bore_mm = bore_from_code(bore_code)
        if not letters:
            segments.append(Segment(series, "series", classify_series(core)))
        elif series:
            segments.append(Segment(series, "series", "dimension-series"))
        segments.append(Segment(bore_code, "bore", bore_mm=bore_mm))
    elif numeric and len(core) == 2:
        segments.append(Segment(core, "series", classify_series(core + "00")))  # "62": no bore code yet
    else:
        segments.append(Segment(core or base, "unknown"))

    for token in suffixes + slash_tokens:
        code = SUFFIXES.get(token.upper())
        segments.append(Segment(token, "suffix" if code else "unknown", code))
    return Decoded(tuple(segments), bore_mm)
