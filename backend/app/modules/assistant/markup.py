"""Cleans the model's streamed Markdown before it reaches the browser (and the saved history).

- Links to other sites stay only when a tool returned that url (an SKF data sheet). The model sometimes makes up
  skf.com paths when the specs are missing: a made-up Markdown link keeps just its words, a made-up bare url
  becomes its host ("skf.com"), which isn't a link. Site links ("/catalog/6205") pass.
- Inline LaTeX (`$L_{10}$`, `$a_1 = 1$`) becomes plain text ("L10", "a1 = 1"), although the prompt forbids it.

`MarkupFilter` holds back text that may be the start of a link, url or formula until it is complete, like
`FooterFilter` does for the confidence footer.
"""

import re
from collections.abc import Callable
from urllib.parse import urlsplit

_LINK = re.compile(r"\[([^\]\n]{0,200})\]\(([^)\s]{0,500})\)")
_LINK_START = re.compile(r"\[[^\]\n]{0,200}(?:\](?:\([^)\s]{0,500})?)?")
_URL = re.compile(r"https?://[^\s<>()\[\]]+")
_URL_START = re.compile(r"h(?:t(?:t(?:p(?:s?(?::(?:/(?:/[^\s<>()\[\]]*)?)?)?)?)?)?)?")
_MATH = re.compile(r"\$([^$\n]{1,80})\$")
_MATH_START = re.compile(r"\$[^$\n]{0,80}")
_TEX = re.compile(r"[\\_^{}]")  # "$5 or $10" is money, not a formula
_TEX_WORDS = {"cdot": "·", "times": "\u00d7", "approx": "≈", "leq": "≤", "le": "≤", "geq": "≥", "ge": "≥", "circ": "°"}
_TRAILING = ".,;:!?'\""


def plain_math(tex: str) -> str:
    """`L_{10} \\approx 405` → `L10 ≈ 405`."""
    text = re.sub(r"\\(?:text|mathrm|mathbf|operatorname)\{([^}]*)\}", r"\1", tex)
    text = re.sub(r"\\frac\{([^}]*)\}\{([^}]*)\}", r"\1/\2", text)
    text = re.sub(r"\\(?:left|right)\b", "", text)
    text = re.sub(r"\\([A-Za-z]+)", lambda m: _TEX_WORDS.get(m.group(1), m.group(1)), text)
    return re.sub(r"[_{}\\]", "", text).strip()


def _host(url: str) -> str:
    return (urlsplit(url).hostname or "").removeprefix("www.")


def _same(url: str) -> str:
    return url.rstrip("/").lower()


class MarkupFilter:
    def __init__(self, allowed: Callable[[], set[str]]) -> None:
        self._allowed = allowed  # urls the tools returned so far, read when a link completes
        self._held = ""

    def _ok(self, url: str) -> bool:
        return _same(url) in {_same(u) for u in self._allowed()}

    def _link(self, m: re.Match[str]) -> str:
        label, url = m.group(1), m.group(2)
        if re.match(r"https?://", url, re.IGNORECASE) and not self._ok(url):
            return label
        return m.group(0)

    def _url(self, url: str) -> str:
        return url if self._ok(url) else _host(url)

    def _clean(self, data: str, final: bool) -> str:
        """Cleans `data`; unless `final`, an unfinished construct at the end is kept in `_held`."""
        out: list[str] = []
        i = 0
        while i < len(data):
            c = data[i]
            rest = data[i:]
            if c == "[":
                if m := _LINK.match(rest):
                    out.append(self._link(m))
                    i += m.end()
                    continue
                if not final and (p := _LINK_START.match(rest)) and p.end() == len(rest):
                    break
            elif c == "$":
                if (m := _MATH.match(rest)) and _TEX.search(m.group(1)):
                    out.append(plain_math(m.group(1)))
                    i += m.end()
                    continue
                if not final and (p := _MATH_START.match(rest)) and p.end() == len(rest):
                    break
            elif c in "hH" and (i == 0 or not data[i - 1].isalnum()):
                m = _URL.match(rest)
                if m and (final or m.end() < len(rest)):
                    url = m.group(0).rstrip(_TRAILING)
                    out.append(self._url(url))
                    i += len(url)
                    continue
                if not final and (m or ((p := _URL_START.match(rest.lower())) and p.end() == len(rest))):
                    break
            out.append(c)
            i += 1
        self._held = "" if final else data[i:]
        return "".join(out)

    def feed(self, text: str) -> str:
        """The part of `text` that is safe to send now."""
        return self._clean(self._held + text, final=False)

    def finish(self, text: str = "") -> str:
        """The rest, at the end of the answer."""
        return self._clean(self._held + text, final=True)
