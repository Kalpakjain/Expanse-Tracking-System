"""Add OTP expiry and rate-limit fields.

Revision ID: 20260713_0004
Revises: 20260712_0003
Create Date: 2026-07-13
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260713_0004"
down_revision: str | None = "20260712_0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("users", sa.Column("email_verification_code_expires_at", sa.DateTime(), nullable=True))
    op.add_column("users", sa.Column("otp_request_window_started_at", sa.DateTime(), nullable=True))
    op.add_column("users", sa.Column("otp_request_count", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("users", sa.Column("otp_attempt_count", sa.Integer(), nullable=False, server_default="0"))
    op.alter_column("users", "otp_request_count", server_default=None)
    op.alter_column("users", "otp_attempt_count", server_default=None)


def downgrade() -> None:
    op.drop_column("users", "otp_attempt_count")
    op.drop_column("users", "otp_request_count")
    op.drop_column("users", "otp_request_window_started_at")
    op.drop_column("users", "email_verification_code_expires_at")
