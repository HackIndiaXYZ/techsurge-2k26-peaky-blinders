from fastapi import APIRouter

from routes import analysis, dashboard, health, ledger, payments, reports, simulator

api_router = APIRouter(prefix="/api")
api_router.include_router(health.router)
api_router.include_router(analysis.router)
api_router.include_router(payments.router)
api_router.include_router(ledger.router)
api_router.include_router(reports.router)
api_router.include_router(dashboard.router)
api_router.include_router(simulator.router)

__all__ = ["api_router"]
