from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


EmailField = Field(min_length=5, max_length=255, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class UserRead(BaseModel):
    id: UUID
    email: str
    full_name: str
    is_demo: bool
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class AuthRegister(BaseModel):
    email: str = EmailField
    full_name: str = Field(min_length=2, max_length=80)
    password: str = Field(min_length=8, max_length=128)


class AuthLogin(BaseModel):
    email: str = EmailField
    password: str = Field(min_length=8, max_length=128)


class AuthSession(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserRead
