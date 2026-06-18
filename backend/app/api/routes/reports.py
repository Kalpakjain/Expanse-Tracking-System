from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.db.models import User
from app.schemas.report import DashboardSummary, ReportsOverview
from app.services.finance import get_dashboard_summary
from app.services.planning import get_reports_overview


router = APIRouter()


@router.get("/summary", response_model=DashboardSummary)
def get_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> DashboardSummary:
    return get_dashboard_summary(db, current_user)


@router.get("/overview", response_model=ReportsOverview)
def get_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> ReportsOverview:
    return get_reports_overview(db, current_user)
