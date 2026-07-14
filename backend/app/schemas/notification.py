from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class NotificationPreferencesUpdate(BaseModel):
    phone_number: str = Field(default="", max_length=20)
    daily_digest_enabled: bool = True
    budget_alerts_enabled: bool = True
    weekly_report_enabled: bool = False
    preferred_send_hour: int = Field(default=20, ge=0, le=23)
    timezone: str = Field(default="Asia/Kolkata", min_length=3, max_length=64)
    currency_code: str = Field(default="INR", min_length=3, max_length=3)


class NotificationPreferencesRead(NotificationPreferencesUpdate):
    id: UUID
    created_at: datetime
    updated_at: datetime


NotificationKind = Literal["daily_digest", "budget_alert", "weekly_summary", "recurring_reminder"]
NotificationSeverity = Literal["low", "medium", "high"]


class NotificationPreviewItem(BaseModel):
    kind: NotificationKind
    title: str
    message: str
    severity: NotificationSeverity = "low"
    enabled: bool = True


class NotificationPreview(BaseModel):
    send_hour: int
    timezone: str
    phone_number: str
    messages: list[NotificationPreviewItem]
