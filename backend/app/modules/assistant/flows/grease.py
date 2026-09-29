from app.modules.assistant.flows.base import FlowContext, FlowReply
from app.modules.assistant.schemas import AskEvent, FlowId, GreasesEvent
from app.modules.catalog.service import CatalogService


class GreaseFlow:
    """Shows the basic SKF grease choice and asks for the operating conditions; the model answers those."""

    id: FlowId = "grease"

    def __init__(self, catalog: CatalogService) -> None:
        self.catalog = catalog

    async def start(self, ctx: FlowContext) -> FlowReply:
        basic = self.catalog.greases().basic
        choice = ", ".join(f"{b.condition}: {b.code}" for b in basic)
        return FlowReply(
            events=[GreasesEvent(basic=basic), AskEvent(ask="grease_conditions")],
            summary=f"Showed the basic SKF grease selection ({choice}) and asked for the operating conditions "
            "(temperature, speed, load, application).",
            pending=True,
        )

    async def reply(self, ctx: FlowContext) -> FlowReply | None:
        return None  # conditions in free text: the model uses grease_guide
