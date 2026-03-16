from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import ConnectorRun
from app.schemas.domain import ConnectorRunRead
from app.services import seed_data
from app.services.persistence import database_is_available, utcnow


def _to_connector_run_read(row: ConnectorRun) -> ConnectorRunRead:
    return ConnectorRunRead(
        id=row.id,
        connector_name=row.connector_name,
        started_at=row.started_at,
        ended_at=row.ended_at,
        status=row.status,
        inserted_rows=row.inserted_rows,
        updated_rows=row.updated_rows,
        error_message=row.error_message,
    )


def list_connector_runs(db: Session | None = None):
    if database_is_available(db):
        try:
            rows = db.scalars(select(ConnectorRun).order_by(ConnectorRun.started_at.desc()).limit(20)).all()
            if rows:
                return [_to_connector_run_read(row) for row in rows]
        except Exception:
            db.rollback()
    return seed_data.CONNECTOR_RUNS


def run_connector(connector_name: str, db: Session | None = None) -> ConnectorRunRead:
    fallback = ConnectorRunRead(
        id=f"conn-run-{int(utcnow().timestamp() * 1000)}",
        connector_name=connector_name.upper(),
        started_at=utcnow(),
        ended_at=None,
        status="queued",
        inserted_rows=None,
        updated_rows=None,
        error_message=None,
    )

    if database_is_available(db):
        try:
            row = ConnectorRun(
                id=fallback.id,
                connector_name=connector_name.upper(),
                started_at=fallback.started_at,
                ended_at=None,
                status="queued",
                inserted_rows=None,
                updated_rows=None,
                error_message=None,
            )
            db.add(row)
            db.commit()
            db.refresh(row)
            return _to_connector_run_read(row)
        except Exception:
            db.rollback()
    return fallback
