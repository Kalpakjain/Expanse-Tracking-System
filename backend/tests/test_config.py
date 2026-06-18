import pytest
from pydantic import ValidationError

from app.core.config import Settings


def test_development_allows_local_defaults() -> None:
    settings = Settings()

    assert settings.app_env == "development"
    assert settings.auth_required is False


def test_production_requires_hardened_settings() -> None:
    with pytest.raises(ValidationError):
        Settings(app_env="production")


def test_production_accepts_deployable_settings() -> None:
    settings = Settings(
        app_env="production",
        frontend_origins="https://app.example.com",
        database_url="postgresql://user:password@db.example.com:5432/expense_tracker",
        database_auto_create_tables=False,
        auth_required=True,
        auth_secret_key="a-real-production-secret-that-is-long-enough",
    )

    assert settings.app_env == "production"
    assert settings.auth_required is True
