# The API image: Render (free, Docker), Cloud Run or any container host. Built from backend/ as the context.
FROM python:3.14-slim

COPY --from=ghcr.io/astral-sh/uv:0.12.20 /uv /bin/uv

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy \
    UV_NO_DEV=1 \
    UV_PYTHON_DOWNLOADS=0 \
    PATH="/app/.venv/bin:$PATH" \
    PORT=8000

WORKDIR /app

# Dependencies first, so code changes don't reinstall them.
COPY pyproject.toml uv.lock ./
RUN --mount=type=cache,target=/root/.cache/uv uv sync --locked --no-install-project

COPY . .

RUN useradd --system --no-create-home api
USER api

EXPOSE 8000

# Migrations first (Render's free plan has no pre-deploy step; a failed migration fails the deploy and the old
# instance keeps serving), then the API. Render sets PORT. One worker: the free instance has 512 MB and 0.1 CPU.
# --proxy-headers: the real client IP comes from Render's proxy (needed for per-IP rate limits).
CMD ["sh", "-c", "alembic upgrade head && exec uvicorn app.main:create_app --factory --host 0.0.0.0 --port \"$PORT\" --proxy-headers --forwarded-allow-ips='*' --no-server-header"]
