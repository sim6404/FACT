from fastapi import APIRouter

from app.schemas.domain import (
    AlertRead,
    DashboardSummaryRead,
    DepartmentKpiRead,
    DepartmentKpiTrendRead,
    MeetingDirectiveRead,
    MeetingDirectiveStatusUpdateRequest,
)
from app.services.dashboard import (
    get_dashboard_summary,
    get_department_kpi,
    get_department_kpi_trend,
    get_meeting_directive,
    list_alerts,
    list_meeting_directives,
    update_meeting_directive_status,
)

router = APIRouter()


@router.get("/summary", response_model=DashboardSummaryRead)
def get_summary():
    return get_dashboard_summary()


@router.get("/alerts", response_model=list[AlertRead])
def get_alerts():
    return list_alerts()


@router.get("/kpi/{department}", response_model=DepartmentKpiRead)
def get_department_summary(department: str):
    return get_department_kpi(department)


@router.get("/kpi/{department}/trend", response_model=DepartmentKpiTrendRead)
def get_department_trend(department: str):
    return get_department_kpi_trend(department)


@router.get("/directives", response_model=list[MeetingDirectiveRead])
def get_meeting_directives():
    return list_meeting_directives()


@router.get("/directives/{directive_id}", response_model=MeetingDirectiveRead)
def get_meeting_directive_detail(directive_id: str):
    return get_meeting_directive(directive_id)


@router.post("/directives/{directive_id}/status", response_model=MeetingDirectiveRead)
def change_meeting_directive_status(directive_id: str, payload: MeetingDirectiveStatusUpdateRequest):
    return update_meeting_directive_status(directive_id, payload.status)
