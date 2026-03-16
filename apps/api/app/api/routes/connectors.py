from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.domain import ConnectorRunRead
from app.services.connectors import list_connector_runs, run_connector

router = APIRouter()


@router.get("/runs", response_model=list[ConnectorRunRead])
def list_connector_runs_route(db: Session = Depends(get_db)):
    return list_connector_runs(db)


@router.post("/{name}/sync", response_model=ConnectorRunRead)
def run_connector_route(name: str, db: Session = Depends(get_db)):
    return run_connector(name, db)
