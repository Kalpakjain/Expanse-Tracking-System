from datetime import date, datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ReceiptTransactionCreate(BaseModel):
    account_name: str = Field(default="Primary Wallet", min_length=2, max_length=60)
    account_id: UUID | None = None
    category_id: UUID | None = None
    amount: float | None = Field(default=None, gt=0)
    transaction_date: date = Field(default_factory=date.today)
    payment_method: str = Field(default="UPI", min_length=2, max_length=40)
    description: str = Field(default="Imported from receipt", max_length=160)
    notes: str = Field(default="", max_length=250)


class ReceiptRead(BaseModel):
    id: UUID
    file_name: str
    content_type: str
    file_size: int
    status: str
    extracted_text: str
    merchant_name: str
    suggested_amount: float | None
    suggested_category_id: UUID | None
    suggested_category_name: str | None
    confidence_score: float
    duplicate_count: int = 0
    created_at: datetime
    updated_at: datetime
