from app.modules.assistant.flows.base import FlowContext, FlowReply
from app.modules.assistant.schemas import ContactEvent, FlowId


class WhereToBuyFlow:
    """B&B Unikoop's offices, phones and the contact form (rendered by the frontend)."""

    id: FlowId = "where_to_buy"

    async def start(self, ctx: FlowContext) -> FlowReply:
        return FlowReply(
            events=[ContactEvent()],
            summary="Showed where to buy: B&B Unikoop offices in Prilep and Skopje, phones and the contact form "
            "(/contact).",
        )

    async def reply(self, ctx: FlowContext) -> FlowReply | None:
        return await self.start(ctx)
