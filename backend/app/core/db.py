from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy import MetaData, text
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.settings import Settings


class Base(DeclarativeBase):
    """Every module's models.py subclasses this, so Alembic sees all tables in one metadata.
    Constraint names follow Postgres' own defaults (products_pkey, ...), so the names autogenerate writes
    match the ones already on the database."""

    metadata = MetaData(
        naming_convention={
            "ix": "%(table_name)s_%(column_0_N_name)s",
            "uq": "%(table_name)s_%(column_0_N_name)s_key",
            "ck": "%(table_name)s_%(constraint_name)s_check",
            "fk": "%(table_name)s_%(column_0_N_name)s_fkey",
            "pk": "%(table_name)s_pkey",
        }
    )


def create_engine(settings: Settings) -> AsyncEngine:
    """The only place that opens database connections. Created in the app lifespan, disposed on shutdown."""
    return create_async_engine(
        settings.database_url,
        pool_size=settings.db_pool_size,
        max_overflow=0,  # the Supabase session pooler caps clients, so the pool never grows past pool_size
        pool_pre_ping=True,  # poolers and Render restarts drop idle connections
        pool_recycle=300,
        # No server-side prepared statements, so a transaction pooler (pgbouncer, Supabase :6543) also works.
        connect_args={"prepare_threshold": None, "connect_timeout": 10},
    )


def create_sessionmaker(engine: AsyncEngine) -> async_sessionmaker[AsyncSession]:
    return async_sessionmaker(engine, expire_on_commit=False)


async def get_session(request: Request) -> AsyncIterator[AsyncSession]:
    """Request-scoped session. Repositories receive it through their module's deps.py."""
    sessionmaker: async_sessionmaker[AsyncSession] = request.app.state.sessionmaker
    async with sessionmaker() as session:
        yield session


Session = Annotated[AsyncSession, Depends(get_session)]


async def ping(engine: AsyncEngine) -> None:
    """Raises if the database can't run a trivial query."""
    async with engine.connect() as conn:
        await conn.execute(text("select 1"))
