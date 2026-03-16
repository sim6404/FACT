from fastapi import HTTPException

from app.schemas.domain import (
    DepartmentKpiRead,
    DepartmentKpiTrendRead,
    MeetingDirectiveRead,
)
from app.services import seed_data


def get_dashboard_summary():
    return seed_data.SUMMARY


def list_alerts():
    return seed_data.ALERTS


def get_department_kpi(department: str) -> DepartmentKpiRead:
    code = department.upper()
    return DepartmentKpiRead(
        department=code,
        kpis=seed_data.DEPARTMENT_KPIS.get(code, seed_data.DEPARTMENT_KPIS["EXEC"]),
    )


def get_department_kpi_trend(department: str) -> DepartmentKpiTrendRead:
    return DepartmentKpiTrendRead(department=department.upper(), points=seed_data.KPI_TREND)


def list_meeting_directives() -> list[MeetingDirectiveRead]:
    return seed_data.MEETING_DIRECTIVES


def get_meeting_directive(directive_id: str) -> MeetingDirectiveRead:
    directive = next((item for item in seed_data.MEETING_DIRECTIVES if item.id == directive_id), None)
    if directive is None:
        raise HTTPException(status_code=404, detail="Directive not found")
    return directive


def update_meeting_directive_status(directive_id: str, status: str) -> MeetingDirectiveRead:
    valid_statuses = {"pending", "in_progress", "completed", "at_risk"}
    normalized_status = status.lower()

    if normalized_status not in valid_statuses:
        raise HTTPException(status_code=400, detail="Invalid directive status")

    directive = get_meeting_directive(directive_id)
    directive.status = normalized_status
    return directive
