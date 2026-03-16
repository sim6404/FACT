from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.models import Report, ReportJob
from app.schemas.domain import ReportGenerateRequest, ReportPublishResponse, ReportRead
from app.services import seed_data
from app.services.persistence import DEFAULT_USER_ID, database_is_available, ensure_default_identity, utcnow


def _to_report_read(row: Report) -> ReportRead:
    return ReportRead(
        id=row.id,
        title=row.title,
        status=row.status,
        report_type=row.report_type,
        department_code=row.department_code,
        period_start=row.period_start,
        period_end=row.period_end,
        output_file_url=row.output_file_url,
    )


def generate_report(payload: ReportGenerateRequest, db: Session | None = None) -> ReportRead:
    response = ReportRead(
        id="report-queued-001",
        title=f"{payload.department_code} {payload.report_type} 보고서",
        status="queued",
        report_type=payload.report_type,
        department_code=payload.department_code,
        period_start=payload.period_start,
        period_end=payload.period_end,
    )

    if database_is_available(db):
        try:
            ensure_default_identity(db)
            report_id = f"report-{int(utcnow().timestamp() * 1000)}"
            report = Report(
                id=report_id,
                report_type=payload.report_type,
                department_code=payload.department_code,
                title=f"{payload.department_code} {payload.report_type} 보고서",
                period_start=payload.period_start,
                period_end=payload.period_end,
                status="queued",
                output_file_url=None,
                generated_by=DEFAULT_USER_ID,
                created_at=utcnow(),
            )
            db.add(report)
            db.add(
                ReportJob(
                    id=f"{report_id}-job-1",
                    report_id=report_id,
                    job_status="queued",
                    started_at=None,
                    ended_at=None,
                    error_message=None,
                )
            )
            db.commit()
            db.refresh(report)
            return _to_report_read(report)
        except Exception:
            db.rollback()

    return response


def list_reports(db: Session | None = None):
    if database_is_available(db):
        try:
            rows = db.scalars(select(Report).order_by(Report.created_at.desc()).limit(20)).all()
            if rows:
                return [_to_report_read(row) for row in rows]
        except Exception:
            db.rollback()
    return seed_data.REPORTS


def get_report(report_id: str, db: Session | None = None) -> ReportRead:
    if database_is_available(db):
        try:
            row = db.get(Report, report_id)
            if row is not None:
                return _to_report_read(row)
        except Exception:
            db.rollback()

    for report in seed_data.REPORTS:
        if report.id == report_id:
            return report
    return seed_data.REPORTS[0].model_copy(update={"id": report_id})


def publish_report(report_id: str, db: Session | None = None) -> ReportPublishResponse:
    if database_is_available(db):
        try:
            row = db.get(Report, report_id)
            if row is not None:
                row.status = "publish_requested"
                db.commit()
                return ReportPublishResponse(id=report_id, status=row.status)
        except Exception:
            db.rollback()

    return ReportPublishResponse(id=report_id, status="publish_requested")
