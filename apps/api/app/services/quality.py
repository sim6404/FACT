"""Quality NCR service – in-memory seed with DB-ready structure."""
from __future__ import annotations

import uuid
from datetime import date

from fastapi import HTTPException

from app.schemas.domain import (
    QualityNCRRead,
    QualityNCRStatusUpdate,
    QualityNCRUpsertRequest,
)
from app.services import seed_data


def list_ncrs(
    status: str | None = None,
    severity: str | None = None,
    department_code: str | None = None,
) -> list[QualityNCRRead]:
    items = seed_data.QUALITY_NCRS
    if status:
        items = [x for x in items if x.status == status]
    if severity:
        items = [x for x in items if x.severity == severity]
    if department_code:
        items = [x for x in items if x.department_code == department_code]
    return items


def get_ncr(ncr_id: str) -> QualityNCRRead:
    item = next((x for x in seed_data.QUALITY_NCRS if x.id == ncr_id), None)
    if item is None:
        raise HTTPException(status_code=404, detail="NCR not found")
    return item


def create_ncr(payload: QualityNCRUpsertRequest) -> QualityNCRRead:
    defect_rate = round(payload.defect_qty / payload.total_qty * 100, 2) if payload.total_qty else 0.0
    ncr = QualityNCRRead(
        id=str(uuid.uuid4()),
        ncr_no=payload.ncr_no,
        detected_at=payload.detected_at,
        department_code=payload.department_code,
        item_code=payload.item_code,
        item_name=payload.item_name,
        defect_type=payload.defect_type,
        defect_qty=payload.defect_qty,
        total_qty=payload.total_qty,
        defect_rate=defect_rate,
        status=payload.status,
        severity=payload.severity,
        detected_by=payload.detected_by,
        root_cause=payload.root_cause,
        action_taken=payload.action_taken,
        resolved_at=payload.resolved_at,
        customer_name=payload.customer_name,
        remark=payload.remark,
    )
    seed_data.QUALITY_NCRS.insert(0, ncr)
    return ncr


def update_ncr(ncr_id: str, payload: QualityNCRUpsertRequest) -> QualityNCRRead:
    ncr = get_ncr(ncr_id)
    defect_rate = round(payload.defect_qty / payload.total_qty * 100, 2) if payload.total_qty else 0.0
    ncr.ncr_no = payload.ncr_no
    ncr.detected_at = payload.detected_at
    ncr.department_code = payload.department_code
    ncr.item_code = payload.item_code
    ncr.item_name = payload.item_name
    ncr.defect_type = payload.defect_type
    ncr.defect_qty = payload.defect_qty
    ncr.total_qty = payload.total_qty
    ncr.defect_rate = defect_rate
    ncr.status = payload.status
    ncr.severity = payload.severity
    ncr.detected_by = payload.detected_by
    ncr.root_cause = payload.root_cause
    ncr.action_taken = payload.action_taken
    ncr.resolved_at = payload.resolved_at
    ncr.customer_name = payload.customer_name
    ncr.remark = payload.remark
    return ncr


def update_ncr_status(ncr_id: str, payload: QualityNCRStatusUpdate) -> QualityNCRRead:
    valid = {"open", "investigating", "resolved", "closed"}
    if payload.status not in valid:
        raise HTTPException(status_code=400, detail=f"Invalid NCR status: {payload.status}")
    ncr = get_ncr(ncr_id)
    ncr.status = payload.status
    if payload.root_cause is not None:
        ncr.root_cause = payload.root_cause
    if payload.action_taken is not None:
        ncr.action_taken = payload.action_taken
    if payload.status == "resolved" and ncr.resolved_at is None:
        from datetime import datetime, timezone
        ncr.resolved_at = datetime.now(timezone.utc).date()
    return ncr
