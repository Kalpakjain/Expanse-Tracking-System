from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class BudgetCreate(BaseModel):
    category_id: UUID
    month: int = Field(ge=1, le=12)
    year: int = Field(ge=2025, le=2100)
    limit_amount: float = Field(gt=0)
    currency_code: str = Field(default="INR", min_length=3, max_length=3)
    alert_threshold_percent: int = Field(default=80, ge=1, le=100)


class BudgetRead(BaseModel):
    id: UUID
    category_id: UUID
    category_name: str
    month: int
    year: int
    limit_amount: float
    spent_amount: float
    remaining_amount: float
    utilization_percent: float
    currency_code: str
    alert_threshold_percent: int
    is_active: bool
    created_at: datetime
    updated_at: datetime
