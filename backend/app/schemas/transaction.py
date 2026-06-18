from datetime import date, datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


TransactionType = Literal["expense", "income"]


class TransactionBase(BaseModel):
    account_name: str = Field(min_length=2, max_length=60)
    account_id: UUID | None = None
    category_id: UUID
    type: TransactionType
    amount: float = Field(gt=0)
    currency_code: str = Field(default="INR", min_length=3, max_length=3)
    merchant_name: str = Field(min_length=2, max_length=80)
    description: str = Field(default="", max_length=160)
    transaction_date: date
    payment_method: str = Field(default="UPI", min_length=2, max_length=40)
    notes: str = Field(default="", max_length=250)


class TransactionCreate(TransactionBase):
    pass


class TransactionUpdate(TransactionBase):
    pass


class TransactionRead(TransactionCreate):
    id: UUID
    account_display_name: str
    category_name: str
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
