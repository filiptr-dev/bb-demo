from math import ceil
from typing import Annotated

from fastapi import Depends, Query

from app.core.schemas import ApiModel

MAX_PER_PAGE = 100


class PageParams(ApiModel):
    page: int = 1
    per_page: int = 24

    @property
    def offset(self) -> int:
        return (self.page - 1) * self.per_page


def _page_params(
    page: Annotated[int, Query(ge=1, description="1-based page number")] = 1,
    per_page: Annotated[int, Query(alias="perPage", ge=1, le=MAX_PER_PAGE)] = 24,
) -> PageParams:
    return PageParams(page=page, per_page=per_page)


Paging = Annotated[PageParams, Depends(_page_params)]


class PageMeta(ApiModel):
    total: int
    page: int
    per_page: int
    pages: int


class Page[T](ApiModel):
    """The one list envelope: { data: [...], meta: { total, page, perPage, pages } }."""

    data: list[T]
    meta: PageMeta

    @classmethod
    def of(cls, data: list[T], total: int, params: PageParams) -> Page[T]:
        pages = ceil(total / params.per_page) if total else 0
        return cls(data=data, meta=PageMeta(total=total, page=params.page, per_page=params.per_page, pages=pages))
