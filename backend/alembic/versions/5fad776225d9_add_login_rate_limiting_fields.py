"""add login rate limiting fields

Revision ID: 5fad776225d9
Revises: 4e6b7d4b1a2c
Create Date: 2026-07-18 23:30:49.907165
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = '5fad776225d9'
down_revision: str | None = '4e6b7d4b1a2c'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column("users", sa.Column("login_attempt_count", sa.Integer(), nullable=False, server_default="0"))
    op.add_column("users", sa.Column("login_locked_until", sa.DateTime(timezone=False), nullable=True))
    op.alter_column("users", "login_attempt_count", server_default=None)


def downgrade() -> None:
    op.drop_column("users", "login_locked_until")
    op.drop_column("users", "login_attempt_count")
