"""How a free-text product search is read: designation, dimensions or words. No SQL here; the repository turns a
`SearchCriteria` into a query. Ported from frontend/lib/search.ts and server/products.ts."""

import json
import re
from dataclasses import dataclass, field
from functools import cache
from pathlib import Path

from app.modules.products.schemas import ProductSearch, SortKey

VOCABULARY_FILE = Path(__file__).with_name("search_vocabulary.json")

_NUMBER = r"(\d+(?:[.,]\d+)?)"
_SEP = r"\s*[x\u00d7*\s]\s*"  # x, the multiplication sign, * or a space
# "25x52x15", "25 52 15", "25*52" (d and D only). re.ASCII: \d is 0-9 only, like JavaScript.
_DIMS = re.compile(rf"^{_NUMBER}{_SEP}{_NUMBER}(?:{_SEP}{_NUMBER})?$", re.IGNORECASE | re.ASCII)
_PLAIN_NUMBER = re.compile(r"^\d+(?:[.,]\d+)?$", re.ASCII)
_NOT_KEY = re.compile(r"[^A-Z0-9]")


def normalize(s: str) -> str:
    """The designation search key: upper case, letters and digits only ("6205-2rsh" → "62052RSH")."""
    return _NOT_KEY.sub("", s.upper())


def _number(s: str) -> float:
    return float(s.replace(",", ".", 1))


def parse_dims(q: str) -> tuple[float, float, float | None] | None:
    m = _DIMS.match(q.strip())
    if not m:
        return None
    d, outer_d, width = m.groups()
    return _number(d), _number(outer_d), _number(width) if width else None


@dataclass(frozen=True)
class WordMatch:
    """One search word and the codes whose names (in the search language) contain it."""

    word: str
    types: list[str]
    seals: list[str]
    bores: list[str]
    industries: list[str]


@dataclass(frozen=True)
class TextQuery:
    key: str  # normalize(q); "" when q has no letters or digits
    number: float | None  # q is a plain number: also match it against d, D and B
    words: list[WordMatch]


@dataclass(frozen=True)
class DimsQuery:
    d: float
    outer_d: float
    width: float | None


@dataclass(frozen=True)
class SearchCriteria:
    query: TextQuery | DimsQuery | None  # None: no search text, every row matches
    type: str | None = None
    bore: str | None = None
    seal: str | None = None
    industries: list[str] = field(default_factory=list)
    ranges: dict[str, tuple[float | None, float | None]] = field(default_factory=dict)  # d | D | B → (min, max)
    sort: SortKey | None = None
    descending: bool = False
    limit: int = 24
    offset: int = 0


class Vocabulary:
    """The words search understands per language, exported from the frontend's messages
    (`npm run search-vocabulary` in frontend/)."""

    def __init__(self, data: dict[str, object]) -> None:
        self.default_locale = str(data["defaultLocale"])
        self._locales: dict[str, dict[str, dict[str, list[str]]]] = data["locales"]  # type: ignore[assignment]

    @property
    def locales(self) -> list[str]:
        return list(self._locales)

    def match(self, locale: str, word: str) -> WordMatch:
        groups = self._locales.get(locale) or self._locales[self.default_locale]

        def codes(group: str) -> list[str]:
            return [code for code, terms in groups[group].items() if any(word in t for t in terms)]

        return WordMatch(word, codes("types"), codes("seals"), codes("bores"), codes("industries"))


@cache
def vocabulary() -> Vocabulary:
    return Vocabulary(json.loads(VOCABULARY_FILE.read_text(encoding="utf-8")))


def text_query(q: str, locale: str, vocab: Vocabulary) -> TextQuery | DimsQuery | None:
    q = q.strip()
    if dims := parse_dims(q):
        return DimsQuery(*dims)
    words = q.lower().split()
    if not words:
        return None
    key = normalize(q)
    number = _number(q) if key and _PLAIN_NUMBER.match(q) else None
    return TextQuery(key, number, [vocab.match(locale, w) for w in words])


def criteria(params: ProductSearch, vocab: Vocabulary) -> SearchCriteria:
    ranges = {
        "d": (params.d_min, params.d_max),
        "D": (params.outer_d_min, params.outer_d_max),
        "B": (params.width_min, params.width_max),
    }
    return SearchCriteria(
        query=text_query(params.search, params.locale, vocab),
        type=params.type,
        bore=params.bore,
        seal=params.seal,
        industries=[i for i in params.industry if i],
        ranges={k: r for k, r in ranges.items() if r != (None, None)},
        sort=params.sort,
        descending=params.dir == "desc",
        limit=params.per_page,
        offset=params.paging.offset,
    )
