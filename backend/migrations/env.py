"""Alembic environment: async engine, URL from the app settings (DATABASE_URL).

Tests pass a URL through `config.attributes["database_url"]` instead, so they never touch the real settings.
"""

import asyncio
from logging.config import fileConfig

from alembic import context
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import create_async_engine

# Every module's models, so autogenerate sees their tables.
import app.core.ratelimit
import app.modules.assistant.models
import app.modules.products.models
import app.modules.specs.models  # noqa: F401
from app.core.db import Base
from app.core.settings import get_settings, psycopg_url

config = context.config
if config.config_file_name is not None and config.attributes.get("configure_logger", True):
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def _database_url() -> str:
    url = config.attributes.get("database_url")
    if isinstance(url, str):
        return psycopg_url(url)
    return get_settings().database_url


def run_migrations_offline() -> None:
    """`alembic upgrade head --sql`: print the SQL instead of running it (to review a migration)."""
    context.configure(url=_database_url(), target_metadata=target_metadata, literal_binds=True)
    with context.begin_transaction():
        context.run_migrations()


def _run(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata, transaction_per_migration=True)
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    # No prepared statements, like the app, so a transaction pooler works too.
    engine = create_async_engine(_database_url(), connect_args={"prepare_threshold": None, "connect_timeout": 10})
    try:
        async with engine.connect() as connection:
            await connection.run_sync(_run)
    finally:
        await engine.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
