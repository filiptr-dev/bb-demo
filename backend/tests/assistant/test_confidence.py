import pytest

from app.modules.assistant.confidence import FooterFilter, parse_footer
from app.modules.assistant.schemas import ConfidenceEvent


def test_parse_footer() -> None:
    raw = "The 6205 has C = 14.8 kN.\n\n[[confidence:v1 score=92 status=supported reason=SKF data sheet values]]"
    confidence, rest = parse_footer(raw)
    assert confidence == ConfidenceEvent(score=92, status="supported", reason="SKF data sheet values")
    assert rest == "The 6205 has C = 14.8 kN."


@pytest.mark.parametrize(
    ("footer", "expected"),
    [
        ("[[confidence score=150 status=bounded]]", ConfidenceEvent(score=100, status="bounded")),
        ("[[ CONFIDENCE:v1 status=Partial score=40 ]]", ConfidenceEvent(score=40, status="partial")),
        ("[[confidence:v1 score=abc status=insufficient]]", ConfidenceEvent(score=None, status="insufficient")),
        (
            "[[confidence:v1 score=80 status=not_applicable reason=asked back]]",
            ConfidenceEvent(score=None, status="not_applicable", reason="asked back"),
        ),
        ("[[confidence:v1 score=80 status=great]]", None),  # unknown status: dropped, still removed
    ],
)
def test_footer_variants(footer: str, expected: ConfidenceEvent | None) -> None:
    confidence, rest = parse_footer(f"Answer. {footer}")
    assert confidence == expected
    assert rest == "Answer."


def test_no_footer() -> None:
    assert parse_footer("Just text [with] brackets") == (None, "Just text [with] brackets")


def stream(pieces: list[str]) -> tuple[str, ConfidenceEvent | None]:
    footer = FooterFilter()
    sent = "".join(footer.feed(p) for p in pieces)
    finished = footer.finish()
    return sent + finished.text, finished.confidence


def test_filter_never_sends_the_footer() -> None:
    pieces = ["The answer", " is 42.", "\n\n[", "[confid", "ence:v1 score=70 ", "status=supported]]"]
    footer = FooterFilter()
    sent = [footer.feed(p) for p in pieces]
    assert "".join(sent) == "The answer is 42.\n\n"
    assert not any("[" in s for s in sent)
    assert footer.finish().confidence == ConfidenceEvent(score=70, status="supported")


def test_filter_releases_brackets_that_are_not_a_footer() -> None:
    assert stream(["See [SKF](https://skf.com", ") and [", "x]"]) == ("See [SKF](https://skf.com) and [x]", None)
    assert stream(["a [[b]] c"]) == ("a [[b]] c", None)  # held until the end, then sent after all
