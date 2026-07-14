from collections import Counter, defaultdict
from datetime import date, timedelta

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Budget, NotificationPreference, Transaction, User
from app.schemas.notification import (
    NotificationPreferencesRead,
    NotificationPreferencesUpdate,
    NotificationPreview,
    NotificationPreviewItem,
)


def get_notification_preferences(db: Session, user: User) -> NotificationPreferencesRead:
    preferences = _get_or_create_preferences(db, user)
    return _to_notification_preferences_read(preferences)


def update_notification_preferences(
    db: Session,
    user: User,
    payload: NotificationPreferencesUpdate,
) -> NotificationPreferencesRead:
    preferences = _get_or_create_preferences(db, user)
    preferences.phone_number = payload.phone_number.strip()
    preferences.daily_digest_enabled = payload.daily_digest_enabled
    preferences.budget_alerts_enabled = payload.budget_alerts_enabled
    preferences.weekly_report_enabled = payload.weekly_report_enabled
    preferences.preferred_send_hour = payload.preferred_send_hour
    preferences.timezone = payload.timezone.strip()
    preferences.currency_code = payload.currency_code.upper()
    db.add(preferences)
    db.commit()
    db.refresh(preferences)
    return _to_notification_preferences_read(preferences)


def get_notification_preview(db: Session, user: User) -> NotificationPreview:
    preferences = _get_or_create_preferences(db, user)
    today = date.today()
    week_start = today - timedelta(days=6)
    month_start = today.replace(day=1)

    transactions = db.scalars(
        select(Transaction)
        .where(Transaction.user_id == user.id, Transaction.transaction_date >= month_start)
        .order_by(Transaction.transaction_date.desc())
    ).all()
    budgets = db.scalars(select(Budget).where(Budget.user_id == user.id, Budget.is_active.is_(True))).all()

    messages: list[NotificationPreviewItem] = []
    messages.append(_build_daily_digest(transactions, today, preferences.daily_digest_enabled))
    if preferences.budget_alerts_enabled:
        messages.extend(_build_budget_alerts(transactions, budgets, today))
    else:
        messages.append(
            NotificationPreviewItem(
                kind="budget_alert",
                title="Budget alerts disabled",
                message="Turn on budget alerts to preview category threshold messages.",
                severity="low",
                enabled=False,
            )
        )
    messages.append(_build_weekly_summary(transactions, week_start, preferences.weekly_report_enabled))
    messages.extend(_build_recurring_reminders(transactions))

    return NotificationPreview(
        send_hour=preferences.preferred_send_hour,
        timezone=preferences.timezone,
        phone_number=preferences.phone_number,
        messages=messages[:6],
    )


def _get_or_create_preferences(db: Session, user: User) -> NotificationPreference:
    preferences = db.scalar(select(NotificationPreference).where(NotificationPreference.user_id == user.id).limit(1))
    if preferences is not None:
        return preferences

    preferences = NotificationPreference(
        user_id=user.id,
        phone_number="",
        daily_digest_enabled=True,
        budget_alerts_enabled=True,
        weekly_report_enabled=False,
        preferred_send_hour=20,
        timezone="Asia/Kolkata",
        currency_code="INR",
    )
    db.add(preferences)
    db.commit()
    db.refresh(preferences)
    return preferences


def _to_notification_preferences_read(
    preferences: NotificationPreference,
) -> NotificationPreferencesRead:
    return NotificationPreferencesRead(
        id=preferences.id,
        phone_number=preferences.phone_number,
        daily_digest_enabled=preferences.daily_digest_enabled,
        budget_alerts_enabled=preferences.budget_alerts_enabled,
        weekly_report_enabled=preferences.weekly_report_enabled,
        preferred_send_hour=preferences.preferred_send_hour,
        timezone=preferences.timezone,
        currency_code=preferences.currency_code,
        created_at=preferences.created_at,
        updated_at=preferences.updated_at,
    )


def _build_daily_digest(
    transactions: list[Transaction],
    today: date,
    enabled: bool,
) -> NotificationPreviewItem:
    today_expenses = [
        transaction
        for transaction in transactions
        if transaction.type == "expense" and transaction.transaction_date == today
    ]
    spent_today = round(sum(transaction.amount for transaction in today_expenses), 2)
    merchant_count = len({transaction.merchant_name.lower() for transaction in today_expenses})
    if spent_today > 0:
        message = f"Today you spent INR {spent_today:,.2f} across {merchant_count} merchants."
    else:
        message = "No expenses recorded today. Add expenses to keep the daily digest useful."
    return NotificationPreviewItem(
        kind="daily_digest",
        title="Daily expense digest",
        message=message,
        severity="low",
        enabled=enabled,
    )


def _build_budget_alerts(
    transactions: list[Transaction],
    budgets: list[Budget],
    today: date,
) -> list[NotificationPreviewItem]:
    spent_by_category: dict[str, float] = defaultdict(float)
    for transaction in transactions:
        if (
            transaction.type == "expense"
            and transaction.transaction_date.month == today.month
            and transaction.transaction_date.year == today.year
        ):
            spent_by_category[transaction.category_id] += transaction.amount

    alerts: list[NotificationPreviewItem] = []
    for budget in budgets:
        if budget.month != today.month or budget.year != today.year or budget.limit_amount <= 0:
            continue
        spent_amount = round(spent_by_category.get(budget.category_id, 0.0), 2)
        utilization = round((spent_amount / budget.limit_amount) * 100, 1)
        if utilization < budget.alert_threshold_percent:
            continue
        category_name = budget.category.name if budget.category else "A category"
        severity = "high" if utilization >= 100 else "medium"
        alerts.append(
            NotificationPreviewItem(
                kind="budget_alert",
                title=f"{category_name} budget alert",
                message=(
                    f"{category_name} is at {utilization}% of budget "
                    f"(INR {spent_amount:,.2f} of INR {budget.limit_amount:,.2f})."
                ),
                severity=severity,
            )
        )

    if not alerts:
        return [
            NotificationPreviewItem(
                kind="budget_alert",
                title="Budgets under control",
                message="No category has crossed its alert threshold this month.",
                severity="low",
            )
        ]
    severity_rank = {"high": 3, "medium": 2, "low": 1}
    return sorted(alerts, key=lambda item: severity_rank[item.severity], reverse=True)


def _build_weekly_summary(
    transactions: list[Transaction],
    week_start: date,
    enabled: bool,
) -> NotificationPreviewItem:
    week_expenses = [
        transaction
        for transaction in transactions
        if transaction.type == "expense" and transaction.transaction_date >= week_start
    ]
    total = round(sum(transaction.amount for transaction in week_expenses), 2)
    category_totals: Counter[str] = Counter()
    for transaction in week_expenses:
        category_name = transaction.category.name if transaction.category else "Unknown"
        category_totals[category_name] += transaction.amount
    top_category = category_totals.most_common(1)[0][0] if category_totals else "none yet"
    message = f"This week you spent INR {total:,.2f}. Top category: {top_category}."
    return NotificationPreviewItem(
        kind="weekly_summary",
        title="Weekly financial summary",
        message=message,
        severity="low",
        enabled=enabled,
    )


def _build_recurring_reminders(transactions: list[Transaction]) -> list[NotificationPreviewItem]:
    merchant_counts: Counter[str] = Counter()
    merchant_amounts: dict[str, float] = defaultdict(float)
    merchant_labels: dict[str, str] = {}
    for transaction in transactions:
        if transaction.type != "expense":
            continue
        merchant_key = transaction.merchant_name.strip().lower()
        if not merchant_key:
            continue
        merchant_counts[merchant_key] += 1
        merchant_amounts[merchant_key] += transaction.amount
        merchant_labels[merchant_key] = transaction.merchant_name

    reminders: list[NotificationPreviewItem] = []
    for merchant_key, count in merchant_counts.most_common(2):
        if count < 2:
            continue
        average_amount = merchant_amounts[merchant_key] / count
        reminders.append(
            NotificationPreviewItem(
                kind="recurring_reminder",
                title=f"Recurring pattern: {merchant_labels[merchant_key]}",
                message=(
                    f"{merchant_labels[merchant_key]} appeared {count} times this month. "
                    f"Typical amount is around INR {average_amount:,.2f}."
                ),
                severity="medium",
            )
        )

    if reminders:
        return reminders
    return [
        NotificationPreviewItem(
            kind="recurring_reminder",
            title="Recurring reminders",
            message="No recurring merchant pattern is strong enough yet.",
            severity="low",
        )
    ]
