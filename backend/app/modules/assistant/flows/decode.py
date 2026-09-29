from app.modules.assistant.flows.base import FlowContext, FlowReply, candidates
from app.modules.assistant.schemas import AskEvent, DecodeEvent, FlowId
from app.modules.catalog.schemas import DecodedDesignation
from app.modules.catalog.service import CatalogService


class DecodeFlow:
    """Asks for a designation, then explains its parts (the frontend's decoder texts)."""

    id: FlowId = "decode"

    def __init__(self, catalog: CatalogService) -> None:
        self.catalog = catalog

    async def start(self, ctx: FlowContext) -> FlowReply:
        return FlowReply(
            events=[AskEvent(ask="designation")], summary="Asked for the designation to decode.", pending=True
        )

    async def reply(self, ctx: FlowContext) -> FlowReply | None:
        # The guess the decoder reads best: it has a series, and the fewest parts it can't name ("what is 6205?"
        # decodes too, as nonsense). Nothing with a series (a suffix alone, a housing): the model answers.
        best: tuple[int, str, DecodedDesignation] | None = None
        for guess in candidates(ctx.message):
            decoded = self.catalog.decode(guess)
            if not any(s.kind == "series" for s in decoded.segments):
                continue
            unknown = sum(s.kind == "unknown" for s in decoded.segments)
            if best is None or unknown < best[0]:
                best = (unknown, guess, decoded)
        if best is None:
            return None
        _, guess, decoded = best
        parts = ", ".join(f"{s.token} ({s.kind}{' ' + s.id if s.id else ''})" for s in decoded.segments)
        return FlowReply(events=[DecodeEvent(decoded=decoded)], summary=f"Decoded {guess}: {parts}.")
