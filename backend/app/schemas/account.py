from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


AccountType = Literal["cash", "bank", "upi", "credit_card", "wallet"]


class PaymentAccountCreate(BaseModel):
    name: str = Field(min_length=2, max_length=60)
    type: AccountType = "wallet"
    institution_name: str = Field(default="", max_length=80)
    opening_balance: float = 0.0
    currency_code: str = Field(default="INR", min_length=3, max_length=3)
    color: str = Field(default="#0051D5", min_length=4, max_length=20)
    is_default: bool = False


class PaymentAccountUpdate(PaymentAccountCreate):
    pass


class PaymentAccountRead(PaymentAccountCreate):
    id: UUID
    current_balance: float
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
