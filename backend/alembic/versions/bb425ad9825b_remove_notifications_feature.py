"""remove notifications feature

Revision ID: bb425ad9825b
Revises: 07d14164c9fb
Create Date: 2026-07-15 15:47:13.492686
"""

from collections.abc import Sequence

from alembic import op
import sqlalchemy as sa


revision: str = 'bb425ad9825b'
down_revision: str | None = '07d14164c9fb'
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.drop_index("ix_notification_preferences_user_id", table_name="notification_preferences")
    op.drop_table('notification_preferences')


def downgrade() -> None:
    op.create_table('notification_preferences',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('phone_number', sa.String(length=20), nullable=False),
        sa.Column('daily_digest_enabled', sa.Boolean(), nullable=False),
        sa.Column('budget_alerts_enabled', sa.Boolean(), nullable=False),
        sa.Column('weekly_report_enabled', sa.Boolean(), nullable=False),
        sa.Column('preferred_send_hour', sa.Integer(), nullable=False),
        sa.Column('timezone', sa.String(length=64), nullable=False),
        sa.Column('currency_code', sa.String(length=3), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=False), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=False), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index("ix_notification_preferences_user_id", "notification_preferences", ["user_id"])
