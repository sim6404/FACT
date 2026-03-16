from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import AgentRun, AgentRunSource
from app.schemas.domain import AgentQueryRequest, AgentQueryResponse, AgentRunRead
from app.services.approvals import create_demo_approval
from app.services import seed_data
from app.services.orchestrator import AgentOrchestrator
from app.services.persistence import DEFAULT_USER_ID, database_is_available, ensure_default_identity, utcnow

orchestrator = AgentOrchestrator()


def _to_agent_run_read(row: AgentRun) -> AgentRunRead:
    return AgentRunRead(
        id=row.id,
        department_code=row.department_code,
        route_type=row.route_type,
        status=row.status,
        model_name=row.model_name,
        policy_version=row.policy_version,
    )


def query_agent(payload: AgentQueryRequest, db: Session | None = None) -> AgentQueryResponse:
    plan = orchestrator.build_plan(
        question=payload.question,
        department_code=payload.department_code,
    )

    response = AgentQueryResponse(
        route_type=plan.route_type,
        specialist_agent=plan.specialist_agent,
        question=payload.question,
        department_code=payload.department_code,
        response_summary=plan.response_summary,
        generated_sql=plan.generated_sql,
        answer_markdown=plan.answer_markdown,
        tool_calls=plan.tool_calls,
        recommended_actions=plan.recommended_actions,
        sources=plan.sources,
    )

    if database_is_available(db):
        try:
            ensure_default_identity(db)
            run_id = f"run-{int(utcnow().timestamp() * 1000)}"
            agent_run = AgentRun(
                id=run_id,
                user_id=DEFAULT_USER_ID,
                department_code=payload.department_code or "EXEC",
                question=payload.question,
                route_type=plan.route_type,
                response_summary=plan.response_summary,
                confidence_score=0.82,
                model_name=plan.specialist_agent,
                policy_version="policy-rbac-v0.1",
                status="completed",
                created_at=utcnow(),
            )
            db.add(agent_run)
            db.flush()

            for index, source in enumerate(plan.sources, start=1):
                db.add(
                    AgentRunSource(
                        id=f"{run_id}-src-{index}",
                        agent_run_id=run_id,
                        source_type=source.source_type,
                        source_ref=source.source_ref,
                        relevance_score=source.relevance_score,
                    )
                )

            if any(action.action_type == "approval_request" for action in plan.recommended_actions):
                create_demo_approval(
                    db,
                    approval_type="purchase_order",
                    target_entity_type="agent_run",
                    target_entity_id=run_id,
                )

            db.commit()
        except Exception:
            db.rollback()

    return response


def list_agent_runs(db: Session | None = None):
    if database_is_available(db):
        try:
            rows = db.scalars(select(AgentRun).order_by(AgentRun.created_at.desc()).limit(20)).all()
            if rows:
                return [_to_agent_run_read(row) for row in rows]
        except Exception:
            db.rollback()
    return seed_data.AGENT_RUNS


def get_agent_run(run_id: str, db: Session | None = None):
    if database_is_available(db):
        try:
            row = db.get(AgentRun, run_id)
            if row is not None:
                return _to_agent_run_read(row)
        except Exception:
            db.rollback()

    for item in seed_data.AGENT_RUNS:
        if item.id == run_id:
            return item
    return seed_data.AGENT_RUNS[0].model_copy(update={"id": run_id})


def submit_feedback():
    return {"accepted": True}
