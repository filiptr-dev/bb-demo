import pytest

from app.modules.assistant.markup import MarkupFilter, plain_math

SHEET = "https://www.skf.com/group/products/rolling-bearings/ball-bearings/deep-groove-ball-bearings/productid-6205"


def clean(text: str, allowed: set[str] | None = None) -> str:
    return MarkupFilter(lambda: allowed or set()).finish(text)


def streamed(text: str, allowed: set[str] | None = None, size: int = 1) -> str:
    """The same text fed in `size`-character chunks, as the model streams it."""
    f = MarkupFilter(lambda: allowed or set())
    out = [f.feed(text[i : i + size]) for i in range(0, len(text), size)]
    return "".join(out) + f.finish()


@pytest.mark.parametrize(
    ("text", "expected"),
    [
        ("See the [data sheet](https://www.skf.com/made/up/6205).", "See the data sheet."),
        (f"See the [data sheet]({SHEET}).", f"See the [data sheet]({SHEET})."),
        (f"See the [data sheet]({SHEET}/).", f"See the [data sheet]({SHEET}/)."),  # trailing slash is the same page
        ("Open [6205](/catalog/6205) or [contact](/contact).", "Open [6205](/catalog/6205) or [contact](/contact)."),
        ("Look at https://www.skf.com/made/up, please.", "Look at skf.com, please."),
        (f"Look at {SHEET}.", f"Look at {SHEET}."),
        ("Basic rating life ($L_{10}$) with $a_1 = 1$.", "Basic rating life (L10) with a1 = 1."),
        ("$C_0 \\approx 7.8$ kN and $P \\cdot 2$", "C0 ≈ 7.8 kN and P · 2"),
        ("Costs $5 or $10 each.", "Costs $5 or $10 each."),  # money, not a formula
        ("Footnote [1] and [a] list", "Footnote [1] and [a] list"),
        ("a https-like word: httpd and h", "a https-like word: httpd and h"),
    ],
)
def test_markup(text: str, expected: str) -> None:
    allowed = {SHEET}
    assert clean(text, allowed) == expected
    for size in (1, 3, 7):
        assert streamed(text, allowed, size) == expected


def test_holds_back_only_what_may_be_a_construct() -> None:
    f = MarkupFilter(set)
    assert f.feed("The 6205 [data") == "The 6205 "
    assert f.feed(" sheet](https://x") == ""
    assert f.feed(".com/a) done") == "data sheet done"
    assert f.feed(" and $L_") == " and "
    assert f.finish("{10}$") == "L10"


def test_unfinished_at_the_end_is_sent_as_is() -> None:
    f = MarkupFilter(set)
    assert f.feed("Ends with [half a link") == "Ends with "
    assert f.finish() == "[half a link"


def test_allowed_urls_are_read_when_the_link_completes() -> None:
    urls: set[str] = set()
    f = MarkupFilter(lambda: urls)
    assert f.feed("[sheet](") == ""
    urls.add(SHEET)  # a tool returned it while the link was streaming
    assert f.finish(f"{SHEET})") == f"[sheet]({SHEET})"


def test_plain_math() -> None:
    assert plain_math(r"L_{10} = \left(\frac{C}{P}\right)^3") == "L10 = (C/P)^3"
    assert plain_math(r"\text{h}_{10}") == "h10"
