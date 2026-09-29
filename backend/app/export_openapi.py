"""Writes the API contract to backend/openapi.json: `uv run python -m app.export_openapi`.

The frontend generates its types from that file (`npm run api:types` in frontend/), and CI (contract.yml) fails
when either one is stale.
"""

import json
from pathlib import Path

from app.core.settings import Settings
from app.main import create_app

OUT = Path(__file__).resolve().parent.parent / "openapi.json"


def main() -> None:
    # The schema doesn't depend on any setting; the database is never contacted (no lifespan runs).
    app = create_app(Settings(_env_file=None, database_url="postgresql://unused@localhost/none"))
    OUT.write_text(json.dumps(app.openapi(), indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"wrote {OUT}")


if __name__ == "__main__":
    main()
