from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.domain import AgentQueryRequest, AgentQueryResponse, AgentRunRead
from app.services.agent import (
    get_agent_run,
    list_agent_runs,
    query_agent,
    submit_feedback,
)

router = APIRouter()


@router.post("/query", response_model=AgentQueryResponse)
def query_agent_route(payload: AgentQueryRequest, db: Session = Depends(get_db)):
    return query_agent(payload, db)


@router.get("/runs", response_model=list[AgentRunRead])
def list_agent_runs_route(db: Session = Depends(get_db)):
    return list_agent_runs(db)


@router.get("/runs/{run_id}", response_model=AgentRunRead)
def get_agent_run_route(run_id: str, db: Session = Depends(get_db)):
    return get_agent_run(run_id, db)


@router.post("/feedback")
def submit_agent_feedback():
    return submit_feedback()
