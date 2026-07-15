from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class SettlementCreate(BaseModel):
    group_id: UUID
    to_user_id: UUID
    amount: float = Field(gt=0)
    note: str = ""


class SettlementRead(BaseModel):
    id: UUID
    group_id: UUID
    from_user_id: UUID
    from_user_name: str
    to_user_id: UUID
    to_user_name: str
    amount: float
    note: str
    settled_at: datetime


class GroupBalanceEntry(BaseModel):
    user_id: UUID
    full_name: str
    net_balance: float


class GroupBalanceRead(BaseModel):
    group_id: UUID
    balances: list[GroupBalanceEntry]
