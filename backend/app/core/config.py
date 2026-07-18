from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


DEFAULT_AUTH_SECRET = "change-this-secret-before-deploying"


class Settings(BaseSettings):
    app_name: str = "Smart Expense Tracker API"
    app_env: str = "local"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    frontend_origins: str = "http://localhost:3000,http://127.0.0.1:3000,http://localhost:3001,http://127.0.0.1:3001"
    database_url: str = "postgresql://expense_user:expense_password@localhost:5432/expense_tracker"
    database_auto_create_tables: bool = False
    redis_url: str = "redis://redis:6379/0"
    auth_secret_key: str = DEFAULT_AUTH_SECRET
    auth_token_ttl_minutes: int = 60 * 24 * 7
    auth_required: bool = False
    demo_user_email: str = "demo@fintrack.local"
    demo_user_password: str = "demo12345"
    email_enabled: bool = False
    brevo_smtp_host: str = "smtp-relay.brevo.com"
    brevo_smtp_port: int = 587
    brevo_smtp_user: str = ""
    brevo_smtp_pass: str = ""
    sender_email: str = ""
    sender_name: str = "FinTrack AI"
    otp_ttl_minutes: int = 5
    otp_rate_limit_count: int = 3
    otp_rate_limit_window_minutes: int = 10
    otp_max_attempts: int = 5
    expose_dev_otp: bool = False
    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.5-flash"
    receipt_extraction_enabled: bool = True

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def is_local(self) -> bool:
        return self.app_env.lower() in {"local", "dev", "development"}

    @property
    def frontend_origin_list(self) -> list[str]:
        return [origin.strip() for origin in self.frontend_origins.split(",") if origin.strip()]

    @model_validator(mode="after")
    def validate_production_settings(self) -> "Settings":
        origins = [origin.lower() for origin in self.frontend_origin_list]
        if any("*" in origin for origin in origins):
            raise ValueError("FRONTEND_ORIGINS cannot contain '*' when credentials are enabled.")

        if self.app_env.lower() != "production":
            return self

        if self.auth_secret_key == DEFAULT_AUTH_SECRET or len(self.auth_secret_key) < 32:
            raise ValueError("Production requires AUTH_SECRET_KEY with at least 32 characters.")
        if not self.auth_required:
            raise ValueError("Production requires AUTH_REQUIRED=true.")
        if self.database_auto_create_tables:
            raise ValueError("Production requires DATABASE_AUTO_CREATE_TABLES=false and Alembic migrations.")
        if self.database_url.startswith("sqlite"):
            raise ValueError("Production requires a non-SQLite DATABASE_URL.")

        local_origins = ["localhost", "127.0.0.1", "0.0.0.0"]
        if not origins or any(origin.startswith("http://") for origin in origins):
            raise ValueError("Production FRONTEND_ORIGINS must use HTTPS origins.")
        if any(local_origin in origin for origin in origins for local_origin in local_origins):
            raise ValueError("Production FRONTEND_ORIGINS cannot point to local hosts.")

        return self


settings = Settings()
