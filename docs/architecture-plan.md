# B&B Unikoop: architecture and migration plan

Status: **in progress** (started 2026-09-29). Phases 1 (monorepo move), 2 (backend skeleton + CI/CD) and 3 (baseline migration) are built. Next: Phase 4.

History: the first version of this plan (2026-09-28) used Laravel. On 2026-09-29 the backend was switched to **Python (FastAPI)**. Nothing had been built yet, so only the plan changed. The goals are the same: a separate API that owns the DB, and nothing Supabase-specific.

## 1. Decisions

| Topic | Decision | Why |
|---|---|---|
| Repo | **Monorepo**: `frontend/` (Next.js), `backend/` (FastAPI), one git repo | One PR can change the API and its consumer together. The OpenAPI contract and its generated TS types stay in sync. Each host deploys only its own folder |
| Backend | FastAPI (Python 3.14), owns the DB and all business logic, everything under `/api/v1` | Typed end to end (Pydantic), OpenAPI built in, async streaming for the assistant, first-class Gemini SDK |
| Frontend | Next.js 16, renders only, fetches from the API with ISR + cache tags | The catalog is mostly static, so the API is rarely hit |
| DB | Postgres. Supabase for now, own server later | Moving = new `DATABASE_URL` + `alembic upgrade head` |
| DB access | SQLAlchemy 2 (async) + psycopg 3. Migrations: **Alembic** | DB-agnostic migrations in git. Search SQL stays raw (pg_trgm, natural sort) |
| Contract | FastAPI `openapi.json` → `openapi-typescript` → `frontend/lib/api/schema.d.ts`, used through `openapi-fetch` | One typed contract. CI fails if it drifts |
| Auth (later) | JWT / session auth for an admin (fastapi-users or a small own module), admin UI via the Next app or `sqladmin` | No Supabase Auth |
| AI | Gemini through `google-genai` (official SDK): `gemini-3.5-flash-lite` → fallback `gemini-3.8-flash` | The fallback is needed: flash-lite returned 503 "high demand" and 60 s timeouts in testing |
| Rate limit | A small Postgres-backed fixed-window limiter (`core/ratelimit.py`), Redis later | Stateless: works on any number of instances |
| Tooling | `uv` (deps + lockfile), `ruff` (lint + format), `mypy` (strict), `pytest` + `httpx` | Fast, standard, one lockfile |

## 2. Hosting (all free tier)

| Part | Service | Free-tier facts (checked 2026-09-28) | Notes |
|---|---|---|---|
| Frontend | **Vercel Hobby** | Free | Root Directory = `frontend`. ⚠ Hobby is for **non-commercial** use. When the client goes live commercially → Vercel Pro ($20/mo) or self-host |
| Backend | **Render free web service** (Docker) | No card. Sleeps after 15 min idle, ~1 min cold start. 750 instance-h/month, 512 MB RAM. Single instance, no disk, filesystem wiped on restart, may restart at any time | Keep-alive ping (below) keeps it awake: one service 24/7 ≈ 744 h < 750 h. **Only one free service** fits this way (no free staging) |
| Keep-alive | **cron-job.org** (free) | Calls `GET /api/v1/health` every 10 min | Health runs `select 1`, which also stops **Supabase free from pausing the project after 7 days idle**. Render's own health check uses `/api/v1/health/live` (no DB), so a DB outage doesn't block deploys |
| DB | Supabase free (for now) | 500 MB | The API connects through the **session pooler, port 5432**. Render is IPv4-only and Supabase's direct host is IPv6-only |
| AI | Google AI Studio Gemini API key | Free tier. Limits per project: see aistudio.google.com/rate-limit | ⚠ Free-tier prompts may be used by Google to improve its products. Before real customers use it, link billing (Tier 1, spend-capped) |

Alternatives, if Render's cold starts or limits get in the way:
- **Google Cloud Run**: the best upgrade. Scales to zero with ~1–3 s cold starts, and the free allowance is 2M requests/month. It's the same Google account as Gemini. It **needs a card**, so set a budget alert and `max-instances=2`. The same Docker image runs there unchanged.
- **Oracle Cloud Always Free**: an always-on ARM VM, 2 OCPU / 12 GB since the 2026 cut. No cold starts, but you manage the server yourself, and sign-up and capacity are unreliable.
- **Not free any more:** Fly.io (no free tier for new users), Koyeb (card + $29 plan since Feb 2026), Railway (trial, then $1/month credit).

## 3. Repo layout

```
/
├─ CLAUDE.md                 → points to frontend/AGENTS.md + backend/AGENTS.md
├─ docs/                     architecture-plan.md, ADRs later
├─ docker-compose.yml        local dev: postgres:17 + backend (frontend runs with npm run dev)
├─ .github/
│   ├─ workflows/backend.yml  paths: backend/**  → ruff format + lint, mypy, pytest (postgres service), docker build
│   ├─ workflows/frontend.yml paths: frontend/** → lint, typegen + tsc, build (no DB)
│   ├─ workflows/contract.yml (Phase 5) regenerate openapi.json + schema.d.ts, fail on git diff
│   └─ dependabot.yml         weekly grouped updates: npm, uv, docker, github-actions
├─ render.yaml               docker, dockerfilePath/dockerContext backend/, buildFilter backend/**, autoDeployTrigger: checksPass
├─ backend/                  FastAPI
└─ frontend/                 current Next app (git mv, history kept)
```

Deploy isolation:
- **Vercel** uses Root Directory `frontend`, and its "Ignored Build Step" is `git diff --quiet HEAD^ HEAD -- .`, so backend-only commits don't build.
- **Render** has `buildFilter.paths: [backend/**]`, so frontend-only commits don't deploy. There's no `rootDir`: Render resolves `dockerfilePath`/`dockerContext` from the repo root, so both point at `backend/`.

CI/CD:
- CI = the GitHub Actions above. Each runs only when its folder changes.
- CD, backend: Render auto-deploys `main` with `autoDeployTrigger: checksPass`, so a commit deploys only after `backend.yml` is green.
- CD, frontend: Vercel's Git integration builds every push. `main` → production, PRs → preview URLs.

## 4. Backend structure and patterns

```
backend/
├─ pyproject.toml / uv.lock
├─ app/
│  ├─ main.py                   create_app(): middleware, CORS, error handlers, mounts every module router under /api/v1
│  ├─ core/
│  │  ├─ settings.py            pydantic-settings: every env var, typed, validated at startup
│  │  ├─ db.py                  async engine + session dependency (the only place that creates connections)
│  │  ├─ errors.py              ApiError + handlers → RFC 9457 problem+json
│  │  ├─ pagination.py          one envelope: { data, meta: { total, page, perPage } }
│  │  ├─ schemas.py             ApiModel base (camelCase JSON, snake_case Python)
│  │  ├─ ratelimit.py           (assistant phase) Postgres fixed-window limiter
│  │  └─ revalidator.py         (products phase) POSTs tags to the frontend's /api/revalidate
│  └─ modules/
│     ├─ health/router.py       GET /api/v1/health → select 1 (503 problem if down); GET /api/v1/health/live → no DB
│     ├─ products/
│     │  ├─ router.py           thin: query/body schema in → service → response schema out
│     │  ├─ schemas.py          Pydantic request filters (frozen DTO) + response models (the public contract)
│     │  ├─ models.py           SQLAlchemy table/model
│     │  ├─ repository.py       ProductRepository (Protocol) + PgProductRepository: the ONLY place with SQL
│     │  ├─ service.py          business rules, the module's public API
│     │  └─ deps.py             wiring: session → repository → service (FastAPI Depends), overridable in tests
│     ├─ specs/                 same shape (bearing technical data)
│     ├─ catalog/               designation decoder, greases chart, compatibility (ported from frontend lib/domain)
│     ├─ assistant/             see §6
│     ├─ quotes/                (later)
│     └─ auth/                  (later)
├─ migrations/                  Alembic: env.py + versions/, one timeline for all modules
├─ tests/                       <module>/test_*.py (pytest, httpx ASGI client, real Postgres from compose/CI)
└─ Dockerfile                   python:3.14-slim + uv, runs `uvicorn app.main:app`
```

**Rules**
1. Router → Service → Repository. Only repositories touch the DB. Routers stay thin.
2. **Modules talk to each other only through services.** For example, Assistant calls `ProductService`, never `PgProductRepository` or the SQLAlchemy model.
3. Repositories are typed as a `Protocol`. `deps.py` wires the real one, and tests swap it with `app.dependency_overrides`.
4. Input goes through a Pydantic schema (validated, frozen). Output goes through a response schema. ORM objects never go straight to JSON.
5. Access checks are dependencies (`require_admin`). Public reads are open; writes need an admin (later).
6. Errors are always problem+json, `{type,title,status,detail,code}`. That includes validation errors (422) and unknown routes (404). The frontend maps `code` to i18n text.
7. Stateless:
   - No sessions, logs to stderr, no local files.
   - Rate limits use Postgres (Redis later).
   - Render free has no worker, so there's no queue. Post-response work uses FastAPI `BackgroundTasks`.
8. Every schema change is an Alembic migration in git. No hand edits in any DB.
9. Search SQL stays raw, inside the repository: pg_trgm, the natural-sort collation and `search_key`. The ORM is for simple CRUD.

**Patterns used**
- Repository (Protocol) and Service Layer, wired with dependency injection (`Depends`).
- DTOs: frozen Pydantic models.
- Response schemas as the public contract.
- Strategy: assistant flows, AI providers.
- Chain / fallback: AI model fallback.
- Observer: product changes → revalidation.
- Pipeline: the assistant request pipeline.

## 5. Frontend structure

```
frontend/
├─ app/                       routes only (unchanged URLs)
│  └─ api/revalidate/route.ts NEW: POST {tags[]}, header X-Revalidate-Secret → revalidateTag()
├─ components/<feature>/      unchanged
├─ lib/api/
│  ├─ schema.d.ts             GENERATED from backend openapi.json (never hand-edited)
│  ├─ client.ts               openapi-fetch client; server = API_URL, browser = NEXT_PUBLIC_API_URL; timeout + 1 retry
│  └─ products.ts             getProduct(slug) etc. with next: { revalidate, tags: ['products', `product:${slug}`] }
├─ lib/domain/                page content only (category copy, comparisons). Data the backend needs moves to backend catalog
└─ (server/ deleted: no DB access in the frontend)
```

- Server components call `lib/api/*` and rely on ISR.
- Client components call the API from the browser. Header search, catalog filters, size finder and the assistant stream all do this. CORS is restricted to the site's origins.
- Browser calls go direct, not through Vercel: no extra hop, and no Vercel function time limit on long AI streams.
- **Vercel builds need the API awake.** `prebuild` runs `scripts/wake-api.mjs`, which polls `/api/v1/health` for up to 90 s.

## 6. Assistant module (Gemini)

```
modules/assistant/
├─ router.py                 POST /api/v1/assistant/chat → StreamingResponse (NDJSON); POST /api/v1/assistant/feedback
├─ service.py                pipeline: rate limit → load conversation → route → stream → persist
├─ routing.py                preset id → scripted flow, free text → LLM agent
├─ flows/  (Strategy, no LLM) product_search, datasheet, decode, grease, where_to_buy
├─ llm/
│  ├─ gemini_agent.py        google-genai: system prompt + function tools + streaming
│  ├─ model_chain.py         try GEMINI_MODEL, on 429/503/timeout (15 s first token) → GEMINI_FALLBACK_MODEL
│  └─ tools/                 search_products, get_product, decode_designation, select_grease, rating_life, relubrication
│                             (each wraps a module service; args validated by a Pydantic model)
├─ confidence.py             [[confidence:v1 …]] footer → confidence event
├─ ndjson.py                 events: text | status | products | sources | confidence | done | error
├─ prompts/system.md         SKF-only, no competitor brands, never invent numbers, reply in user language
│                             (starting point: docs/assistant-prompt-draft.md)
└─ models.py                 Conversation, Message, Feedback
```

- **Streaming:** uvicorn sends each chunk straight away. Responses carry `X-Accel-Buffering: no` and `Cache-Control: no-cache`.
- **Limits:**
  - 10 messages / 10 min per IP (Postgres limiter).
  - Input ≤ 2,000 characters, output ≤ ~1,500 tokens, 8 tool calls per turn.
  - A daily global cap (a DB counter) so a misuse can't burn the quota.
- **Data:** the specs come from the Specs module (scraped C, C0, Pu, speeds, mass, temperatures). When a value is missing, the answer links to the skf.com datasheet instead of inventing it.

## 7. Environment variables

**Backend (Render)**, see `backend/.env.example`:
- App: `APP_ENV=production`, `LOG_LEVEL=info`
- Database: `DATABASE_URL=postgresql://…<supabase session pooler :5432>` (the app switches the driver to psycopg itself)
- CORS: `CORS_ALLOWED_ORIGINS=https://<vercel domain>,http://localhost:3000`
- Revalidation: `FRONTEND_REVALIDATE_URL`, `REVALIDATE_SECRET`
- Gemini: `GEMINI_API_KEY`, `GEMINI_MODEL=gemini-3.5-flash-lite`, `GEMINI_FALLBACK_MODEL=gemini-3.8-flash`

**Frontend (Vercel, Production AND Preview)**:
- `API_URL`, `NEXT_PUBLIC_API_URL`, `REVALIDATE_SECRET`
- **Remove** `DATABASE_URL` and `DATABASE_POOL_URL` (after Phase 5)

## 8. Work plan (each phase = local commit, push only after you verify)

**Phase 0: accounts and settings (you, ~15 min)**
- Render account, linked to GitHub `filiptr-dev/bb-demo`.
- cron-job.org account.
- Supabase: copy the **session pooler** connection string.
- Google AI Studio: check the rate-limit page for both models. Decide when to enable billing (§2 data-use note).

**Phase 1: monorepo move**
- `git mv` the Next app into `frontend/`, keeping history.
- Root `CLAUDE.md`, `docs/`, `.gitignore` split.
- Remove `@anthropic-ai/sdk` and the Anthropic drafts (`lib/assistant.ts`, `server/assistant/`). The prompt rules are kept in `docs/assistant-prompt-draft.md`.
- Vercel: set Root Directory = `frontend` **at the same time as this is pushed**.
- ✅ Done when: `npm run build` in `frontend/` passes, and the Vercel preview matches production.

**Phase 2: backend skeleton**
- `uv init` project, FastAPI app factory, settings, async DB session.
- Core: problem+json errors, pagination envelope, camelCase schema base, health.
- CORS, OpenAPI at `/openapi.json`, docs at `/docs`.
- ruff, mypy (strict), pytest.
- Dockerfile, `render.yaml`, `docker-compose.yml` (postgres:17 + backend).
- GitHub Actions workflows.
- ✅ Done when: `docker compose up` → `/api/v1/health` 200 and `/docs` shows the OpenAPI docs.
- Built 2026-09-29: FastAPI 0.141, SQLAlchemy 2.1, psycopg 3.3, Pydantic 2.13, uv 0.12.20. 15 tests (health, problem+json for 404/405/409/422/500, CORS on error responses, OpenAPI, settings, pagination). Checked against Supabase (Postgres 17.6) through the session pooler. `contract.yml` waits for Phase 5, when there's a generated `schema.d.ts` to compare.

**Phase 3: baseline migration**
- Convert `schema.sql` to the first Alembic revision: pg_trgm, the `natural_sort` ICU collation, `products` with the generated `search_key`, 4 indexes.
- Supabase-only statements (RLS, anon/authenticated grants) are **not** in migrations. They stay on the current Supabase DB and don't exist on your own server.
- On the existing Supabase DB, mark the baseline as already run: `alembic stamp <baseline>` (one `alembic_version` row). On a fresh Postgres, `alembic upgrade head` creates everything.
- ✅ Done when: the schema-only `pg_dump` of a fresh local DB and of Supabase `products` match.
- Built 2026-09-29: `backend/alembic.ini`, async `migrations/env.py` (URL from the settings), `0001_baseline.py`, `Base` with Postgres-default constraint names in `core/db.py`. The schema-only `pg_dump` of a fresh local DB matches Supabase `products` except the two RLS lines, which are left out on purpose. `tests/test_migrations.py` runs upgrade → downgrade → upgrade on a throwaway database, and checks `search_key`, `natural_sort` and the trigram index. The Supabase `alembic stamp 0001` is still to do (it needs your OK). Until Phase 7 the Node importer still applies `frontend/scripts/schema.sql`, which is a no-op on an existing DB.

**Phase 4: Products module + parity**
- **Before** touching anything, record "golden" JSON from the current `/api/products` and page queries. That's ~30 cases: text search, each filter, dimension ranges, paging, detail, related, industry, sitemap rows, count.
- Build the module: search, show, related, by_industry, count, sitemap, updated_at.
- pytest asserts the API output matches the golden files.
- ✅ Done when: all parity tests pass against a copy of the real data.

**Phase 5: frontend on the API**
- Generate `schema.d.ts`, add `lib/api/*`, and swap every `server/products` import (catalog, detail, industries, sitemap, llms.txt, `/api/products` → removed).
- Add `/api/revalidate`, the `wake-api` prebuild step, and `SearchError` handling for API outages (already exists).
- Delete `frontend/server/`.
- ✅ Done when: every page renders the same (screenshots en + mk, desktop + mobile), and the build passes with the API as the only data source.

**Phase 6: deploy**
- Render: New → Blueprint → this repo (reads `render.yaml`), then fill `DATABASE_URL` and `CORS_ALLOWED_ORIGINS`.
- The cron-job.org ping on `/api/v1/health`, and the Vercel env vars.
- Push once you've verified locally.
- ✅ Done when: the live site works, and the first request after 20 min idle still works (ping) or gets a clear loading state.

**Phase 7: Specs + importers**
- `specs` table + migration.
- `python -m app.cli products-import`, a port of the current Node importer.
- `python -m app.cli specs-scrape`: sequential and polite, fills C, C0, Pu, speeds, mass and temperature for stocked designations.
- Specs endpoints; the specs table on the product detail page.
- The local-only dummy seeder stays uncommitted.

**Phase 8: Catalog module in Python**
- Designation decoder, greases chart and compatibility matrix, ISO 281 rating life, relubrication.
- Unit tests against the current TS outputs.
- Frontend `/decoder` uses the API, so there's one source of truth.

**Phase 9: Assistant backend**
- Tables: conversations, messages, feedback, daily counter.
- Flows, Gemini agent + tools + model chain, confidence, rate limit.
- Tests with a faked Gemini client; one live smoke test per model.

**Phase 10: Assistant widget**
- `components/assistant/*`: launcher, panel/dock, presets, streaming markdown, product cards, confidence badge, stop, copy, thumbs.
- `Assistant` i18n ×10.
- Real-browser test incl. Macedonian.

**Phase 11: later**
- Admin login and `/admin` product and specs CRUD. Product changes → revalidate.
- Real quotes and email.
- Redis, Cloud Run or your own server when traffic needs it.

## 9. Risks

| Risk | Mitigation |
|---|---|
| Render cold start (~1 min) | cron keep-alive. Client loading state + retry. Upgrade path = Cloud Run |
| Vercel build while API asleep | `wake-api` prebuild. Fetch timeout + retry |
| Gemini flash-lite overloaded | Model chain fallback to 3.8-flash. Clear "busy, try again" error |
| Gemini free-tier quota / data use | Rate limit + daily cap. Enable billing before real customers use it |
| Supabase pause after 7 days | health ping queries the DB |
| Search results change in the port | golden-file parity tests (phase 4) |
| 512 MB RAM on Render free | one uvicorn worker, small DB pool (5) |
| Commercial use on Vercel Hobby | move to Pro or self-host before the client goes live |
