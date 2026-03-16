"""Inventory ledger service – in-memory seed with DB-ready structure."""
from __future__ import annotations

import uuid
from datetime import datetime, timezone

from fastapi import HTTPException

from app.schemas.domain import (
    InventoryLedgerRead,
    InventoryTransactionCreateRequest,
    InventoryTransactionRead,
)
from app.services import seed_data


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)


def list_ledger(
    warehouse: str | None = None,
    below_safety_only: bool = False,
) -> list[InventoryLedgerRead]:
    items = seed_data.INVENTORY_LEDGER
    if warehouse:
        items = [x for x in items if x.warehouse == warehouse]
    if below_safety_only:
        items = [x for x in items if x.is_below_safety]
    return items


def get_ledger_item(item_code: str) -> InventoryLedgerRead:
    item = next((x for x in seed_data.INVENTORY_LEDGER if x.item_code == item_code), None)
    if item is None:
        raise HTTPException(status_code=404, detail=f"Inventory item not found: {item_code}")
    return item


def list_transactions(
    item_code: str | None = None,
    tx_type: str | None = None,
    limit: int = 50,
) -> list[InventoryTransactionRead]:
    items = list(reversed(seed_data.INVENTORY_TRANSACTIONS))
    if item_code:
        items = [x for x in items if x.item_code == item_code]
    if tx_type:
        items = [x for x in items if x.tx_type == tx_type]
    return items[:limit]


def create_transaction(
    payload: InventoryTransactionCreateRequest,
    actor_name: str = "시스템",
) -> InventoryTransactionRead:
    ledger = get_ledger_item(payload.item_code)

    delta = payload.qty if payload.tx_type in ("receipt", "return") else -abs(payload.qty)
    if payload.tx_type == "adjust":
        delta = payload.qty

    new_balance = ledger.stock_qty + delta
    if new_balance < 0:
        raise HTTPException(
            status_code=400,
            detail=f"재고 부족: 현재 {ledger.stock_qty}, 요청 {abs(delta)}",
        )

    ledger.stock_qty = new_balance
    ledger.is_below_safety = new_balance < ledger.safety_stock
    ledger.last_updated = _utcnow()

    tx = InventoryTransactionRead(
        id=str(uuid.uuid4()),
        item_code=payload.item_code,
        item_name=ledger.item_name,
        tx_type=payload.tx_type,
        qty=payload.qty,
        balance_after=new_balance,
        warehouse=payload.warehouse or ledger.warehouse,
        reference_no=payload.reference_no,
        actor_name=actor_name,
        tx_at=_utcnow(),
        note=payload.note,
    )
    seed_data.INVENTORY_TRANSACTIONS.append(tx)
    return tx
