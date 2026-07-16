from contextlib import asynccontextmanager
import json
import logging
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text

from app.api.router import api_router
from app.core.config import settings
from app.db.init_db import create_database_and_seed
from app.db.session import engine

logger = logging.getLogger("smart_expense_tracker.api")


def _configure_logging() -> None:
    level = logging.DEBUG if settings.is_local else logging.INFO
    logging.basicConfig(level=level, format="%(asctime)s %(levelname)s %(name)s %(message)s")


@asynccontextmanager
async def lifespan(_: FastAPI):
    _configure_logging()
    if settings.is_local:
        create_database_and_seed()
    yield


app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    description="Starter API for the Smart Expense Tracker project.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_origin_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(api_router, prefix="/api/v1")


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    start = time.perf_counter()
    status_code = 500
    try:
        response = await call_next(request)
        status_code = response.status_code
        return response
    finally:
        latency_ms = round((time.perf_counter() - start) * 1000, 2)
        payload = {
            "event": "request",
            "method": request.method,
            "path": request.url.path,
            "status_code": status_code,
            "latency_ms": latency_ms,
        }
        if settings.is_local:
            logger.info(
                "%s %s %s %.2fms",
                payload["method"],
                payload["path"],
                payload["status_code"],
                payload["latency_ms"],
            )
        else:
            logger.info(json.dumps(payload, separators=(",", ":")))


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.exception("Unhandled exception for %s %s", request.method, request.url.path, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "internal_server_error", "detail": "An unexpected error occurred."},
    )


@app.get("/", tags=["meta"])
def root() -> dict[str, str]:
    return {
        "message": "Smart Expense Tracker API is running.",
        "docs": "/docs",
        "health": "/health",
    }


@app.get("/health", tags=["meta"])
def healthcheck() -> dict[str, str]:
    return {"status": "ok", "environment": settings.app_env}


@app.get("/ready", tags=["meta"], response_model=None)
def readiness() -> JSONResponse | dict[str, str]:
    try:
        with engine.connect() as connection:
            connection.execute(text("SELECT 1"))
    except Exception:
        logger.exception("Readiness check failed: database unreachable")
        return JSONResponse(
            status_code=503,
            content={"status": "not_ready", "database": "unreachable"},
        )
    return {"status": "ready", "database": "connected"}
