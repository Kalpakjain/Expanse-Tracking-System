from uuid import UUID

from pydantic import BaseModel

class DashboardSummary(BaseModel):
    total_income: float
    total_expenses: float
    balance: float
    transaction_count: int
    category_count: int


class CategoryReportItem(BaseModel):
    category_id: UUID
    category_name: str
    category_color: str
    spent_amount: float
    transaction_count: int


class SmartInsight(BaseModel):
    title: str
    message: str
    severity: str


class ReportsOverview(BaseModel):
    summary: DashboardSummary
    category_breakdown: list[CategoryReportItem]
    smart_insights: list[SmartInsight]
