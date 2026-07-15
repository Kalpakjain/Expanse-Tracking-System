from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


EmailField = Field(min_length=5, max_length=255, pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class UserRead(BaseModel):
    id: UUID
    email: str
    full_name: str
    is_demo: bool
    email_verified: bool
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


class AuthRegisterResponse(BaseModel):
    email: str
    verification_required: bool = True
    dev_verification_code: str | None = None


class VerifyEmailRequest(BaseModel):
    email: str = EmailField
    code: str = Field(min_length=6, max_length=6)


class ResendVerificationRequest(BaseModel):
    email: str = EmailField


class ForgotPasswordRequest(BaseModel):
    email: str = EmailField


class ResetPasswordRequest(BaseModel):
    email: str = EmailField
    code: str = Field(min_length=6, max_length=6)
    password: str = Field(min_length=8, max_length=128)


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=8, max_length=128)
    new_password: str = Field(min_length=8, max_length=128)
