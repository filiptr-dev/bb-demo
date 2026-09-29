import json
from pathlib import Path

from app.modules.catalog.service import GREASE_GUIDE

GOLDEN = json.loads((Path(__file__).parent / "data" / "golden.json").read_text())["greases"]


def test_same_data_as_the_typescript_chart() -> None:
    guide = GREASE_GUIDE.model_dump(mode="json")
    assert guide["basic"] == GOLDEN["basic"]
    assert guide["columns"] == GOLDEN["columns"]
    assert guide["chart"] == GOLDEN["chart"]
    assert guide["compatibility"] == {"groups": GOLDEN["compatibilityGroups"], "matrix": GOLDEN["compatibility"]}


def test_compatibility_is_symmetric() -> None:
    m = GREASE_GUIDE.compatibility.matrix
    assert all(m[r][c] == m[c][r] for r in range(len(m)) for c in range(len(m)))
    assert all(m[i][i] == "=" for i in range(len(m)))
