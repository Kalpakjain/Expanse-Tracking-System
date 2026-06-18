from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.api.deps import get_current_user, get_db
from app.db.models import User
from app.schemas.category import CategoryCreate, CategoryRead
from app.services.finance import create_category, list_categories


router = APIRouter()


@router.get("/", response_model=list[CategoryRead])
def get_categories(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> list[CategoryRead]:
    return list_categories(db, current_user)


@router.post("/", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
def add_category(
    payload: CategoryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> CategoryRead:
    try:
        return create_category(db, current_user, payload)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
