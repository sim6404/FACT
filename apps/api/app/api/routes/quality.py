from fastapi import APIRouter, Query

from app.schemas.domain import (
    QualityNCRRead,
    QualityNCRStatusUpdate,
    QualityNCRUpsertRequest,
)
from app.services.quality import (
    create_ncr,
    get_ncr,
    list_ncrs,
    update_ncr,
    update_ncr_status,
)

router = APIRouter()


@router.get("/ncrs", response_model=list[QualityNCRRead])
def list_ncrs_route(
    status: str | None = Query(None),
    severity: str | None = Query(None),
    department_code: str | None = Query(None),
):
    return list_ncrs(status=status, severity=severity, department_code=department_code)


@router.get("/ncrs/{ncr_id}", response_model=QualityNCRRead)
def get_ncr_route(ncr_id: str):
    return get_ncr(ncr_id)


@router.post("/ncrs", response_model=QualityNCRRead)
def create_ncr_route(payload: QualityNCRUpsertRequest):
    return create_ncr(payload)


@router.post("/ncrs/{ncr_id}", response_model=QualityNCRRead)
def update_ncr_route(ncr_id: str, payload: QualityNCRUpsertRequest):
    return update_ncr(ncr_id, payload)


@router.post("/ncrs/{ncr_id}/status", response_model=QualityNCRRead)
def update_ncr_status_route(ncr_id: str, payload: QualityNCRStatusUpdate):
    return update_ncr_status(ncr_id, payload)
