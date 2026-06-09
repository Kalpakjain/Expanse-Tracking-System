from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


CategoryType = Literal["expense", "income"]


class CategoryCreate(BaseModel):
    name: str = Field(min_length=2, max_length=50)
    type: CategoryType
    color: str = Field(default="#2F855A", min_length=4, max_length=20)
    icon: str = Field(default="wallet", min_length=2, max_length=40)


class CategoryRead(CategoryCreate):
    id: UUID
    is_default: bool = False
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
