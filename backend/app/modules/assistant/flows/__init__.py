from app.modules.assistant.flows.base import Flow, FlowContext, FlowReply
from app.modules.assistant.flows.datasheet import DatasheetFlow
from app.modules.assistant.flows.decode import DecodeFlow
from app.modules.assistant.flows.grease import GreaseFlow
from app.modules.assistant.flows.product_search import ProductSearchFlow
from app.modules.assistant.flows.where_to_buy import WhereToBuyFlow
from app.modules.catalog.service import CatalogService
from app.modules.products.service import ProductService
from app.modules.specs.service import SpecService

__all__ = ["Flow", "FlowContext", "FlowReply", "flows"]


def flows(products: ProductService, specs: SpecService, catalog: CatalogService) -> dict[str, Flow]:
    return {
        f.id: f
        for f in (
            ProductSearchFlow(products),
            DatasheetFlow(products, specs),
            DecodeFlow(catalog),
            GreaseFlow(catalog),
            WhereToBuyFlow(),
        )
    }
