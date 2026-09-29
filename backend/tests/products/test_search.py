import pytest

from app.modules.products.search import DimsQuery, TextQuery, normalize, parse_dims, text_query, vocabulary


def test_normalize_keeps_letters_and_digits() -> None:
    assert normalize("6205-2rsh/c3") == "62052RSHC3"
    assert normalize("  ") == ""


@pytest.mark.parametrize(
    ("q", "dims"),
    [
        ("25x52x15", (25, 52, 15)),
        ("25 52 15", (25, 52, 15)),
        ("25 \u00d7 52", (25, 52, None)),  # the multiplication sign
        ("12,7*40", (12.7, 40, None)),
        ("25X52", (25, 52, None)),
        ("6205", None),
        ("25x52x15x3", None),
        ("\u0662\u0665x\u0665\u0662", None),  # Arabic-Indic digits: JavaScript's \d doesn't match them either
    ],
)
def test_parse_dims(q: str, dims: tuple[float, float, float | None] | None) -> None:
    assert parse_dims(q) == dims


def test_text_query_kinds() -> None:
    v = vocabulary()
    assert text_query("  ", "en", v) is None
    assert text_query("25x52", "en", v) == DimsQuery(25, 52, None)
    q = text_query("25", "en", v)
    assert isinstance(q, TextQuery)
    assert (q.key, q.number) == ("25", 25)


def test_words_match_names_in_the_search_language() -> None:
    v = vocabulary()
    assert "tapered-roller" in v.match("mk", "конусни").types
    assert v.match("mk", "рудници").industries == ["mining"]
    assert "tapered" in v.match("en", "tapered").bores
    # slugs work in every language
    assert "deep-groove" in v.match("de", "deep-groove").types


def test_unknown_locale_falls_back_to_the_default() -> None:
    v = vocabulary()
    assert v.match("xx", "рудници") == v.match(v.default_locale, "рудници")


def test_vocabulary_has_every_site_language() -> None:
    assert sorted(vocabulary().locales) == sorted(["mk", "en", "sq", "de", "tr", "ru", "it", "el", "bg", "sk"])
