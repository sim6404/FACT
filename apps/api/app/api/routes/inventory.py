from fastapi import APIRouter, Query

from app.schemas.domain import (
    InventoryLedgerRead,
    InventoryTransactionCreateRequest,
    InventoryTransactionRead,
)
from app.services.inventory import (
    create_transaction,
    get_ledger_item,
    list_ledger,
    list_transactions,
)

router = APIRouter()


@router.get("/ledger", response_model=list[InventoryLedgerRead])
def list_ledger_route(
    warehouse: str | None = Query(None),
    below_safety_only: bool = Query(False),
):
    return list_ledger(warehouse=warehouse, below_safety_only=below_safety_only)


@router.get("/ledger/{item_code}", response_model=InventoryLedgerRead)
def get_ledger_item_route(item_code: str):
    return get_ledger_item(item_code)


@router.get("/transactions", response_model=list[InventoryTransactionRead])
def list_transactions_route(
    item_code: str | None = Query(None),
    tx_type: str | None = Query(None),
    limit: int = Query(50, ge=1, le=200),
):
    return list_transactions(item_code=item_code, tx_type=tx_type, limit=limit)


@router.post("/transactions", response_model=InventoryTransactionRead)
def create_transaction_route(payload: InventoryTransactionCreateRequest):
    return create_transaction(payload, actor_name="심현보")
