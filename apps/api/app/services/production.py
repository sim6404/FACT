"""Production inquiry service – DB-first with in-memory seed fallback."""
from __future__ import annotations

import uuid
from datetime import date, datetime, timezone

from fastapi import HTTPException
from sqlalchemy.orm import Session

from app.db.models import InquiryHistory, ProductionInquiry as DBInquiry, ProductionItem as DBItem
from app.schemas.domain import (
    InquiryHistoryRead,
    InventorySyncRead,
    ProductionApprovalLogRead,
    ProductionProcessActionRequest,
    ProductionProcessDetailRead,
    ProductionProcessEventRead,
    ProductionProcessRead,
    ProductionInquiryRead,
    ProductionInquirySelectionRequest,
    ProductionInquiryUpsertRequest,
    ProductionItemRead,
)
from app.services import seed_data
from app.services.persistence import (
    database_is_available,
    seed_production_inquiries,
    seed_production_items,
    utcnow,
)


def _item_row_to_schema(row: DBItem) -> ProductionItemRead:
    return ProductionItemRead(
        id=row.id,
        item_code=row.item_code,
        item_name=row.item_name,
        spec=row.spec,
        unit=row.unit,
        available_qty=row.available_qty,
        process_name=row.process_name,
        warehouse=row.warehouse,
    )


def _inquiry_row_to_schema(row: DBInquiry) -> ProductionInquiryRead:
    return ProductionInquiryRead(
        id=row.id,
        inquiry_no=row.inquiry_no,
        production_date=row.production_date,
        workorder_no=row.workorder_no,
        status=row.status,
        item_code=row.item_code,
        item_name=row.item_name,
        spec=row.spec,
        unit=row.unit,
        planned_qty=row.planned_qty,
        receipt_qty=row.receipt_qty,
        warehouse=row.warehouse,
        remark=row.remark,
    )


def _history_row_to_schema(row: InquiryHistory) -> InquiryHistoryRead:
    return InquiryHistoryRead(
        id=row.id,
        inquiry_id=row.inquiry_id,
        action=row.action,
        actor_name=row.actor_name,
        changed_at=row.changed_at,
        before_status=row.before_status,
        after_status=row.after_status,
        before_receipt_qty=row.before_receipt_qty,
        after_receipt_qty=row.after_receipt_qty,
        note=row.note,
    )


def _add_history(
    db: Session,
    row: DBInquiry,
    action: str,
    actor_name: str,
    before_status: str | None,
    after_status: str | None,
    before_receipt_qty: int | None,
    after_receipt_qty: int | None,
    note: str | None = None,
) -> None:
    db.add(
        InquiryHistory(
            id=str(uuid.uuid4()),
            inquiry_id=row.id,
            action=action,
            actor_name=actor_name,
            changed_at=utcnow(),
            before_status=before_status,
            after_status=after_status,
            before_receipt_qty=before_receipt_qty,
            after_receipt_qty=after_receipt_qty,
            note=note,
        )
    )


# ────────────────────────────────────────────────
# Items
# ────────────────────────────────────────────────

def list_production_items(db: Session | None = None) -> list[ProductionItemRead]:
    if database_is_available(db):
        assert db is not None
        seed_production_items(db)
        db.commit()
        return [_item_row_to_schema(row) for row in db.query(DBItem).order_by(DBItem.item_code).all()]
    return seed_data.PRODUCTION_ITEMS


# ────────────────────────────────────────────────
# Inquiries – list / get
# ────────────────────────────────────────────────

def list_production_inquiries(db: Session | None = None) -> list[ProductionInquiryRead]:
    if database_is_available(db):
        assert db is not None
        seed_production_inquiries(db)
        db.commit()
        rows = (
            db.query(DBInquiry)
            .order_by(DBInquiry.production_date.desc(), DBInquiry.created_at.desc())
            .all()
        )
        return [_inquiry_row_to_schema(row) for row in rows]
    return seed_data.PRODUCTION_INQUIRIES


def get_production_inquiry_db(db: Session, inquiry_id: str) -> DBInquiry:
    row = db.get(DBInquiry, inquiry_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Production inquiry not found")
    return row


def _get_inquiry_seed(inquiry_id: str) -> ProductionInquiryRead:
    item = next((x for x in seed_data.PRODUCTION_INQUIRIES if x.id == inquiry_id), None)
    if item is None:
        raise HTTPException(status_code=404, detail="Production inquiry not found")
    return item


# ────────────────────────────────────────────────
# Inquiries – create / update / clone
# ────────────────────────────────────────────────

def create_production_inquiry(
    payload: ProductionInquiryUpsertRequest,
    db: Session | None = None,
    actor_name: str = "시스템",
) -> ProductionInquiryRead:
    if database_is_available(db):
        assert db is not None
        seed_production_items(db)

        linked_item = (
            db.query(DBItem).filter(DBItem.item_code == payload.item_code).first()
            if payload.item_code
            else None
        )
        now = utcnow()
        row = DBInquiry(
            id=str(uuid.uuid4()),
            inquiry_no=payload.inquiry_no,
            production_date=payload.production_date,
            workorder_no=payload.workorder_no,
            status=payload.status,
            item_id=linked_item.id if linked_item else None,
            item_code=linked_item.item_code if linked_item else payload.item_code,
            item_name=payload.item_name or (linked_item.item_name if linked_item else None),
            spec=payload.spec or (linked_item.spec if linked_item else None),
            unit=payload.unit,
            planned_qty=payload.planned_qty,
            receipt_qty=payload.receipt_qty,
            warehouse=payload.warehouse or (linked_item.warehouse if linked_item else None),
            remark=payload.remark,
            created_by="user-001",
            created_at=now,
            updated_at=now,
        )
        db.add(row)
        _add_history(
            db, row, "create", actor_name,
            None, payload.status,
            None, payload.receipt_qty,
            f"신규 입고 오더 등록: {payload.inquiry_no}",
        )
        db.commit()
        db.refresh(row)
        return _inquiry_row_to_schema(row)

    # ── seed fallback ──
    item_code, item_name, spec, warehouse = _resolve_item_snapshot_seed(payload)
    next_index = len(seed_data.PRODUCTION_INQUIRIES) + 1
    inquiry = ProductionInquiryRead(
        id=f"prod-inq-{next_index:03d}",
        inquiry_no=payload.inquiry_no,
        production_date=payload.production_date,
        workorder_no=payload.workorder_no,
        status=payload.status,
        item_code=item_code,
        item_name=item_name,
        spec=spec,
        unit=payload.unit,
        planned_qty=payload.planned_qty,
        receipt_qty=payload.receipt_qty,
        warehouse=warehouse,
        remark=payload.remark,
    )
    seed_data.PRODUCTION_INQUIRIES.insert(0, inquiry)
    _add_seed_history(
        inquiry.id, "create", actor_name,
        None, payload.status,
        None, payload.receipt_qty,
        f"신규 입고 오더 등록: {payload.inquiry_no}",
    )
    return inquiry


def update_production_inquiry(
    inquiry_id: str,
    payload: ProductionInquiryUpsertRequest,
    db: Session | None = None,
    actor_name: str = "시스템",
) -> ProductionInquiryRead:
    if database_is_available(db):
        assert db is not None
        row = get_production_inquiry_db(db, inquiry_id)
        linked_item = (
            db.query(DBItem).filter(DBItem.item_code == payload.item_code).first()
            if payload.item_code
            else None
        )

        before_status = row.status
        before_receipt_qty = row.receipt_qty

        row.inquiry_no = payload.inquiry_no
        row.production_date = payload.production_date
        row.workorder_no = payload.workorder_no
        row.status = payload.status
        row.item_id = linked_item.id if linked_item else None
        row.item_code = linked_item.item_code if linked_item else payload.item_code
        row.item_name = payload.item_name or (linked_item.item_name if linked_item else None)
        row.spec = payload.spec or (linked_item.spec if linked_item else None)
        row.unit = payload.unit
        row.planned_qty = payload.planned_qty
        row.receipt_qty = payload.receipt_qty
        row.warehouse = payload.warehouse or (linked_item.warehouse if linked_item else None)
        row.remark = payload.remark
        row.updated_at = utcnow()

        _add_history(
            db, row, "update", actor_name,
            before_status, payload.status,
            before_receipt_qty, payload.receipt_qty,
            f"입고 오더 수정: {payload.inquiry_no}",
        )
        db.commit()
        db.refresh(row)
        return _inquiry_row_to_schema(row)

    # ── seed fallback ──
    inquiry = _get_inquiry_seed(inquiry_id)
    before_status = inquiry.status
    before_receipt_qty = inquiry.receipt_qty
    item_code, item_name, spec, warehouse = _resolve_item_snapshot_seed(payload)
    inquiry.inquiry_no = payload.inquiry_no
    inquiry.production_date = payload.production_date
    inquiry.workorder_no = payload.workorder_no
    inquiry.status = payload.status
    inquiry.item_code = item_code
    inquiry.item_name = item_name
    inquiry.spec = spec
    inquiry.unit = payload.unit
    inquiry.planned_qty = payload.planned_qty
    inquiry.receipt_qty = payload.receipt_qty
    inquiry.warehouse = warehouse
    inquiry.remark = payload.remark
    _add_seed_history(
        inquiry.id, "update", actor_name,
        before_status, payload.status,
        before_receipt_qty, payload.receipt_qty,
        f"입고 오더 수정: {payload.inquiry_no}",
    )
    return inquiry


def clone_production_inquiry(
    inquiry_id: str,
    db: Session | None = None,
    actor_name: str = "시스템",
) -> ProductionInquiryRead:
    if database_is_available(db):
        assert db is not None
        source = get_production_inquiry_db(db, inquiry_id)
        now = utcnow()
        cloned = DBInquiry(
            id=str(uuid.uuid4()),
            inquiry_no=f"{source.inquiry_no}-COPY",
            production_date=source.production_date,
            workorder_no=f"{source.workorder_no}-COPY",
            status="대기",
            item_id=source.item_id,
            item_code=source.item_code,
            item_name=source.item_name,
            spec=source.spec,
            unit=source.unit,
            planned_qty=source.planned_qty,
            receipt_qty=0,
            warehouse=source.warehouse,
            remark="기존 생산입고 건 복제 생성",
            created_by="user-001",
            created_at=now,
            updated_at=now,
        )
        db.add(cloned)
        _add_history(
            db, cloned, "clone", actor_name,
            None, "대기",
            None, 0,
            f"원본 {inquiry_id} 기반 복제",
        )
        db.commit()
        db.refresh(cloned)
        return _inquiry_row_to_schema(cloned)

    # ── seed fallback ──
    source = _get_inquiry_seed(inquiry_id)
    next_index = len(seed_data.PRODUCTION_INQUIRIES) + 1
    cloned = ProductionInquiryRead(
        id=f"prod-inq-{next_index:03d}",
        inquiry_no=f"{source.inquiry_no}-COPY",
        production_date=source.production_date,
        workorder_no=f"{source.workorder_no}-COPY",
        status="대기",
        item_code=source.item_code,
        item_name=source.item_name,
        spec=source.spec,
        unit=source.unit,
        planned_qty=source.planned_qty,
        receipt_qty=0,
        warehouse=source.warehouse,
        remark="기존 생산입고 건 복제 생성",
    )
    seed_data.PRODUCTION_INQUIRIES.insert(0, cloned)
    _add_seed_history(
        cloned.id, "clone", actor_name,
        None, "대기",
        None, 0,
        f"원본 {inquiry_id} 기반 복제",
    )
    return cloned


# ────────────────────────────────────────────────
# History
# ────────────────────────────────────────────────

def get_inquiry_history(
    inquiry_id: str,
    db: Session | None = None,
) -> list[InquiryHistoryRead]:
    if database_is_available(db):
        assert db is not None
        rows = (
            db.query(InquiryHistory)
            .filter(InquiryHistory.inquiry_id == inquiry_id)
            .order_by(InquiryHistory.changed_at.desc())
            .all()
        )
        return [_history_row_to_schema(row) for row in rows]
    return list(reversed(seed_data.INQUIRY_HISTORY.get(inquiry_id, [])))


# ────────────────────────────────────────────────
# Item selection on inquiry
# ────────────────────────────────────────────────

def select_production_item(
    inquiry_id: str,
    payload: ProductionInquirySelectionRequest,
    db: Session | None = None,
    actor_name: str = "시스템",
) -> ProductionInquiryRead:
    if database_is_available(db):
        assert db is not None
        row = get_production_inquiry_db(db, inquiry_id)
        item_row = db.get(DBItem, payload.item_id)
        if item_row is None:
            raise HTTPException(status_code=404, detail="Production item not found")

        before_status = row.status
        before_receipt_qty = row.receipt_qty

        row.item_id = item_row.id
        row.item_code = item_row.item_code
        row.item_name = item_row.item_name
        row.spec = item_row.spec
        row.warehouse = item_row.warehouse
        row.receipt_qty = payload.receipt_qty or row.planned_qty
        row.status = "확인"
        row.remark = f"{item_row.process_name or '공정'} 기준 품목 선택 적용"
        row.updated_at = utcnow()

        _add_history(
            db, row, "item_select", actor_name,
            before_status, "확인",
            before_receipt_qty, row.receipt_qty,
            f"품목 선택: {item_row.item_code} {item_row.item_name}",
        )
        db.commit()
        db.refresh(row)
        return _inquiry_row_to_schema(row)

    # ── seed fallback ──
    inquiry = _get_inquiry_seed(inquiry_id)
    selected_item = next(
        (x for x in seed_data.PRODUCTION_ITEMS if x.id == payload.item_id), None
    )
    if selected_item is None:
        raise HTTPException(status_code=404, detail="Production item not found")

    before_status = inquiry.status
    before_receipt_qty = inquiry.receipt_qty
    inquiry.item_code = selected_item.item_code
    inquiry.item_name = selected_item.item_name
    inquiry.spec = selected_item.spec
    inquiry.warehouse = selected_item.warehouse
    inquiry.receipt_qty = payload.receipt_qty or inquiry.planned_qty
    inquiry.status = "확인"
    inquiry.remark = f"{selected_item.process_name or '공정'} 기준 품목 선택 적용"
    _add_seed_history(
        inquiry.id, "item_select", actor_name,
        before_status, "확인",
        before_receipt_qty, inquiry.receipt_qty,
        f"품목 선택: {selected_item.item_code} {selected_item.item_name}",
    )
    return inquiry


# ────────────────────────────────────────────────
# Process flow (in-memory only – extends seed_data)
# ────────────────────────────────────────────────

def list_production_processes() -> list[ProductionProcessRead]:
    return seed_data.PRODUCTION_PROCESSES


def get_production_process(process_id: str) -> ProductionProcessRead:
    process = next(
        (x for x in seed_data.PRODUCTION_PROCESSES if x.id == process_id), None
    )
    if process is None:
        raise HTTPException(status_code=404, detail="Production process not found")
    return process


def get_production_process_detail(process_id: str) -> ProductionProcessDetailRead:
    process = get_production_process(process_id)
    return ProductionProcessDetailRead(
        process=process,
        timeline=list(seed_data.PRODUCTION_PROCESS_EVENTS.get(process_id, [])),
        approvals=list(seed_data.PRODUCTION_APPROVALS.get(process_id, [])),
        inventory_sync=seed_data.INVENTORY_SYNC.get(process_id),
    )


def _append_process_event(
    process_id: str,
    step_code: str,
    step_label: str,
    status: str,
    actor_name: str,
    detail: str,
) -> None:
    events = seed_data.PRODUCTION_PROCESS_EVENTS.setdefault(process_id, [])
    events.append(
        ProductionProcessEventRead(
            id=f"event-{len(events) + 1:03d}",
            process_id=process_id,
            step_code=step_code,
            step_label=step_label,
            status=status,
            actor_name=actor_name,
            happened_at=seed_data.NOW,
            detail=detail,
        )
    )


def _upsert_approval(
    process_id: str,
    stage: str,
    approver_name: str,
    status: str,
    comment: str,
) -> None:
    approvals = seed_data.PRODUCTION_APPROVALS.setdefault(process_id, [])
    matched = next((x for x in approvals if x.stage == stage), None)
    if matched is None:
        approvals.append(
            ProductionApprovalLogRead(
                id=f"approval-log-{len(approvals) + 1:03d}",
                process_id=process_id,
                stage=stage,
                approver_name=approver_name,
                status=status,
                decided_at=seed_data.NOW if status != "pending" else None,
                comment=comment,
            )
        )
        return
    matched.status = status
    matched.decided_at = seed_data.NOW if status != "pending" else None
    matched.comment = comment


def _sync_inventory_on_receipt(process: ProductionProcessRead) -> None:
    sync = seed_data.INVENTORY_SYNC.get(process.id)
    if sync is None:
        sync = InventorySyncRead(
            process_id=process.id,
            warehouse="완제품창고",
            item_code=process.item_code,
            before_qty=process.available_qty,
            receipt_qty=0,
            after_qty=process.available_qty,
            sync_status="pending",
            last_synced_at=None,
        )
        seed_data.INVENTORY_SYNC[process.id] = sync

    sync.before_qty = process.available_qty
    sync.receipt_qty = process.ready_qty
    sync.after_qty = process.available_qty + process.ready_qty
    sync.sync_status = "synced"
    sync.last_synced_at = seed_data.NOW

    process.available_qty = sync.after_qty

    matched_item = next(
        (x for x in seed_data.PRODUCTION_ITEMS if x.item_code == process.item_code), None
    )
    if matched_item is not None:
        matched_item.available_qty = sync.after_qty
        matched_item.warehouse = sync.warehouse

    matched_inquiry = next(
        (x for x in seed_data.PRODUCTION_INQUIRIES if x.item_code == process.item_code), None
    )
    if matched_inquiry is not None:
        matched_inquiry.receipt_qty = process.ready_qty
        matched_inquiry.status = "입고완료"
        matched_inquiry.warehouse = sync.warehouse
        matched_inquiry.remark = "ERP 프로세스 입고 확정 결과가 자동 반영되었습니다."


def run_production_process_action(
    process_id: str,
    payload: ProductionProcessActionRequest,
) -> ProductionProcessRead:
    process = get_production_process(process_id)
    action = payload.action

    if action == "reserve_inventory":
        process.inventory_status = "allocated"
        process.next_action = "품질검사 진행"
        process.issue_summary = "재고 할당이 완료되어 품질검사 단계로 이동합니다."
        _append_process_event(process.id, "inventory", "재고 할당 완료", "completed", "김구매",
                              "안전재고 기준 할당이 완료되어 품질검사 단계로 전달되었습니다.")
        _upsert_approval(process.id, "자재 할당", "김구매", "approved", "부족 자재 긴급조달 및 할당 완료")
        sync = seed_data.INVENTORY_SYNC.get(process.id)
        if sync is not None:
            sync.sync_status = "ready"
            sync.last_synced_at = seed_data.NOW

    elif action == "start_quality_check":
        process.quality_status = "in_progress"
        process.next_action = "검사 결과 승인 대기"
        process.issue_summary = "품질 검사원이 공정검사 및 샘플 확인을 진행 중입니다."
        _append_process_event(process.id, "quality", "품질 검사 시작", "in_progress", "연규열",
                              "공정 품질 검사와 샘플링 확인이 시작되었습니다.")
        _upsert_approval(process.id, "품질 승인", "연규열", "pending", "품질 샘플 검사 진행 중")

    elif action == "approve_quality":
        process.quality_status = "passed"
        process.next_action = "입고 확정"
        process.issue_summary = "품질 승인 완료로 입고 확정만 남았습니다."
        _append_process_event(process.id, "quality", "품질 승인 완료", "completed", "연규열",
                              "품질 기준 적합 판정으로 ERP 입고 확정 단계로 전환되었습니다.")
        _upsert_approval(process.id, "품질 승인", "연규열", "approved", "최종 검사 합격")

    elif action == "confirm_receipt":
        process.production_status = "completed"
        process.quality_status = "passed"
        process.inventory_status = "received"
        process.next_action = "ERP 입고 완료"
        process.issue_summary = "생산/품질/재고 프로세스가 모두 완료되었습니다."
        _append_process_event(process.id, "receipt", "입고 확정 완료", "completed", "창고담당",
                              "ERP 재고 반영과 입고전표 생성까지 완료되었습니다.")
        _upsert_approval(process.id, "입고 확정", "창고담당", "approved",
                         "ERP 입고전표 생성 및 재고 반영 완료")
        _sync_inventory_on_receipt(process)
    else:
        raise HTTPException(status_code=400, detail="Invalid production process action")

    return process


# ────────────────────────────────────────────────
# Seed-only helpers
# ────────────────────────────────────────────────

def _add_seed_history(
    inquiry_id: str,
    action: str,
    actor_name: str,
    before_status: str | None,
    after_status: str | None,
    before_receipt_qty: int | None,
    after_receipt_qty: int | None,
    note: str | None = None,
) -> None:
    import uuid as _uuid

    bucket = seed_data.INQUIRY_HISTORY.setdefault(inquiry_id, [])
    bucket.append(
        InquiryHistoryRead(
            id=str(_uuid.uuid4()),
            inquiry_id=inquiry_id,
            action=action,
            actor_name=actor_name,
            changed_at=utcnow(),
            before_status=before_status,
            after_status=after_status,
            before_receipt_qty=before_receipt_qty,
            after_receipt_qty=after_receipt_qty,
            note=note,
        )
    )


def _resolve_item_snapshot_seed(
    payload: ProductionInquiryUpsertRequest,
) -> tuple[str | None, str | None, str | None, str | None]:
    selected_item = next(
        (x for x in seed_data.PRODUCTION_ITEMS if x.item_code == payload.item_code), None
    )
    if selected_item is None:
        return payload.item_code, payload.item_name, payload.spec, payload.warehouse
    return (
        selected_item.item_code,
        payload.item_name or selected_item.item_name,
        payload.spec or selected_item.spec,
        payload.warehouse or selected_item.warehouse,
    )
