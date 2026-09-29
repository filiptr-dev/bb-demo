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

`APP_ENV`, `LOG_LEVEL` come from `render.yaml`. Optional, both or neither: `FRONTEND_REVALIDATE_URL`
(`https://<vercel domain>/api/revalidate`) and `REVALIDATE_SECRET` (the same value as Vercel's), so a data change
made through the API refreshes the site's cached pages at once. `GEMINI_API_KEY` (Google AI Studio) turns on the
assistant's free-text answers; `GEMINI_MODEL` and `GEMINI_FALLBACK_MODEL` come from `render.yaml`. The limits have
defaults (`ASSISTANT_RATE_LIMIT` 10 per `ASSISTANT_RATE_WINDOW` 600 s per IP, `ASSISTANT_DAILY_LIMIT` 500), see
`backend/.env.example`.

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
90 s for the API to wake (`scripts/wake-api.mjs`), then up to 15 min until the live API lists every path in
`lib/api/schema.d.ts`: a push that changes both parts reaches Vercel at once but Render only after the backend
checks, and pages must not prerender against the old API. Either wait failing fails the build, so a broken API
never replaces a working deployment.

Once the site works on the API, delete `DATABASE_URL` and `DATABASE_POOL_URL` from Vercel: the site no longer
talks to the database.

## 4. Data jobs (catalog import, SKF technical data)

They run from your machine, in `backend/`, against whatever `DATABASE_URL` is in the environment (without it,
`backend/.env` = the local compose DB). For production, use the same session pooler string as Render:

```sh
export DATABASE_URL='postgresql://postgres.<ref>:<password>@aws-1-eu-west-1.pooler.supabase.com:5432/postgres'
export FRONTEND_REVALIDATE_URL=https://<vercel domain>/api/revalidate REVALIDATE_SECRET=<Vercel's value>

uv run python -m app.cli products-import --dry   # scrape bearingworld + our seed list, print stats only
uv run python -m app.cli products-import         # upsert; rows no longer in the catalog are deleted
uv run python -m app.cli specs-scrape            # SKF data sheets for our stocked products, 1 request/s
uv run python -m app.cli specs-scrape --all      # the whole catalog (~15k requests, ~4–5 h; resumable)
uv run python -m app.cli specs-scrape 6205 '22212 EK' # just these, re-fetched
```

Each job only asks for what's missing (`--max-age-days 90` also refreshes old data), so a stopped run resumes
where it was. With the two revalidate variables set, the site's cached product pages refresh when a job changed
something; otherwise they refresh within an hour on their own.

**Supabase only, once after the deploy that creates a new table** (`specs` in phase 7; `assistant_conversations`,
`assistant_messages`, `assistant_feedback`, `rate_limits` in phase 9): Supabase exposes every
table in `public` through its REST API with the anon role. Supabase → Table Editor → the table → **Enable RLS**
(no policies needed: the API connects as `postgres`, which bypasses RLS). This is dashboard-only on purpose: the
migrations stay Supabase-free.

## Moving off Supabase later

New Postgres → set `DATABASE_URL` on Render → deploy. `alembic upgrade head` creates everything on the empty
database; then load the data with the jobs above (`products-import`, then `specs-scrape`).
