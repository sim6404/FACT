from __future__ import annotations

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import SavedQuery
from app.schemas.domain import SavedQueryCreateRequest, SavedQueryRead
from app.services import seed_data
from app.services.persistence import DEFAULT_USER_ID, database_is_available, ensure_default_identity, utcnow


def _to_saved_query_read(row: SavedQuery) -> SavedQueryRead:
    return SavedQueryRead(
        id=row.id,
        user_id=row.user_id,
        title=row.title,
        query_text=row.query_text,
        department_scope=row.department_scope,
        created_at=row.created_at,
    )


def list_saved_queries(db: Session | None = None):
    if database_is_available(db):
        try:
            rows = db.scalars(
                select(SavedQuery).where(SavedQuery.user_id == DEFAULT_USER_ID).order_by(SavedQuery.created_at.desc())
            ).all()
            if rows:
                return [_to_saved_query_read(row) for row in rows]
        except Exception:
            db.rollback()
    return seed_data.SAVED_QUERIES


def create_saved_query(payload: SavedQueryCreateRequest, db: Session | None = None) -> SavedQueryRead:
    fallback = SavedQueryRead(
        id=f"saved-{int(utcnow().timestamp() * 1000)}",
        user_id=DEFAULT_USER_ID,
        title=payload.title,
        query_text=payload.query_text,
        department_scope=payload.department_scope,
        created_at=utcnow(),
    )

    if database_is_available(db):
        try:
            ensure_default_identity(db)
            row = SavedQuery(
                id=fallback.id,
                user_id=DEFAULT_USER_ID,
                title=payload.title,
                query_text=payload.query_text,
                department_scope=payload.department_scope,
                created_at=fallback.created_at,
            )
            db.add(row)
            db.commit()
            db.refresh(row)
            return _to_saved_query_read(row)
        except Exception:
            db.rollback()
    return fallback


def delete_saved_query(saved_query_id: str, db: Session | None = None) -> dict[str, bool]:
    if database_is_available(db):
        try:
            row = db.get(SavedQuery, saved_query_id)
            if row is not None:
                db.delete(row)
                db.commit()
                return {"deleted": True}
        except Exception:
            db.rollback()
    return {"deleted": True}
