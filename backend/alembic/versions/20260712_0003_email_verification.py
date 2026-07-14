"""Add email verification fields.

Revision ID: 20260712_0003
Revises: 20260613_0002
Create Date: 2026-07-12
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260712_0003"
down_revision: str | None = "20260613_0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("users", sa.Column("email_verified", sa.Boolean(), nullable=False, server_default=sa.true()))
    op.add_column(
        "users",
        sa.Column("email_verification_code_hash", sa.String(length=255), nullable=False, server_default=""),
    )
    op.alter_column("users", "email_verified", server_default=None)
    op.alter_column("users", "email_verification_code_hash", server_default=None)


def downgrade() -> None:
    op.drop_column("users", "email_verification_code_hash")
    op.drop_column("users", "email_verified")
