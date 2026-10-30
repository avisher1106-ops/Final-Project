"""
Echo API entry point.

Run locally with:
    uvicorn main:app --reload
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy.exc import SQLAlchemyError

from database import create_tables, engine
from routers.conversations import router as conversations_router

# INFO-level logs make demos and debugging straightforward without exposing
# request bodies or credentials.
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Prepare and clean up application-wide resources."""
    logger.info("Starting Echo API...")
    try:
        # Convenience for development: create tables if they do not exist.
        create_tables()
    except Exception:
        logger.exception("Database initialization failed.")
        raise
    yield
    engine.dispose()
    logger.info("Echo API stopped.")


app = FastAPI(
    title="Echo API",
    description=(
        "Backend for Echo, a ChatGPT-style chat application. "
        "The React client communicates only with these REST endpoints."
    ),
    version="1.0.0",
    lifespan=lifespan,
)

# React development servers allowed to call this API. Credentials are not
# required by the API, but enabling them keeps the CORS setup flexible.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:4173",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:4173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(conversations_router)


@app.exception_handler(SQLAlchemyError)
async def database_exception_handler(
    request: Request, exc: SQLAlchemyError
) -> JSONResponse:
    """Return a friendly JSON error for unexpected database failures."""
    logger.error(
        "Unhandled database error on %s %s.",
        request.method,
        request.url.path,
        exc_info=(type(exc), exc, exc.__traceback__),
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "A database error occurred. Please try again."},
    )


@app.exception_handler(Exception)
async def unexpected_exception_handler(
    request: Request, exc: Exception
) -> JSONResponse:
    """Prevent stack traces and internal details from reaching the client."""
    logger.error(
        "Unhandled error on %s %s.",
        request.method,
        request.url.path,
        exc_info=(type(exc), exc, exc.__traceback__),
    )
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An unexpected error occurred. Please try again."},
    )


@app.get("/", tags=["Health"], summary="API information")
def root() -> dict[str, str]:
    """Small check that the server is running."""
    return {
        "name": "Echo API",
        "status": "ok",
        "docs": "/docs",
    }
