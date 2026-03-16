from fastapi import APIRouter

from app.api.routes import (
    agent,
    approvals,
    connectors,
    dashboard,
    documents,
    inventory,
    production,
    quality,
    reports,
    saved_queries,
    system,
    users,
)

api_router = APIRouter()
api_router.include_router(system.router, tags=["system"])
api_router.include_router(users.router, tags=["users"])
api_router.include_router(agent.router, prefix="/agent", tags=["agent"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(approvals.router, prefix="/approvals", tags=["approvals"])
api_router.include_router(documents.router, prefix="/documents", tags=["documents"])
api_router.include_router(production.router, prefix="/production", tags=["production"])
api_router.include_router(quality.router, prefix="/quality", tags=["quality"])
api_router.include_router(inventory.router, prefix="/inventory", tags=["inventory"])
api_router.include_router(saved_queries.router, prefix="/saved-queries", tags=["saved-queries"])
api_router.include_router(connectors.router, prefix="/connectors", tags=["connectors"])
