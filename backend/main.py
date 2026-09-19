"""PausePay backend — FastAPI application entry point.

Run locally:
    uvicorn main:app --reload --port 8000
"""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config import settings
from database import SessionLocal, init_db
from routes import api_router
from services.fraud_lookup import seed_known_fraud
from services.intent_detector import detector

logger = logging.getLogger("pausepay")
logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    try:
        detector.load()
        logger.info("intent model loaded (%s)", detector.version)
    except FileNotFoundError as exc:
        # The API still boots so /api/health can report the problem clearly.
        logger.error("%s", exc)
    if settings.seed_demo_data:
        with SessionLocal() as db:
            added = seed_known_fraud(db, settings.fraud_list_path)
            if added:
                logger.info("seeded %d confirmed-fraud identifiers", added)
            from services.ledger_service import seed_synthetic_ledger
            ledger_count = seed_synthetic_ledger(db)
            if ledger_count:
                logger.info("seeded %d synthetic ledger entries", ledger_count)
    yield


app = FastAPI(
    title="PausePay API",
    version="1.0.0",
    description="Pre-payment verification layer: message analysis, identifier risk store and payee verification.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    # Any localhost port is accepted so `next dev` can fall back to 3001+ without config changes.
    allow_origin_regex=r"https?://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)


@app.exception_handler(Exception)
async def unhandled_exception_handler(_request: Request, exc: Exception) -> JSONResponse:  # pragma: no cover - defensive
    logger.exception("unhandled error: %s", exc)
    return JSONResponse(status_code=500, content={"detail": "PausePay verification temporarily unavailable."})


@app.get("/", include_in_schema=False)
def root() -> dict:
    return {"service": "PausePay API", "docs": "/docs", "health": "/api/health"}
