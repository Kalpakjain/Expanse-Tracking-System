from __future__ import annotations

from collections import defaultdict
from datetime import date
from uuid import UUID

from sqlalchemy import or_, select
from sqlalchemy.orm import Session, selectinload

from app.db.models import Budget, Category, Transaction, User
from app.schemas.budget import BudgetCreate, BudgetRead, BudgetUpdate
from app.schemas.report import CategoryReportItem, ReportsOverview, SmartInsight
from app.services.finance import get_dashboard_summary


def list_budgets(db: Session, user: User) -> list[BudgetRead]:
    budgets = db.scalars(
        select(Budget)
        .where(Budget.user_id == user.id)
        .options(selectinload(Budget.category))
        .order_by(Budget.year.desc(), Budget.month.desc())
    ).all()
    usage = _build_budget_usage_map(db, user)
    return [_to_budget_read(budget, usage) for budget in budgets]


def create_budget(db: Session, user: User, payload: BudgetCreate) -> BudgetRead:
    category = db.get(Category, str(payload.category_id))
    if category is None or (category.user_id is not None and category.user_id != user.id):
        raise ValueError("Selected category does not exist.")
    if category.type != "expense":
        raise ValueError("Budgets can only be created for expense categories.")

    existing = db.scalar(
        select(Budget).where(
            Budget.category_id == category.id,
            Budget.month == payload.month,
            Budget.year == payload.year,
            Budget.user_id == user.id,
        )
    )
    if existing is not None:
        raise ValueError("A budget already exists for this category and month.")

    budget = Budget(
        user_id=user.id,
        category_id=category.id,
        month=payload.month,
        year=payload.year,
        limit_amount=payload.limit_amount,
        currency_code=payload.currency_code.upper(),
        alert_threshold_percent=payload.alert_threshold_percent,
        is_active=True,
    )
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return _to_budget_read(budget, _build_budget_usage_map(db, user), category)


def update_budget(
    db: Session,
    user: User,
    budget_id: UUID,
    payload: BudgetUpdate,
) -> BudgetRead:
    budget = db.get(Budget, str(budget_id))
    if budget is None or budget.user_id != user.id:
        raise ValueError("Budget not found.")

    category = db.get(Category, str(payload.category_id))
    if category is None or (category.user_id is not None and category.user_id != user.id):
        raise ValueError("Selected category does not exist.")
    if category.type != "expense":
        raise ValueError("Budgets can only be created for expense categories.")

    existing = db.scalar(
        select(Budget).where(
            Budget.user_id == user.id,
            Budget.category_id == category.id,
            Budget.month == payload.month,
            Budget.year == payload.year,
            Budget.id != budget.id,
        )
    )
    if existing is not None:
        raise ValueError("A budget already exists for this category and month.")

    budget.category_id = category.id
    budget.month = payload.month
    budget.year = payload.year
    budget.limit_amount = payload.limit_amount
    budget.currency_code = payload.currency_code.upper()
    budget.alert_threshold_percent = payload.alert_threshold_percent
    budget.is_active = True
    db.add(budget)
    db.commit()
    db.refresh(budget)
    return _to_budget_read(budget, _build_budget_usage_map(db, user), category)


def delete_budget(db: Session, user: User, budget_id: UUID) -> None:
    budget = db.get(Budget, str(budget_id))
    if budget is None or budget.user_id != user.id:
        raise ValueError("Budget not found.")
    db.delete(budget)
    db.commit()


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
    budgets = db.scalars(
        select(Budget).where(Budget.user_id == user.id).options(selectinload(Budget.category))
    ).all()

    usage = _build_budget_usage_map_from_transactions(transactions)
    category_breakdown: list[CategoryReportItem] = []

    current_month = date.today().month
    current_year = date.today().year
    current_budgets = {
        budget.category_id: budget
        for budget in budgets
        if budget.month == current_month and budget.year == current_year and budget.is_active
    }

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
        budget = current_budgets.get(category.id)

        budget_limit = budget.limit_amount if budget is not None else None
        remaining_amount = round((budget_limit or 0.0) - spent_amount, 2) if budget_limit is not None else None
        utilization_percent = (
            round((spent_amount / budget_limit) * 100, 2) if budget_limit and budget_limit > 0 else None
        )

        category_breakdown.append(
            CategoryReportItem(
                category_id=category.id,
                category_name=category.name,
                category_color=category.color,
                spent_amount=spent_amount,
                transaction_count=transaction_count,
                budget_limit=budget_limit,
                remaining_amount=remaining_amount,
                utilization_percent=utilization_percent,
            )
        )

    category_breakdown.sort(key=lambda item: (-item.spent_amount, item.category_name.lower()))
    current_budget_reads = [
        _to_budget_read(budget, usage)
        for budget in budgets
        if budget.month == current_month and budget.year == current_year and budget.is_active
    ]
    budget_reads = [_to_budget_read(budget, usage) for budget in budgets]
    monthly_budget_total = round(
        sum(
            budget.limit_amount
            for budget in budgets
            if budget.month == current_month and budget.year == current_year and budget.is_active
        ),
        2,
    )
    over_budget_count = sum(1 for budget in current_budget_reads if budget.utilization_percent > 100)

    return ReportsOverview(
        summary=get_dashboard_summary(db, user),
        category_breakdown=category_breakdown,
        smart_insights=_build_smart_insights(category_breakdown, current_budget_reads, transactions),
        budgets=budget_reads,
        monthly_budget_total=monthly_budget_total,
        over_budget_count=over_budget_count,
        budgeted_categories=len(
            [budget for budget in budgets if budget.month == current_month and budget.year == current_year]
        ),
    )


def _build_smart_insights(
    category_breakdown: list[CategoryReportItem],
    budgets: list[BudgetRead],
    transactions: list[Transaction],
) -> list[SmartInsight]:
    insights: list[SmartInsight] = []
    total_expense = round(sum(item.spent_amount for item in category_breakdown), 2)

    over_budget = [budget for budget in budgets if budget.utilization_percent > 100]
    if over_budget:
        most_over = max(over_budget, key=lambda budget: budget.utilization_percent)
        insights.append(
            SmartInsight(
                title="Budget pressure",
                message=(
                    f"{most_over.category_name} is at {most_over.utilization_percent:.1f}% of its "
                    f"{most_over.month}/{most_over.year} budget."
                ),
                severity="high",
            )
        )

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
                message="No budget overruns or single-category spikes stand out in the current data.",
                severity="low",
            )
        )

    return insights[:3]


def _build_budget_usage_map(db: Session, user: User) -> dict[tuple[str, int, int], float]:
    transactions = db.scalars(
        select(Transaction).where(Transaction.user_id == user.id, Transaction.type == "expense")
    ).all()
    return _build_budget_usage_map_from_transactions(transactions)


def _build_budget_usage_map_from_transactions(
    transactions: list[Transaction],
) -> dict[tuple[str, int, int], float]:
    usage: dict[tuple[str, int, int], float] = defaultdict(float)
    for transaction in transactions:
        if transaction.type != "expense":
            continue
        usage[(transaction.category_id, transaction.transaction_date.month, transaction.transaction_date.year)] += (
            transaction.amount
        )
    return usage


def _to_budget_read(
    budget: Budget,
    usage: dict[tuple[str, int, int], float],
    category: Category | None = None,
) -> BudgetRead:
    spent_amount = round(usage.get((budget.category_id, budget.month, budget.year), 0.0), 2)
    remaining_amount = round(budget.limit_amount - spent_amount, 2)
    utilization_percent = round((spent_amount / budget.limit_amount) * 100, 2) if budget.limit_amount else 0.0
    resolved_category = category or budget.category
    return BudgetRead(
        id=budget.id,
        category_id=budget.category_id,
        category_name=resolved_category.name if resolved_category else "Unknown",
        month=budget.month,
        year=budget.year,
        limit_amount=budget.limit_amount,
        spent_amount=spent_amount,
        remaining_amount=remaining_amount,
        utilization_percent=utilization_percent,
        currency_code=budget.currency_code,
        alert_threshold_percent=budget.alert_threshold_percent,
        is_active=budget.is_active,
        created_at=budget.created_at,
        updated_at=budget.updated_at,
    )
