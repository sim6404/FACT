from __future__ import annotations

from datetime import datetime, timezone
from time import monotonic

from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.models import InquiryHistory, ProductionInquiry, ProductionItem, Role, User


DEFAULT_ROLE_CODE = "platform_admin"
DEFAULT_USER_ID = "user-001"
DB_AVAILABILITY_TTL_SECONDS = 30.0

_db_available_cache: bool | None = None
_db_available_checked_at: float = 0.0


def utcnow() -> datetime:
    return datetime.now(timezone.utc)


def database_is_available(db: Session | None) -> bool:
    global _db_available_cache, _db_available_checked_at

    if not settings.enable_db_persistence:
        return False

    if db is None:
        return False

    now = monotonic()
    if _db_available_cache is False and (now - _db_available_checked_at) < DB_AVAILABILITY_TTL_SECONDS:
        return False

    try:
        db.execute(text("SELECT 1"))
        _db_available_cache = True
        _db_available_checked_at = now
        return True
    except Exception:
        db.rollback()
        _db_available_cache = False
        _db_available_checked_at = now
        return False


def ensure_default_identity(db: Session) -> None:
    role = db.get(Role, DEFAULT_ROLE_CODE)
    if role is None:
        db.add(
            Role(
                code=DEFAULT_ROLE_CODE,
                name="Platform Admin",
                permissions_json={"permissions": ["*"]},
            )
        )

    user = db.get(User, DEFAULT_USER_ID)
    if user is None:
        db.add(
            User(
                id=DEFAULT_USER_ID,
                email="leader@4dvision.co.kr",
                name="심현보",
                department_code="EXEC",
                role_code=DEFAULT_ROLE_CODE,
                is_active=True,
                last_login_at=utcnow(),
            )
        )

    db.flush()


def seed_production_items(db: Session) -> None:
    """Populate production_items table if empty."""
    from datetime import date

    if db.query(ProductionItem).count() > 0:
        return

    now = utcnow()
    rows = [
        ProductionItem(
            id="prod-item-001",
            item_code="AX01",
            item_name="스트럿 폼패드 좌품",
            spec="90 x 24",
            unit="EA",
            available_qty=100,
            process_name="압축성형",
            warehouse="원자재창고",
            created_at=now,
            updated_at=now,
        ),
        ProductionItem(
            id="prod-item-002",
            item_code="MX5-070",
            item_name="부스가공품",
            spec="70 x 15",
            unit="EA",
            available_qty=240,
            process_name="부스가공",
            warehouse="반제품창고",
            created_at=now,
            updated_at=now,
        ),
        ProductionItem(
            id="prod-item-003",
            item_code="HORN-ASM",
            item_name="HORN 조립반제품",
            spec="ASM-SET",
            unit="EA",
            available_qty=68,
            process_name="조립",
            warehouse="생산대기창고",
            created_at=now,
            updated_at=now,
        ),
        ProductionItem(
            id="prod-item-004",
            item_code="BUSH-760",
            item_name="BUSH 조립품",
            spec="760 TYPE",
            unit="EA",
            available_qty=80,
            process_name="검사완료",
            warehouse="완제품창고",
            created_at=now,
            updated_at=now,
        ),
    ]
    db.add_all(rows)
    db.flush()


def seed_production_inquiries(db: Session) -> None:
    """Populate production_inquiries table if empty."""
    from datetime import date

    if db.query(ProductionInquiry).count() > 0:
        return

    now = utcnow()
    rows = [
        ProductionInquiry(
            id="prod-inq-001",
            inquiry_no="2025/03/26-1",
            production_date=date(2025, 3, 26),
            workorder_no="P45012",
            status="확인",
            item_code="AX01",
            item_name="스트럿 폼패드 좌품",
            spec="90 x 24",
            unit="EA",
            planned_qty=90,
            receipt_qty=58,
            warehouse="원자재창고",
            remark="신상품재고 재사용",
            created_by=DEFAULT_USER_ID,
            created_at=now,
            updated_at=now,
        ),
        ProductionInquiry(
            id="prod-inq-002",
            inquiry_no="2025/03/21-7",
            production_date=date(2025, 3, 21),
            workorder_no="P44987",
            status="진행중",
            item_code="MX5-070",
            item_name="부스가공품",
            spec="70 x 15",
            unit="EA",
            planned_qty=120,
            receipt_qty=64,
            warehouse="반제품창고",
            remark="생산수량 재확인 필요",
            created_by=DEFAULT_USER_ID,
            created_at=now,
            updated_at=now,
        ),
        ProductionInquiry(
            id="prod-inq-003",
            inquiry_no="2025/03/17-4",
            production_date=date(2025, 3, 17),
            workorder_no="P44933",
            status="대기",
            unit="EA",
            planned_qty=100,
            receipt_qty=0,
            remark="생산품 선택 필요",
            created_by=DEFAULT_USER_ID,
            created_at=now,
            updated_at=now,
        ),
        ProductionInquiry(
            id="prod-inq-004",
            inquiry_no="2025/03/06-3",
            production_date=date(2025, 3, 6),
            workorder_no="P44880",
            status="확인",
            item_code="BUSH-760",
            item_name="BUSH 조립품",
            spec="760 TYPE",
            unit="EA",
            planned_qty=80,
            receipt_qty=80,
            warehouse="완제품창고",
            remark="검수 완료",
            created_by=DEFAULT_USER_ID,
            created_at=now,
            updated_at=now,
        ),
    ]
    db.add_all(rows)
    db.flush()
