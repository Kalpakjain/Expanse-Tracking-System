from __future__ import annotations

from datetime import date, datetime
from uuid import uuid4

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False),
        nullable=False,
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=False),
        nullable=False,
        server_default=func.now(),
        onupdate=datetime.utcnow,
    )


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    full_name: Mapped[str] = mapped_column(String(80), nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)
    is_demo: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    email_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    email_verification_code_hash: Mapped[str] = mapped_column(String(255), nullable=False, default="")
    email_verification_code_expires_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), nullable=True)
    otp_request_window_started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=False), nullable=True)
    otp_request_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    otp_attempt_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    categories: Mapped[list["Category"]] = relationship(back_populates="user")
    payment_accounts: Mapped[list["PaymentAccount"]] = relationship(back_populates="user")
    transactions: Mapped[list["Transaction"]] = relationship(back_populates="user")
    receipts: Mapped[list["Receipt"]] = relationship(back_populates="user")
    budgets: Mapped[list["Budget"]] = relationship(back_populates="user")
    groups_created: Mapped[list["Group"]] = relationship(back_populates="creator")
    group_memberships: Mapped[list["GroupMember"]] = relationship(back_populates="user")
    group_expenses_paid: Mapped[list["GroupExpense"]] = relationship(back_populates="payer")
    group_expense_splits: Mapped[list["GroupExpenseSplit"]] = relationship(back_populates="user")
    settlements_made: Mapped[list["Settlement"]] = relationship(
        back_populates="from_user",
        foreign_keys="Settlement.from_user_id",
    )
    settlements_received: Mapped[list["Settlement"]] = relationship(
        back_populates="to_user",
        foreign_keys="Settlement.to_user_id",
    )


class Category(Base, TimestampMixin):
    __tablename__ = "categories"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    name: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    type: Mapped[str] = mapped_column(String(20), nullable=False)
    color: Mapped[str] = mapped_column(String(20), nullable=False, default="#2F855A")
    icon: Mapped[str] = mapped_column(String(40), nullable=False, default="wallet")
    is_default: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    user: Mapped[User | None] = relationship(back_populates="categories")
    transactions: Mapped[list["Transaction"]] = relationship(back_populates="category")
    budgets: Mapped[list["Budget"]] = relationship(back_populates="category")


class PaymentAccount(Base, TimestampMixin):
    __tablename__ = "payment_accounts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    name: Mapped[str] = mapped_column(String(60), nullable=False)
    type: Mapped[str] = mapped_column(String(30), nullable=False, default="wallet")
    institution_name: Mapped[str] = mapped_column(String(80), nullable=False, default="")
    opening_balance: Mapped[float] = mapped_column(Float, nullable=False, default=0.0)
    currency_code: Mapped[str] = mapped_column(String(3), nullable=False, default="INR")
    color: Mapped[str] = mapped_column(String(20), nullable=False, default="#0051D5")
    is_default: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    user: Mapped[User] = relationship(back_populates="payment_accounts")
    transactions: Mapped[list["Transaction"]] = relationship(back_populates="account")


class Transaction(Base, TimestampMixin):
    __tablename__ = "transactions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    account_id: Mapped[str | None] = mapped_column(ForeignKey("payment_accounts.id"), nullable=True, index=True)
    account_name: Mapped[str] = mapped_column(String(60), nullable=False)
    category_id: Mapped[str] = mapped_column(ForeignKey("categories.id"), nullable=False, index=True)
    type: Mapped[str] = mapped_column(String(20), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency_code: Mapped[str] = mapped_column(String(3), nullable=False, default="INR")
    merchant_name: Mapped[str] = mapped_column(String(80), nullable=False)
    description: Mapped[str] = mapped_column(String(160), nullable=False, default="")
    transaction_date: Mapped[date] = mapped_column(Date, nullable=False)
    payment_method: Mapped[str] = mapped_column(String(40), nullable=False, default="UPI")
    notes: Mapped[str] = mapped_column(String(250), nullable=False, default="")

    user: Mapped[User] = relationship(back_populates="transactions")
    account: Mapped[PaymentAccount | None] = relationship(back_populates="transactions")
    category: Mapped[Category] = relationship(back_populates="transactions")

    @staticmethod
    def today() -> date:
        return date.today()


class Receipt(Base, TimestampMixin):
    __tablename__ = "receipts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    file_name: Mapped[str] = mapped_column(String(180), nullable=False)
    content_type: Mapped[str] = mapped_column(String(80), nullable=False, default="application/octet-stream")
    file_size: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="review_ready")
    extracted_text: Mapped[str] = mapped_column(Text, nullable=False, default="")
    merchant_name: Mapped[str] = mapped_column(String(80), nullable=False, default="")
    suggested_amount: Mapped[float | None] = mapped_column(Float, nullable=True)
    suggested_category_id: Mapped[str | None] = mapped_column(ForeignKey("categories.id"), nullable=True, index=True)
    confidence_score: Mapped[float] = mapped_column(Float, nullable=False, default=0.62)

    user: Mapped[User] = relationship(back_populates="receipts")
    suggested_category: Mapped[Category | None] = relationship()


class Budget(Base, TimestampMixin):
    __tablename__ = "budgets"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    category_id: Mapped[str] = mapped_column(ForeignKey("categories.id"), nullable=False, index=True)
    month: Mapped[int] = mapped_column(Integer, nullable=False)
    year: Mapped[int] = mapped_column(Integer, nullable=False)
    limit_amount: Mapped[float] = mapped_column(Float, nullable=False)
    currency_code: Mapped[str] = mapped_column(String(3), nullable=False, default="INR")
    alert_threshold_percent: Mapped[int] = mapped_column(Integer, nullable=False, default=80)
    is_active: Mapped[bool] = mapped_column(Boolean, nullable=False, default=True)

    user: Mapped[User] = relationship(back_populates="budgets")
    category: Mapped[Category] = relationship(back_populates="budgets")


class Group(Base, TimestampMixin):
    __tablename__ = "groups"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    created_by: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)

    creator: Mapped[User] = relationship(back_populates="groups_created")
    members: Mapped[list["GroupMember"]] = relationship(back_populates="group")
    expenses: Mapped[list["GroupExpense"]] = relationship(back_populates="group")
    settlements: Mapped[list["Settlement"]] = relationship(back_populates="group")


class GroupMember(Base):
    __tablename__ = "group_members"
    __table_args__ = (UniqueConstraint("group_id", "user_id", name="uq_group_members_group_id_user_id"),)

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    group_id: Mapped[str] = mapped_column(ForeignKey("groups.id"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    joined_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False, server_default=func.now())

    group: Mapped[Group] = relationship(back_populates="members")
    user: Mapped[User] = relationship(back_populates="group_memberships")


class GroupExpense(Base, TimestampMixin):
    __tablename__ = "group_expenses"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    group_id: Mapped[str] = mapped_column(ForeignKey("groups.id"), nullable=False, index=True)
    paid_by: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    description: Mapped[str] = mapped_column(String(160), nullable=False)
    category_id: Mapped[str | None] = mapped_column(ForeignKey("categories.id"), nullable=True, index=True)
    expense_date: Mapped[date] = mapped_column(Date, nullable=False)
    split_type: Mapped[str] = mapped_column(String(20), nullable=False)

    group: Mapped[Group] = relationship(back_populates="expenses")
    payer: Mapped[User] = relationship(back_populates="group_expenses_paid")
    category: Mapped[Category | None] = relationship()
    splits: Mapped[list["GroupExpenseSplit"]] = relationship(back_populates="group_expense")


class GroupExpenseSplit(Base):
    __tablename__ = "group_expense_splits"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    group_expense_id: Mapped[str] = mapped_column(ForeignKey("group_expenses.id"), nullable=False, index=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    amount_owed: Mapped[float] = mapped_column(Float, nullable=False)
    is_settled: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)

    group_expense: Mapped[GroupExpense] = relationship(back_populates="splits")
    user: Mapped[User] = relationship(back_populates="group_expense_splits")


class Settlement(Base):
    __tablename__ = "settlements"

    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=lambda: str(uuid4()))
    group_id: Mapped[str] = mapped_column(ForeignKey("groups.id"), nullable=False, index=True)
    from_user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    to_user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    note: Mapped[str] = mapped_column(String(160), nullable=False, default="")
    settled_at: Mapped[datetime] = mapped_column(DateTime(timezone=False), nullable=False, server_default=func.now())

    group: Mapped[Group] = relationship(back_populates="settlements")
    from_user: Mapped[User] = relationship(
        back_populates="settlements_made",
        foreign_keys=[from_user_id],
    )
    to_user: Mapped[User] = relationship(
        back_populates="settlements_received",
        foreign_keys=[to_user_id],
    )
