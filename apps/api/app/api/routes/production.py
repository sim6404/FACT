from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.domain import (
    InquiryHistoryRead,
    ProductionProcessActionRequest,
    ProductionProcessDetailRead,
    ProductionProcessRead,
    ProductionInquiryRead,
    ProductionInquirySelectionRequest,
    ProductionInquiryUpsertRequest,
    ProductionItemRead,
)
from app.services.production import (
    clone_production_inquiry,
    create_production_inquiry,
    get_inquiry_history,
    get_production_process,
    get_production_process_detail,
    list_production_inquiries,
    list_production_items,
    list_production_processes,
    run_production_process_action,
    select_production_item,
    update_production_inquiry,
)

router = APIRouter()


@router.get("/items", response_model=list[ProductionItemRead])
def list_production_items_route(db: Session = Depends(get_db)):
    return list_production_items(db)


@router.get("/inquiries", response_model=list[ProductionInquiryRead])
def list_production_inquiries_route(db: Session = Depends(get_db)):
    return list_production_inquiries(db)


@router.post("/inquiries", response_model=ProductionInquiryRead)
def create_production_inquiry_route(
    payload: ProductionInquiryUpsertRequest,
    db: Session = Depends(get_db),
):
    return create_production_inquiry(payload, db, actor_name="심현보")


@router.post("/inquiries/{inquiry_id}", response_model=ProductionInquiryRead)
def update_production_inquiry_route(
    inquiry_id: str,
    payload: ProductionInquiryUpsertRequest,
    db: Session = Depends(get_db),
):
    return update_production_inquiry(inquiry_id, payload, db, actor_name="심현보")


@router.post("/inquiries/{inquiry_id}/clone", response_model=ProductionInquiryRead)
def clone_production_inquiry_route(
    inquiry_id: str,
    db: Session = Depends(get_db),
):
    return clone_production_inquiry(inquiry_id, db, actor_name="심현보")


@router.post("/inquiries/{inquiry_id}/select-item", response_model=ProductionInquiryRead)
def select_production_item_route(
    inquiry_id: str,
    payload: ProductionInquirySelectionRequest,
    db: Session = Depends(get_db),
):
    return select_production_item(inquiry_id, payload, db, actor_name="심현보")


@router.get("/inquiries/{inquiry_id}/history", response_model=list[InquiryHistoryRead])
def get_inquiry_history_route(
    inquiry_id: str,
    db: Session = Depends(get_db),
):
    return get_inquiry_history(inquiry_id, db)


@router.get("/processes", response_model=list[ProductionProcessRead])
def list_production_processes_route():
    return list_production_processes()


@router.get("/processes/{process_id}", response_model=ProductionProcessRead)
def get_production_process_route(process_id: str):
    return get_production_process(process_id)


@router.get("/processes/{process_id}/detail", response_model=ProductionProcessDetailRead)
def get_production_process_detail_route(process_id: str):
    return get_production_process_detail(process_id)


@router.post("/processes/{process_id}/action", response_model=ProductionProcessRead)
def run_production_process_action_route(
    process_id: str, payload: ProductionProcessActionRequest
):
    return run_production_process_action(process_id, payload)
