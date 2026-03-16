from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.domain import ApprovalDecisionResponse, ApprovalRead
from app.services.approvals import approve, list_approvals, reject

router = APIRouter()


@router.get("", response_model=list[ApprovalRead])
def list_approvals_route(db: Session = Depends(get_db)):
    return list_approvals(db)


@router.post("/{approval_id}/approve", response_model=ApprovalDecisionResponse)
def approve_route(approval_id: str, db: Session = Depends(get_db)):
    return approve(approval_id, db)


@router.post("/{approval_id}/reject", response_model=ApprovalDecisionResponse)
def reject_route(approval_id: str, db: Session = Depends(get_db)):
    return reject(approval_id, db)
