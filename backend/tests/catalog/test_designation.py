import json
from pathlib import Path
from typing import Any

import pytest

from app.modules.catalog.designation import bore_from_code, decode

GOLDEN = json.loads((Path(__file__).parent / "data" / "golden.json").read_text())["decode"]


def segments(text: str) -> list[tuple[str, str, str | None, int | None]]:
    return [(s.token, s.kind, s.id, s.bore_mm) for s in decode(text).segments]


# Intended differences from the TypeScript decoder the golden file was recorded from (frontend/lib/domain/
# designation.ts, 2026-09-29). Everything else must match it exactly.
FIXED: dict[str, list[tuple[str, str, str | None, int | None]]] = {
    # it crashed on a lone slash
    "/": [],
    # spaces separate parts, as SKF writes designations (the whole text was one unknown token)
    "6205 M": [("62", "series", "deep-groove", None), ("05", "bore", None, 25), ("M", "suffix", "brass-cage", None)],
    "7205 BE": [("72", "series", "angular-contact", None), ("05", "bore", None, 25), ("BE", "unknown", None, None)],
    "22212 EK": [("222", "series", "spherical-roller", None), ("12", "bore", None, 60), ("EK", "unknown", None, None)],
    "w 6205": [
        ("W", "prefix", "w-stainless", None),
        ("62", "series", "dimension-series", None),
        ("05", "bore", None, 25),
    ],
    "YAR 205-2F": [("YAR", "unknown", None, None), ("205", "unknown", None, None), ("2F", "unknown", None, None)],
    "SY 25 TF": [("SY", "unknown", None, None), ("25", "unknown", None, None), ("TF", "unknown", None, None)],
    "LGMT 2": [("LGMT", "unknown", None, None), ("2", "unknown", None, None)],
    # GE numbers are the bore in mm (it read "20" as bore code 20 = 100 mm)
    "GE20": [("GE", "prefix", "ge", None), ("20", "bore", None, 20)],
    "GE 20": [("GE", "prefix", "ge", None), ("20", "bore", None, 20)],
    # 160xx is a deep groove series (the "16" check could never match)
    "16005": [("160", "series", "deep-groove", None), ("05", "bore", None, 25)],
    # the bore after a slash, in mm (it read the series digits "62" as bore code 62 = 310 mm)
    "62/22": [("62", "series", "deep-groove", None), ("22", "bore", None, 22)],
    # two digits alone are a series still missing its bore code
    "62": [("62", "series", "deep-groove", None)],
}


def ts_segments(output: dict[str, Any] | None) -> list[tuple[str, str, str | None, int | None]]:
    if output is None:  # TS returned null; the API answers with no segments
        return []
    return [(s["token"], s["kind"], s.get("id"), s.get("boreMm")) for s in output["segments"]]


@pytest.mark.parametrize("case", GOLDEN, ids=lambda c: repr(c["input"]))
def test_matches_the_typescript_decoder(case: dict[str, Any]) -> None:
    text = case["input"]
    if text in FIXED:
        assert segments(text) == FIXED[text]
        return
    assert "error" not in case
    assert segments(text) == ts_segments(case["output"])
    assert decode(text).bore_mm == (case["output"]["boreMm"] if case["output"] else None)


def test_every_fix_is_a_recorded_case() -> None:
    assert set(FIXED) <= {c["input"] for c in GOLDEN}


def test_more_skf_designations() -> None:
    assert segments("NU 208 ECP") == [
        ("NU", "prefix", "nu", None),
        ("2", "series", "dimension-series", None),
        ("08", "bore", None, 40),
        ("ECP", "unknown", None, None),
    ]
    assert segments("62/22-2Z") == [
        ("62", "series", "deep-groove", None),
        ("22", "bore", None, 22),
        ("2Z", "suffix", "2z", None),
    ]
    assert segments("230/500 CA/W33") == [
        ("230", "series", "spherical-roller", None),
        ("500", "bore", None, 500),
        ("CA", "unknown", None, None),
        ("W33", "unknown", None, None),
    ]
    assert segments("6205-2RSH / C3") == segments("6205-2RSH/C3")
    assert decode("   ").segments == ()


def test_bore_codes() -> None:
    assert [bore_from_code(c) for c in ("00", "01", "02", "03", "04", "05", "96")] == [10, 12, 15, 17, 20, 25, 480]
    assert bore_from_code("5") is None
    assert bore_from_code("A5") is None
