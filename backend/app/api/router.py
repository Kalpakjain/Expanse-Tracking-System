from fastapi import APIRouter

from app.api.routes import accounts, auth, budgets, categories, notifications, receipts, reports, transactions


api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(accounts.router, prefix="/accounts", tags=["accounts"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(transactions.router, prefix="/transactions", tags=["transactions"])
api_router.include_router(budgets.router, prefix="/budgets", tags=["budgets"])
api_router.include_router(notifications.router, prefix="/settings/notifications", tags=["notifications"])
api_router.include_router(receipts.router, prefix="/receipts", tags=["receipts"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
