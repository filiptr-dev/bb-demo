"""Builds the system prompt from prompts/system.md. Everything but the site language is static, so Gemini's
implicit prompt caching can reuse it."""

from functools import cache
from pathlib import Path

PROMPT_FILE = Path(__file__).parent.parent / "prompts" / "system.md"

# English names, as in the frontend's messages (ProductCategories.<slug>.name)
CATEGORIES = {
    "bearings": "Bearings",
    "housings": "Housings",
    "seals": "Seals",
    "sleeves": "Adapter sleeves",
    "belts-chains": "Belts, chains",
    "bushings": "Bushings",
    "nuts": "Lock nuts",
    "speedi-sleeve": "SKF Speedi-Sleeve",
    "food-industry": "Food industry products",
    "pulley-alignment": "Pulley alignment tools",
    "monitoring-instruments": "Monitoring instruments",
    "mounting-tools": "Mounting and dismounting tools",
    "maintenance": "Maintenance",
    "shim-packs": "SKF TMAS shim packs",
    "greases": "Greases",
    "lubrication-systems": "Lubrication systems",
    "automatic-lubricators": "Automatic lubricators",
    "vibracon": "SKF VIBRACON",
    "composite-housing-units": "Composite housing units",
    "y-bearings": "Y-bearings and units",
}
INDUSTRIES = ("cement", "metallurgy", "paper", "power", "mining", "chemical", "food", "recycling")
LOCALE_NAMES = {
    "mk": "Macedonian",
    "en": "English",
    "sq": "Albanian",
    "de": "German",
    "tr": "Turkish",
    "ru": "Russian",
    "it": "Italian",
    "el": "Greek",
    "bg": "Bulgarian",
    "sk": "Slovak",
}


@cache
def _template() -> str:
    return PROMPT_FILE.read_text(encoding="utf-8")


def system_prompt(locale: str) -> str:
    return (
        _template()
        .replace("{locale_name}", LOCALE_NAMES.get(locale, LOCALE_NAMES["mk"]))
        .replace("{categories}", ", ".join(f"[{name}](/products/{slug})" for slug, name in CATEGORIES.items()))
        .replace("{industries}", ", ".join(f"/industries/{i}" for i in INDUSTRIES))
    )
