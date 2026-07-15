from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class GroupCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    member_names: list[str] = []


class GroupMemberRead(BaseModel):
    user_id: UUID
    full_name: str
    email: str = ""
    is_placeholder: bool = False


class GroupRead(BaseModel):
    id: UUID
    name: str
    created_by: UUID
    members: list[GroupMemberRead]
    created_at: datetime
