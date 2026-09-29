# B&B Unikoop

The website of B&B Unikoop, the official SKF distributor for North Macedonia.

| Folder | What | Runs on |
|---|---|---|
| `frontend/` | Next.js site | Vercel (Root Directory `frontend`) |
| `backend/` | FastAPI API (Python 3.14, Postgres) | Render (`render.yaml`) |
| `docs/` | Architecture plan and notes | |

## Local development

```bash
docker compose up -d db                       # Postgres 17 on localhost:5433

cd backend
cp .env.example .env
uv sync
uv run uvicorn app.main:create_app --factory --reload   # http://localhost:8000/docs

cd backend && uv run alembic upgrade head    # create the tables (once, and after every new migration)

cd ../frontend
cp .env.example .env.local                    # API_URL / NEXT_PUBLIC_API_URL = http://localhost:8000
npm install
npm run dev                                   # http://localhost:3000
```

`docker compose up --build` runs the database and the API in containers instead. The site reads everything from the
API, so the API must be running. To fill a local database with the real catalog:
`DATABASE_URL=postgresql://postgres:postgres@localhost:5433/bbunikoop npm run db:import` (in `frontend/`).

## CI/CD

- **CI** (GitHub Actions). Each workflow runs only when its folder changes.
  - `backend.yml`: ruff, mypy, pytest against Postgres, Docker build.
  - `frontend.yml`: lint, search vocabulary up to date, type check, build.
  - `contract.yml`: `backend/openapi.json` and the generated `frontend/lib/api/schema.d.ts` are current.
- **CD:**
  - Render deploys `backend/` from `main` once the backend checks pass (`autoDeployTrigger: checksPass`).
  - Vercel deploys `frontend/` through its Git integration, with a preview URL for every PR.
- **Dependabot:** weekly update PRs for npm, uv, Docker and Actions.

Architecture and roadmap: [docs/architecture-plan.md](docs/architecture-plan.md). First deploy: [docs/deploy.md](docs/deploy.md).
