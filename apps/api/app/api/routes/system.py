from fastapi import APIRouter

from app.schemas.domain import SystemHealthRead
from app.services.system import get_system_health as get_system_health_service

router = APIRouter()


@router.get("/system/health", response_model=SystemHealthRead)
def get_system_health():
    return get_system_health_service()
