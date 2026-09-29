"""Tells the frontend that cached pages are stale (Next.js cache tags). See frontend/app/api/revalidate/route.ts."""

import logging

import httpx2

from app.core.settings import Settings

log = logging.getLogger(__name__)

TIMEOUT = 10.0


class Revalidator:
    """POST {"tags": [...]} to FRONTEND_REVALIDATE_URL. A failure is logged, never raised: the data change already
    happened, and the pages refresh on their own when their cache time runs out."""

    def __init__(self, settings: Settings, transport: httpx2.AsyncBaseTransport | None = None) -> None:
        self.url = settings.frontend_revalidate_url
        self.secret = settings.revalidate_secret
        self.transport = transport

    @property
    def configured(self) -> bool:
        return bool(self.url and self.secret)

    async def revalidate(self, *tags: str) -> bool:
        if not tags:
            return True
        if not (self.url and self.secret):
            log.info("revalidate: FRONTEND_REVALIDATE_URL / REVALIDATE_SECRET not set, skipped %s", list(tags))
            return False
        try:
            async with httpx2.AsyncClient(transport=self.transport, timeout=TIMEOUT) as client:
                res = await client.post(
                    self.url, json={"tags": list(tags)}, headers={"X-Revalidate-Secret": self.secret}
                )
            res.raise_for_status()
        except httpx2.HTTPError as exc:
            log.warning("revalidate %s failed: %s", list(tags), exc)
            return False
        log.info("revalidated %s", list(tags))
        return True
