from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class GroupExpenseSplitInput(BaseModel):
    user_id: UUID
    value: float


class GroupExpenseCreate(BaseModel):
    group_id: UUID
    paid_by: UUID | None = None
    amount: float = Field(gt=0)
    description: str = Field(max_length=160)
    category_id: UUID | None = None
    expense_date: date
    split_type: Literal["equal", "percentage", "custom"]
    splits: list[GroupExpenseSplitInput] | None = None


class GroupExpenseSplitRead(BaseModel):
    user_id: UUID
    full_name: str
    amount_owed: float
    is_settled: bool


class GroupExpenseRead(BaseModel):
    id: UUID
    group_id: UUID
    paid_by: UUID
    paid_by_name: str
    amount: float
    description: str
    expense_date: date
    split_type: str
    splits: list[GroupExpenseSplitRead]
    created_at: datetime
