# Backend (FastAPI)

The B&B Unikoop API. It owns the database and all business logic. The frontend only renders. Architecture and phase plan: `../docs/architecture-plan.md`.

## Commands (run from `backend/`)

| What | Command |
|---|---|
| Install / sync deps | `uv sync` |
| Database for dev + tests | `docker compose up -d db` (from the repo root; Postgres 17 on localhost:5433) |
| Dev server | `uv run uvicorn app.main:create_app --factory --reload` → http://localhost:8000/docs |
| Tests | `uv run pytest` (needs the compose db, or `TEST_DATABASE_URL`) |
| Migrate the DB | `uv run alembic upgrade head` (uses `DATABASE_URL`) |
| New migration | `uv run alembic revision --autogenerate -m "add specs" --rev-id 0002` (next number; review it before committing) |
| Lint + format | `uv run ruff check . && uv run ruff format .` |
| Types | `uv run mypy .` (strict) |
| Import the catalog | `uv run python -m app.cli products-import [--dry]` (bearingworld + `products/seed.py`) |
| Scrape SKF data sheets | `uv run python -m app.cli specs-scrape [--all] [--limit N] [DESIGNATION ...]` (resumable) |
| Add a dependency | `uv add <pkg>` / `uv add --dev <pkg>` (never edit uv.lock by hand) |

CI (`.github/workflows/backend.yml`) runs format check, ruff, mypy, pytest and a Docker build. Keep all of them green.

## Layout

- `app/main.py`: `create_app()` factory: middleware, CORS, error handlers, and every module router under `/api/v1`.
- `app/core/`: shared infrastructure.
  - `settings.py`: every env var, typed.
  - `db.py`: engine, session dependency, `Base` for models.
  - `errors.py`: `ApiError` → RFC 9457 problem+json.
  - `pagination.py`: `Page[T]` envelope + `Paging` params.
  - `schemas.py`: `ApiModel` base.
  - `revalidator.py`: tells the frontend to refresh cached pages (Next.js tags) after a data change.
- `app/cli.py`: the data jobs (`python -m app.cli ...`), run by hand against `DATABASE_URL`.
- `migrations/`: Alembic. `env.py` takes the URL from the app settings and the tables from `Base.metadata` (`app/core/db.py`). Revisions are numbered `0001_baseline.py`, `0002_...`.
- `app/modules/<name>/`, one folder per feature:
  - `router.py`: thin. Validated input in → service → response schema out.
  - `schemas.py`: Pydantic request/response models, subclass `ApiModel` (camelCase JSON). These are the public contract.
  - `models.py`: SQLAlchemy models, subclass `Base` from `app/core/db.py`. Import them in `migrations/env.py` so autogenerate sees them.
  - `repository.py`: a `Protocol` + the Postgres implementation. **The only place with SQL.**
  - `service.py`: business rules. The module's public API.
  - `deps.py`: `Depends` wiring session → repository → service. Tests override it with `app.dependency_overrides`.

## Modules

- `health`: `/health` (checks the DB, for the keep-alive cron) and `/health/live` (no DB, for Render's health check).
- `products`: catalog search, detail, related, per-industry lists, stats, sitemap rows. `search.py` reads the search text (designation, dimensions, words) into `SearchCriteria`, and `repository.py` turns that into SQL. Free-text words are matched against `search_vocabulary.json`, which is generated from the frontend's messages: after changing type/seal/bore/industry names there, run `npm run search-vocabulary` in `frontend/` (CI fails otherwise). `tests/products/test_parity.py` checks the output against golden files recorded from the old TypeScript query layer, on `tests/products/data/products.csv.gz` (the real 15,420 rows). `importer.py` scrapes the bearingworld SKF catalog and merges it with `seed.py` (our stocked products, which win); `replace_all` upserts and deletes rows that are gone.
- `specs`: SKF technical data per product (C, C0, Pu, speeds, mass, calculation factors, full data sheet), `GET /products/{slug}/specs` (404 `specs_not_found`). `scraper.py` reads SKF's own search JSON; misses are stored with `found = false` so they aren't asked again. Tests use recorded responses in `tests/specs/data/`, never the live site.
- `catalog`: bearing know-how with no table of its own (so no repository): `designation.py` (the decoder), `greases.py` (SKF grease chart + compatibility), `calculations.py` (ISO 281 rating life, equivalent load from the SKF factors, SKF relubrication interval). `GET /catalog/decode`, `/catalog/greases`, `/catalog/rating-life`, `/catalog/relubrication`; the last two read the product and its specs through `ProductService`/`SpecService`. `tests/catalog/data/golden.json` was recorded from the old TypeScript decoder and grease data; `test_designation.py` lists every case where the port intentionally differs.

## Rules

1. Router → Service → Repository. Modules call each other only through services, never another module's repository or models.
2. Expected failures: `raise ApiError(status, "snake_case_code", "Human detail")`. Never return error dicts by hand. The frontend maps `code` to i18n text, so codes are stable once shipped.
3. Every schema change is an Alembic migration. Nothing Supabase-specific (RLS, Supabase Auth, anon/authenticated roles) goes in code or migrations: the DB will move to a self-hosted Postgres.
4. Stateless process: no local files, no in-memory state that must survive a restart, logs to stderr. Post-response work uses `BackgroundTasks`.
5. Response and request bodies are `ApiModel` subclasses, never ORM objects or bare dicts, so the OpenAPI contract stays exact.
6. SKF only: never add data, copy or prompts naming other bearing brands.
