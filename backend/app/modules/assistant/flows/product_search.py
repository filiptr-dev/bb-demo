import re

from app.modules.assistant.flows.base import FlowContext, FlowReply
from app.modules.assistant.schemas import AskEvent, FlowId, ProductsEvent
from app.modules.products.schemas import ProductSearch
from app.modules.products.service import ProductService

SHOWN = 5
_NUMBER = r"\d+(?:[.,]\d+)?"
_DIMS = re.compile(
    rf"{_NUMBER}\s*[x\u00d7*]\s*{_NUMBER}(?:\s*[x\u00d7*]\s*{_NUMBER})?", re.IGNORECASE
)  # x, the multiplication sign, *


class ProductSearchFlow:
    """Asks for a designation or d x D x B, then shows the first matches and links the full catalog search."""

    id: FlowId = "product_search"

    def __init__(self, products: ProductService) -> None:
        self.products = products

    async def start(self, ctx: FlowContext) -> FlowReply:
        return FlowReply(
            events=[AskEvent(ask="product_query")],
            summary="Asked which product to search for (a designation or d x D x B).",
            pending=True,
        )

    async def reply(self, ctx: FlowContext) -> FlowReply | None:
        # the catalog search box's inputs only (a designation, d x D x B, type words): a sentence goes to the model
        dims = _DIMS.search(ctx.message)
        for query in [dims.group(0)] if dims else [ctx.message.strip()]:
            page = await self.products.search(ProductSearch(search=query, locale=ctx.locale, per_page=SHOWN))
            if page.meta.total:
                shown = ", ".join(p.designation for p in page.data)
                return FlowReply(
                    events=[ProductsEvent(products=page.data, total=page.meta.total, search=query)],
                    summary=f"Searched the catalog for '{query}': {page.meta.total} products. Showed {shown}.",
                )
        return None
