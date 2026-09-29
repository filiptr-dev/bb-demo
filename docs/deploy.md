# Deploying

The API runs on Render (free, Docker, from `render.yaml`), the site on Vercel (Root Directory `frontend`), the
database on Supabase. First-time setup, in this order:

## 1. Render: the API

1. <https://dashboard.render.com> → **New → Blueprint** → connect GitHub `filiptr-dev/bb-demo`, branch `main`.
   Render reads `render.yaml` and proposes one free web service, `bbunikoop-api` (Docker, Frankfurt).
2. It asks for the two secret values (`sync: false` in `render.yaml`):
   - `DATABASE_URL`: the Supabase **session pooler** string, port **5432** (Supabase → Connect → Session pooler),
     e.g. `postgresql://postgres.<ref>:<password>@aws-1-eu-west-1.pooler.supabase.com:5432/postgres`.
     Not the direct `db.<ref>.supabase.co` host (IPv6 only; Render is IPv4) and not the 6543 transaction pooler.
   - `CORS_ALLOWED_ORIGINS`: every site origin that calls the API from a browser, comma-separated, no trailing
     slash, e.g. `https://bb-demo.vercel.app,http://localhost:3000` (add the custom domain later).
3. **Apply.** The first build takes a few minutes. On start the container runs `alembic upgrade head`: on Supabase
   that only creates the `alembic_version` table with `0001` (the existing `products` table is adopted as is).
4. Check `https://<service>.onrender.com/api/v1/health` → `{"status":"ok","database":"ok"}` and `/docs`.
5. Optional, for Vercel preview deployments (their URLs change per branch): Render → service → Environment →
   add `CORS_ALLOWED_ORIGIN_REGEX` = `https://bb-demo-[a-z0-9-]+\.vercel\.app` (use the project's real prefix).

`APP_ENV`, `LOG_LEVEL` come from `render.yaml`. Later phases add `REVALIDATE_SECRET`, `FRONTEND_REVALIDATE_URL`
(phase 7) and `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_FALLBACK_MODEL` (phase 9).

CD: `autoDeployTrigger: checksPass` deploys each backend commit on `main` once `backend.yml` is green. A failed
migration or health check fails the deploy and the previous version keeps serving.

## 2. Keep-alive: cron-job.org

Render free sleeps after 15 min idle (~1 min cold start); Supabase free pauses after 7 idle days.
<https://cron-job.org> → Create cronjob → URL `https://<service>.onrender.com/api/v1/health`, every 10 minutes,
GET. That keeps both awake (one always-on service ≈ 744 h/month, inside Render's 750 free hours).

## 3. Vercel: the site

Project → Settings → Environment Variables, for **Production and Preview**:

| Name | Value |
|---|---|
| `API_URL` | `https://<service>.onrender.com` |
| `NEXT_PUBLIC_API_URL` | the same URL (the browser calls it directly) |
| `REVALIDATE_SECRET` | a long random string (`openssl rand -hex 32`); the API gets the same one in phase 7 |

`NEXT_PUBLIC_*` values are baked in at build time: redeploy after changing them. Every build first waits up to
90 s for the API to wake (`scripts/wake-api.mjs`) and fails if it doesn't answer, so a broken API never replaces
a working deployment.

Once the site works on the API, delete `DATABASE_URL` and `DATABASE_POOL_URL` from Vercel: the site no longer
talks to the database.

## Moving off Supabase later

New Postgres → set `DATABASE_URL` on Render → deploy. `alembic upgrade head` creates everything on the empty
database; then load the catalog (`npm run db:import` in `frontend/` until phase 7 ports the importer).
