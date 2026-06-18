"""Add payment accounts.

Revision ID: 20260613_0002
Revises: 20260613_0001
Create Date: 2026-06-13
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "20260613_0002"
down_revision: str | None = "20260613_0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "payment_accounts",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=60), nullable=False),
        sa.Column("type", sa.String(length=30), nullable=False),
        sa.Column("institution_name", sa.String(length=80), nullable=False),
        sa.Column("opening_balance", sa.Float(), nullable=False),
        sa.Column("currency_code", sa.String(length=3), nullable=False),
        sa.Column("color", sa.String(length=20), nullable=False),
        sa.Column("is_default", sa.Boolean(), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=False), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=False), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_payment_accounts_user_id", "payment_accounts", ["user_id"])
    with op.batch_alter_table("transactions") as batch_op:
        batch_op.add_column(sa.Column("account_id", sa.String(length=36), nullable=True))
        batch_op.create_index("ix_transactions_account_id", ["account_id"])
        batch_op.create_foreign_key(
            "fk_transactions_account_id_payment_accounts",
            "payment_accounts",
            ["account_id"],
            ["id"],
        )


def downgrade() -> None:
    with op.batch_alter_table("transactions") as batch_op:
        batch_op.drop_constraint("fk_transactions_account_id_payment_accounts", type_="foreignkey")
        batch_op.drop_index("ix_transactions_account_id")
        batch_op.drop_column("account_id")
    op.drop_index("ix_payment_accounts_user_id", table_name="payment_accounts")
    op.drop_table("payment_accounts")
