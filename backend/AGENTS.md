# Backend (FastAPI)

The B&B Unikoop API. It owns the database and all business logic. The frontend only renders. Architecture and phase plan: `../docs/architecture-plan.md`.

## Commands (run from `backend/`)

| What | Command |
|---|---|
| Install / sync deps | `uv sync` |
| Database for dev + tests | `docker compose up -d db` (from the repo root; Postgres 17 on localhost:5433) |
| Dev server | `uv run uvicorn app.main:create_app --factory --reload` → http://localhost:8000/docs |
| Tests | `uv run pytest` (needs the compose db, or `TEST_DATABASE_URL`) |
| Lint + format | `uv run ruff check . && uv run ruff format .` |
| Types | `uv run mypy .` (strict) |
| Add a dependency | `uv add <pkg>` / `uv add --dev <pkg>` (never edit uv.lock by hand) |

CI (`.github/workflows/backend.yml`) runs format check, ruff, mypy, pytest and a Docker build. Keep all of them green.

## Layout

- `app/main.py`: `create_app()` factory: middleware, CORS, error handlers, and every module router under `/api/v1`.
- `app/core/`: shared infrastructure.
  - `settings.py`: every env var, typed.
  - `db.py`: engine, session dependency.
  - `errors.py`: `ApiError` → RFC 9457 problem+json.
  - `pagination.py`: `Page[T]` envelope + `Paging` params.
  - `schemas.py`: `ApiModel` base.
- `app/modules/<name>/`, one folder per feature:
  - `router.py`: thin. Validated input in → service → response schema out.
  - `schemas.py`: Pydantic request/response models, subclass `ApiModel` (camelCase JSON). These are the public contract.
  - `models.py`: SQLAlchemy models.
  - `repository.py`: a `Protocol` + the Postgres implementation. **The only place with SQL.**
  - `service.py`: business rules. The module's public API.
  - `deps.py`: `Depends` wiring session → repository → service. Tests override it with `app.dependency_overrides`.

## Rules

1. Router → Service → Repository. Modules call each other only through services, never another module's repository or models.
2. Expected failures: `raise ApiError(status, "snake_case_code", "Human detail")`. Never return error dicts by hand. The frontend maps `code` to i18n text, so codes are stable once shipped.
3. Every schema change is an Alembic migration. Nothing Supabase-specific (RLS, Supabase Auth, anon/authenticated roles) goes in code or migrations: the DB will move to a self-hosted Postgres.
4. Stateless process: no local files, no in-memory state that must survive a restart, logs to stderr. Post-response work uses `BackgroundTasks`.
5. Response and request bodies are `ApiModel` subclasses, never ORM objects or bare dicts, so the OpenAPI contract stays exact.
6. SKF only: never add data, copy or prompts naming other bearing brands.
