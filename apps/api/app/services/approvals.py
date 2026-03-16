from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Approval
from app.schemas.domain import ApprovalDecisionResponse, ApprovalRead
from app.services import seed_data
from app.services.persistence import DEFAULT_USER_ID, database_is_available, ensure_default_identity, utcnow


def _to_approval_read(row: Approval) -> ApprovalRead:
    return ApprovalRead(
        id=row.id,
        approval_type=row.approval_type,
        status=row.status,
    )


def list_approvals(db: Session | None = None):
    if database_is_available(db):
        try:
            rows = db.scalars(select(Approval).order_by(Approval.created_at.desc()).limit(20)).all()
            if rows:
                return [_to_approval_read(row) for row in rows]
        except Exception:
            db.rollback()
    return seed_data.APPROVALS


def create_demo_approval(db: Session, *, approval_type: str, target_entity_type: str, target_entity_id: str) -> ApprovalRead:
    ensure_default_identity(db)
    approval_id = f"approval-{int(utcnow().timestamp() * 1000)}"
    row = Approval(
        id=approval_id,
        approval_type=approval_type,
        target_entity_type=target_entity_type,
        target_entity_id=target_entity_id,
        requested_by=DEFAULT_USER_ID,
        approver_id=DEFAULT_USER_ID,
        status="pending",
        request_payload_json=None,
        approved_payload_json=None,
        created_at=utcnow(),
        decided_at=None,
    )
    db.add(row)
    db.flush()
    return _to_approval_read(row)


def approve(approval_id: str, db: Session | None = None) -> ApprovalDecisionResponse:
    if database_is_available(db):
        try:
            row = db.get(Approval, approval_id)
            if row is not None:
                row.status = "approved"
                row.decided_at = utcnow()
                db.commit()
                return ApprovalDecisionResponse(id=approval_id, status=row.status)
        except Exception:
            db.rollback()
    return ApprovalDecisionResponse(id=approval_id, status="approved")


def reject(approval_id: str, db: Session | None = None) -> ApprovalDecisionResponse:
    if database_is_available(db):
        try:
            row = db.get(Approval, approval_id)
            if row is not None:
                row.status = "rejected"
                row.decided_at = utcnow()
                db.commit()
                return ApprovalDecisionResponse(id=approval_id, status=row.status)
        except Exception:
            db.rollback()
    return ApprovalDecisionResponse(id=approval_id, status="rejected")
