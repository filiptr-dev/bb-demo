"""The assistant's public contract: the chat request and the events streamed back (JSON Lines: one object per line).

The frontend renders every event with its own translations, so events carry codes and data, not sentences (except
`text`, the model's own answer in the user's language).
"""

import uuid
from typing import Annotated, Literal, Self

from pydantic import Field, model_validator

from app.core.schemas import ApiModel
from app.modules.catalog.schemas import DecodedDesignation, GreaseRecommendation
from app.modules.products.schemas import Product
from app.modules.specs.schemas import ProductSpecs

MAX_MESSAGE = 2000

# Starter prompts that run a scripted flow instead of the model.
FlowId = Literal["product_search", "datasheet", "decode", "grease", "where_to_buy"]


class ChatRequest(ApiModel):
    conversation_id: uuid.UUID | None = Field(default=None, description="From a previous `done` event; omit to start")
    message: str = Field(default="", max_length=MAX_MESSAGE)
    preset: FlowId | None = Field(
        default=None, description="A starter prompt's flow. With an empty message the flow asks for what it needs"
    )
    locale: str = Field(default="mk", max_length=8, description="Site language; the answer follows the user's")

    @model_validator(mode="after")
    def _something_to_answer(self) -> Self:
        if not self.message.strip() and self.preset is None:
            raise ValueError("give a message or a preset")
        return self


FeedbackReason = Literal["incorrect", "not_what_i_asked", "slow_or_buggy", "style", "safety", "other"]


class FeedbackRequest(ApiModel):
    message_id: uuid.UUID = Field(description="From the answer's `done` event")
    rating: Literal["up", "down"]
    reason: FeedbackReason | None = None
    comment: str | None = Field(default=None, max_length=1000)


# --- stream events


class StatusEvent(ApiModel):
    """What the assistant is doing, until the first text arrives."""

    type: Literal["status"] = "status"
    status: Literal["thinking", "searching", "reading", "calculating"]


class TextEvent(ApiModel):
    """A piece of the model's Markdown answer; append in order."""

    type: Literal["text"] = "text"
    text: str


class ProductsEvent(ApiModel):
    """Product cards. `search` is set by the search flow: link to /catalog?search=<search> for all `total`."""

    type: Literal["products"] = "products"
    products: list[Product]
    total: int | None = None
    search: str | None = None


AskFor = Literal["product_query", "designation", "grease_conditions"]


class AskEvent(ApiModel):
    """A scripted flow asks the user for input; the next message answers it."""

    type: Literal["ask"] = "ask"
    ask: AskFor


class SpecsEvent(ApiModel):
    """A product's data sheet. `specs` is null when SKF data isn't in the catalog yet: link to skf.com."""

    type: Literal["specs"] = "specs"
    product: Product
    specs: ProductSpecs | None


class DecodeEvent(ApiModel):
    type: Literal["decode"] = "decode"
    decoded: DecodedDesignation


class GreasesEvent(ApiModel):
    """The basic SKF grease choice per condition; the full chart is on /products/greases."""

    type: Literal["greases"] = "greases"
    basic: list[GreaseRecommendation]


class ContactEvent(ApiModel):
    """Where to buy: B&B Unikoop's offices, phones and the contact form."""

    type: Literal["contact"] = "contact"


class Source(ApiModel):
    title: str
    url: str


class SourcesEvent(ApiModel):
    type: Literal["sources"] = "sources"
    sources: list[Source]


ConfidenceStatus = Literal["supported", "bounded", "partial", "insufficient", "conflicting", "not_applicable"]


class ConfidenceEvent(ApiModel):
    """The model's own rating of its answer. None when the answer is a question back."""

    type: Literal["confidence"] = "confidence"
    score: int | None = Field(ge=0, le=100)
    status: ConfidenceStatus
    reason: str | None = None


ErrorCode = Literal["assistant_unavailable", "assistant_busy", "assistant_failed", "conversation_not_found"]


class ErrorEvent(ApiModel):
    """assistant_unavailable: no model configured or every model down; assistant_busy: the daily limit is used up;
    assistant_failed: the answer broke off; conversation_not_found: start a new one."""

    type: Literal["error"] = "error"
    code: ErrorCode
    detail: str


class DoneEvent(ApiModel):
    """Always the last event of a turn that was saved: keep `conversationId` for the next message and `messageId`
    for feedback."""

    type: Literal["done"] = "done"
    conversation_id: uuid.UUID
    message_id: uuid.UUID


ChatEventModel = (
    StatusEvent
    | TextEvent
    | ProductsEvent
    | AskEvent
    | SpecsEvent
    | DecodeEvent
    | GreasesEvent
    | ContactEvent
    | SourcesEvent
    | ConfidenceEvent
    | ErrorEvent
    | DoneEvent
)
# One line of the stream. The OpenAPI document lists it as the stream's `itemSchema`.
ChatEvent = Annotated[ChatEventModel, Field(discriminator="type")]
