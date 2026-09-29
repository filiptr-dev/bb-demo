from datetime import datetime

from pydantic import Field

from app.core.schemas import ApiModel


class DatasheetRow(ApiModel):
    name: str = Field(description="SKF's name for the value, e.g. 'Shoulder diameter' (English)")
    symbol: str | None = Field(default=None, description="Plain-text symbol, e.g. 'd1', 'C0', 'kr'")
    value: float | str | None = None
    min: float | None = Field(default=None, description="For a range, e.g. a tolerance")
    max: float | None = None
    unit: str | None = None
    qualifier: str | None = Field(default=None, description="'≈' for approximate values")


class DatasheetSection(ApiModel):
    title: str = Field(description="e.g. 'Dimensions', 'Abutment dimensions', 'Calculation data', 'Properties'")
    rows: list[DatasheetRow]


class ProductSpecs(ApiModel):
    """SKF technical data for a product. Loads in kN, speeds in r/min, mass in kg."""

    slug: str
    c: float | None = Field(description="Basic dynamic load rating C, kN")
    c0: float | None = Field(description="Basic static load rating C0, kN")
    pu: float | None = Field(description="Fatigue load limit Pu, kN")
    reference_speed: float | None = Field(description="r/min")
    limiting_speed: float | None = Field(description="r/min")
    mass: float | None = Field(description="kg")
    performance_class: str | None = Field(description="e.g. 'SKF Explorer'")
    factors: dict[str, float] = Field(description="Calculation factors by symbol: kr, f0, e, Y, Y0, Y1, Y2, ...")
    datasheet: list[DatasheetSection]
    source_url: str | None = Field(description="The product's page on skf.com")
    fetched_at: datetime
