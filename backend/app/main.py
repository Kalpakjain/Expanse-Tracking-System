from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.router import api_router
from app.core.config import settings
from app.db.init_db import create_database_and_seed


@asynccontextmanager
async def lifespan(_: FastAPI):
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
    allow_origins=[settings.frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix="/api/v1")


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
