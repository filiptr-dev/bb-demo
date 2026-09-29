# B&B Unikoop monorepo

- `frontend/`: the Next.js site (deployed on Vercel, Root Directory `frontend`). Its rules: @frontend/AGENTS.md
- `backend/`: the FastAPI API (deployed on Render from `render.yaml`). Its rules: @backend/AGENTS.md
- `docs/architecture-plan.md`: the target architecture and the phase plan. Read it before changing how the parts fit together.

Run npm commands from `frontend/` and uv commands from `backend/`, never from the repo root. `docker compose up -d db` (repo root) starts the local Postgres.
