from __future__ import annotations

from collections import defaultdict
from datetime import date

from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.db.models import Category, Transaction, User
from app.schemas.report import CategoryReportItem, ReportsOverview, SmartInsight
from app.services.finance import get_dashboard_summary


def get_reports_overview(db: Session, user: User) -> ReportsOverview:
    categories = db.scalars(
        select(Category)
        .where(or_(Category.user_id.is_(None), Category.user_id == user.id))
        .order_by(Category.name.asc())
    ).all()
    transactions = db.scalars(
        select(Transaction)
        .where(Transaction.user_id == user.id)
        .options(selectinload(Transaction.category))
        .order_by(Transaction.transaction_date.desc())
    ).all()

    category_breakdown: list[CategoryReportItem] = []

    current_month = date.today().month
    current_year = date.today().year

    transaction_counts_by_category: dict[str, int] = defaultdict(int)
    spent_by_category: dict[str, float] = defaultdict(float)
    for transaction in transactions:
        if (
            transaction.type != "expense"
            or transaction.transaction_date.month != current_month
            or transaction.transaction_date.year != current_year
        ):
            continue
        spent_by_category[transaction.category_id] += transaction.amount
        transaction_counts_by_category[transaction.category_id] += 1

    for category in categories:
        if category.type != "expense":
            continue

        spent_amount = round(spent_by_category.get(category.id, 0.0), 2)
        transaction_count = transaction_counts_by_category.get(category.id, 0)

        category_breakdown.append(
            CategoryReportItem(
                category_id=category.id,
                category_name=category.name,
                category_color=category.color,
                spent_amount=spent_amount,
                transaction_count=transaction_count,
            )
        )

    category_breakdown.sort(key=lambda item: (-item.spent_amount, item.category_name.lower()))

    return ReportsOverview(
        summary=get_dashboard_summary(db, user),
        category_breakdown=category_breakdown,
        smart_insights=_build_smart_insights(category_breakdown, transactions),
    )


def _build_smart_insights(
    category_breakdown: list[CategoryReportItem],
    transactions: list[Transaction],
) -> list[SmartInsight]:
    insights: list[SmartInsight] = []
    total_expense = round(sum(item.spent_amount for item in category_breakdown), 2)

    if total_expense > 0 and category_breakdown:
        top_category = max(category_breakdown, key=lambda item: item.spent_amount)
        share = round((top_category.spent_amount / total_expense) * 100, 1)
        if share >= 45:
            insights.append(
                SmartInsight(
                    title="Concentrated spending",
                    message=f"{top_category.category_name} makes up {share}% of recorded expenses.",
                    severity="medium",
                )
            )

    recent_expenses = [transaction for transaction in transactions if transaction.type == "expense"]
    if len(recent_expenses) < 3:
        insights.append(
            SmartInsight(
                title="More data needed",
                message="Add a few more expenses to unlock stronger trend and anomaly signals.",
                severity="low",
            )
        )

    if not insights:
        insights.append(
            SmartInsight(
                title="Spending looks balanced",
                message="No single-category spikes stand out in the current data.",
                severity="low",
            )
        )

    return insights[:3]
