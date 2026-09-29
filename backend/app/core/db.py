from collections.abc import AsyncIterator
from typing import Annotated

from fastapi import Depends, Request
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncEngine, AsyncSession, async_sessionmaker, create_async_engine

from app.core.settings import Settings


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
