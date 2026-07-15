"""add group expense splitting tables

Revision ID: 07d14164c9fb
Revises: 20260713_0004
Create Date: 2026-07-14 20:48:25.761739
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = "07d14164c9fb"
down_revision: str | None = "20260713_0004"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "groups",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("created_by", sa.String(length=36), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=False), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=False), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["created_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_groups_created_by"), "groups", ["created_by"], unique=False)

    op.create_table(
        "group_members",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("group_id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("joined_at", sa.DateTime(timezone=False), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["group_id"], ["groups.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("group_id", "user_id", name="uq_group_members_group_id_user_id"),
    )
    op.create_index(op.f("ix_group_members_group_id"), "group_members", ["group_id"], unique=False)
    op.create_index(op.f("ix_group_members_user_id"), "group_members", ["user_id"], unique=False)

    op.create_table(
        "group_expenses",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("group_id", sa.String(length=36), nullable=False),
        sa.Column("paid_by", sa.String(length=36), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("description", sa.String(length=160), nullable=False),
        sa.Column("category_id", sa.String(length=36), nullable=True),
        sa.Column("expense_date", sa.Date(), nullable=False),
        sa.Column("split_type", sa.String(length=20), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=False), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=False), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"]),
        sa.ForeignKeyConstraint(["group_id"], ["groups.id"]),
        sa.ForeignKeyConstraint(["paid_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_group_expenses_category_id"), "group_expenses", ["category_id"], unique=False)
    op.create_index(op.f("ix_group_expenses_group_id"), "group_expenses", ["group_id"], unique=False)
    op.create_index(op.f("ix_group_expenses_paid_by"), "group_expenses", ["paid_by"], unique=False)

    op.create_table(
        "settlements",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("group_id", sa.String(length=36), nullable=False),
        sa.Column("from_user_id", sa.String(length=36), nullable=False),
        sa.Column("to_user_id", sa.String(length=36), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("note", sa.String(length=160), nullable=False),
        sa.Column("settled_at", sa.DateTime(timezone=False), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["from_user_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["group_id"], ["groups.id"]),
        sa.ForeignKeyConstraint(["to_user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_settlements_from_user_id"), "settlements", ["from_user_id"], unique=False)
    op.create_index(op.f("ix_settlements_group_id"), "settlements", ["group_id"], unique=False)
    op.create_index(op.f("ix_settlements_to_user_id"), "settlements", ["to_user_id"], unique=False)

    op.create_table(
        "group_expense_splits",
        sa.Column("id", sa.String(length=36), nullable=False),
        sa.Column("group_expense_id", sa.String(length=36), nullable=False),
        sa.Column("user_id", sa.String(length=36), nullable=False),
        sa.Column("amount_owed", sa.Float(), nullable=False),
        sa.Column("is_settled", sa.Boolean(), nullable=False),
        sa.ForeignKeyConstraint(["group_expense_id"], ["group_expenses.id"]),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(
        op.f("ix_group_expense_splits_group_expense_id"),
        "group_expense_splits",
        ["group_expense_id"],
        unique=False,
    )
    op.create_index(op.f("ix_group_expense_splits_user_id"), "group_expense_splits", ["user_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_group_expense_splits_user_id"), table_name="group_expense_splits")
    op.drop_index(op.f("ix_group_expense_splits_group_expense_id"), table_name="group_expense_splits")
    op.drop_table("group_expense_splits")

    op.drop_index(op.f("ix_settlements_to_user_id"), table_name="settlements")
    op.drop_index(op.f("ix_settlements_group_id"), table_name="settlements")
    op.drop_index(op.f("ix_settlements_from_user_id"), table_name="settlements")
    op.drop_table("settlements")

    op.drop_index(op.f("ix_group_expenses_paid_by"), table_name="group_expenses")
    op.drop_index(op.f("ix_group_expenses_group_id"), table_name="group_expenses")
    op.drop_index(op.f("ix_group_expenses_category_id"), table_name="group_expenses")
    op.drop_table("group_expenses")

    op.drop_index(op.f("ix_group_members_user_id"), table_name="group_members")
    op.drop_index(op.f("ix_group_members_group_id"), table_name="group_members")
    op.drop_table("group_members")

    op.drop_index(op.f("ix_groups_created_by"), table_name="groups")
    op.drop_table("groups")
