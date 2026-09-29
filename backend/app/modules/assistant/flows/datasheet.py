from app.core.errors import ApiError
from app.modules.assistant.flows.base import FlowContext, FlowReply, candidates
from app.modules.assistant.schemas import AskEvent, FlowId, SpecsEvent
from app.modules.products.service import ProductService
from app.modules.specs.service import SpecService


class DatasheetFlow:
    """Asks for a designation, then shows the product's SKF technical data (or the skf.com link when there's none)."""

    id: FlowId = "datasheet"

    def __init__(self, products: ProductService, specs: SpecService) -> None:
        self.products = products
        self.specs = specs

    async def start(self, ctx: FlowContext) -> FlowReply:
        return FlowReply(
            events=[AskEvent(ask="designation")], summary="Asked for the product designation.", pending=True
        )

    async def reply(self, ctx: FlowContext) -> FlowReply | None:
        for guess in candidates(ctx.message):
            product = await self.products.find_by_designation(guess)
            if product is None:
                continue
            try:
                spec = await self.specs.get(product.slug)
            except ApiError:
                spec = None
            if spec is None:
                summary = f"Showed {product.designation}; no SKF technical data stored, linked skf.com."
            else:
                summary = (
                    f"Showed the SKF data for {product.designation}: C {spec.c} kN, C0 {spec.c0} kN, "
                    f"Pu {spec.pu} kN, reference speed {spec.reference_speed} r/min, limiting speed "
                    f"{spec.limiting_speed} r/min, mass {spec.mass} kg."
                )
            return FlowReply(events=[SpecsEvent(product=product, specs=spec)], summary=summary)
        return None
