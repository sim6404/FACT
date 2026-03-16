from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.domain import ReportGenerateRequest, ReportPublishResponse, ReportRead
from app.services.reports import generate_report, get_report, list_reports, publish_report

router = APIRouter()


@router.post("/generate", response_model=ReportRead)
def generate_report_route(payload: ReportGenerateRequest, db: Session = Depends(get_db)):
    return generate_report(payload, db)


@router.get("", response_model=list[ReportRead])
def list_reports_route(db: Session = Depends(get_db)):
    return list_reports(db)


@router.get("/{report_id}", response_model=ReportRead)
def get_report_route(report_id: str, db: Session = Depends(get_db)):
    return get_report(report_id, db)


@router.post("/{report_id}/publish", response_model=ReportPublishResponse)
def publish_report_route(report_id: str, db: Session = Depends(get_db)):
    return publish_report(report_id, db)
