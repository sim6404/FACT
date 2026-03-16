from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.domain import SavedQueryCreateRequest, SavedQueryRead
from app.services.saved_queries import create_saved_query, delete_saved_query, list_saved_queries

router = APIRouter()


@router.get("", response_model=list[SavedQueryRead])
def list_saved_queries_route(db: Session = Depends(get_db)):
    return list_saved_queries(db)


@router.post("", response_model=SavedQueryRead)
def create_saved_query_route(payload: SavedQueryCreateRequest, db: Session = Depends(get_db)):
    return create_saved_query(payload, db)


@router.delete("/{saved_query_id}")
def delete_saved_query_route(saved_query_id: str, db: Session = Depends(get_db)):
    return delete_saved_query(saved_query_id, db)
