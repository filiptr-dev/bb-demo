"""The model ends each answer with a footer the user never sees:

    [[confidence:v1 score=85 status=supported reason=Values from the SKF data sheet]]

`FooterFilter` passes streamed text through and holds back anything that may be the start of the footer, so the
footer never reaches the browser; `finish()` returns the parsed confidence and any text that turned out not to be it.
"""

import re
from dataclasses import dataclass

from app.modules.assistant.schemas import ConfidenceEvent, ConfidenceStatus

OPEN = "[["
_FOOTER = re.compile(
    r"\[\[\s*confidence(?::v1)?\s+(?P<body>.*?)\]\]",
    re.IGNORECASE | re.DOTALL,
)
_FIELD = re.compile(r"(score|status|reason)\s*=\s*(.*?)(?=\s+(?:score|status|reason)\s*=|$)", re.DOTALL)
_STATUSES: dict[str, ConfidenceStatus] = {
    s: s for s in ("supported", "bounded", "partial", "insufficient", "conflicting", "not_applicable")
}


@dataclass(frozen=True)
class Finished:
    text: str  # held-back text that wasn't a footer, to send after all
    confidence: ConfidenceEvent | None


def parse_footer(raw: str) -> tuple[ConfidenceEvent | None, str]:
    """(confidence, `raw` without the footer). A footer that doesn't parse is still removed."""
    m = _FOOTER.search(raw)
    if not m:
        return None, raw
    rest = (raw[: m.start()] + raw[m.end() :]).rstrip()
    return _confidence(m.group("body")), rest


def _confidence(body: str) -> ConfidenceEvent | None:
    fields = {k.lower(): v.strip() for k, v in _FIELD.findall(body.strip())}
    status = _STATUSES.get(fields.get("status", "").lower())
    if status is None:
        return None
    score_text = fields.get("score", "")
    score = min(100, max(0, int(score_text))) if score_text.isdigit() else None
    if status == "not_applicable":
        score = None
    return ConfidenceEvent(score=score, status=status, reason=fields.get("reason") or None)


class FooterFilter:
    def __init__(self) -> None:
        self._held = ""

    def feed(self, text: str) -> str:
        """The part of `text` that is safe to send now."""
        data = self._held + text
        start = data.find(OPEN)
        if start >= 0:
            self._held = data[start:]
            return data[:start]
        # a lone "[" at the very end may become "[["
        if data.endswith("["):
            self._held = "["
            return data[:-1]
        self._held = ""
        return data

    def finish(self) -> Finished:
        held, self._held = self._held, ""
        confidence, rest = parse_footer(held)
        return Finished(text=rest, confidence=confidence)
