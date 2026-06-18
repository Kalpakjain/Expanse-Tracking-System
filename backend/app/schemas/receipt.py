from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


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
    created_at: datetime
    updated_at: datetime
