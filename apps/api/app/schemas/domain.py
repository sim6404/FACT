from datetime import date, datetime
from typing import Any

from pydantic import BaseModel, Field


class RoleRead(BaseModel):
    code: str
    name: str
    permissions_json: dict[str, Any] | None = None


class UserRead(BaseModel):
    id: str
    email: str
    name: str
    department_code: str
    role_code: str
    is_active: bool = True
    last_login_at: datetime | None = None


class AgentSourceRead(BaseModel):
    source_type: str
    source_ref: str
    relevance_score: float | None = None


class AgentToolCallRead(BaseModel):
    tool_name: str
    purpose: str
    status: str


class AgentActionRead(BaseModel):
    action_type: str
    title: str
    description: str


class AgentQueryRequest(BaseModel):
    question: str
    department_code: str | None = None


class AgentQueryResponse(BaseModel):
    route_type: str
    specialist_agent: str
    question: str
    department_code: str | None = None
    response_summary: str
    generated_sql: str | None = None
    answer_markdown: str | None = None
    tool_calls: list[AgentToolCallRead] = Field(default_factory=list)
    recommended_actions: list[AgentActionRead] = Field(default_factory=list)
    sources: list[AgentSourceRead]


class AgentRunRead(BaseModel):
    id: str
    department_code: str
    route_type: str
    status: str
    model_name: str | None = None
    policy_version: str | None = None


class SavedQueryCreateRequest(BaseModel):
    title: str
    query_text: str
    department_scope: str | None = None


class SavedQueryRead(BaseModel):
    id: str
    user_id: str
    title: str
    query_text: str
    department_scope: str | None = None
    created_at: datetime


class AlertRead(BaseModel):
    id: str
    alert_type: str
    severity: str
    department_code: str
    title: str
    message: str | None = None
    source_ref: str | None = None


class DashboardDepartmentRead(BaseModel):
    code: str
    name: str
    kpi_status: str


class DashboardSummaryRead(BaseModel):
    alerts_today: int
    weekly_reports: int
    pending_approvals: int
    recent_queries: int
    departments: list[DashboardDepartmentRead]


class KpiMetricRead(BaseModel):
    code: str
    label: str
    value: float
    unit: str


class DepartmentKpiRead(BaseModel):
    department: str
    kpis: list[KpiMetricRead]


class KpiTrendPointRead(BaseModel):
    period: str
    oee: float
    ppm: int
    supplier_otd: float


class DepartmentKpiTrendRead(BaseModel):
    department: str
    points: list[KpiTrendPointRead]


class MeetingDirectiveRead(BaseModel):
    id: str
    meeting_date: date
    department_code: str
    category: str
    title: str
    status: str
    owner_name: str
    due_date: date | None = None
    source_page: int | None = None
    source_section: str | None = None
    notes: str | None = None


class MeetingDirectiveStatusUpdateRequest(BaseModel):
    status: str


class ProductionInquiryRead(BaseModel):
    id: str
    inquiry_no: str
    production_date: date
    workorder_no: str
    status: str
    item_code: str | None = None
    item_name: str | None = None
    spec: str | None = None
    unit: str
    planned_qty: int
    receipt_qty: int
    warehouse: str | None = None
    remark: str | None = None


class ProductionItemRead(BaseModel):
    id: str
    item_code: str
    item_name: str
    spec: str
    unit: str
    available_qty: int
    process_name: str | None = None
    warehouse: str | None = None


class ProductionInquirySelectionRequest(BaseModel):
    item_id: str
    receipt_qty: int | None = None


class ProductionInquiryUpsertRequest(BaseModel):
    inquiry_no: str
    production_date: date
    workorder_no: str
    status: str
    item_code: str | None = None
    item_name: str | None = None
    spec: str | None = None
    unit: str
    planned_qty: int
    receipt_qty: int
    warehouse: str | None = None
    remark: str | None = None


class InquiryHistoryRead(BaseModel):
    id: str
    inquiry_id: str
    action: str
    actor_name: str
    changed_at: datetime
    before_status: str | None = None
    after_status: str | None = None
    before_receipt_qty: int | None = None
    after_receipt_qty: int | None = None
    note: str | None = None


class ProductionProcessRead(BaseModel):
    id: str
    process_no: str
    customer_name: str
    item_code: str
    item_name: str
    production_status: str
    quality_status: str
    inventory_status: str
    plan_qty: int
    produced_qty: int
    defect_qty: int
    available_qty: int
    ready_qty: int
    next_action: str
    issue_summary: str | None = None


class ProductionProcessActionRequest(BaseModel):
    action: str


class ProductionProcessEventRead(BaseModel):
    id: str
    process_id: str
    step_code: str
    step_label: str
    status: str
    actor_name: str
    happened_at: datetime
    detail: str


class ProductionApprovalLogRead(BaseModel):
    id: str
    process_id: str
    stage: str
    approver_name: str
    status: str
    decided_at: datetime | None = None
    comment: str | None = None


class InventorySyncRead(BaseModel):
    process_id: str
    warehouse: str
    item_code: str
    before_qty: int
    receipt_qty: int
    after_qty: int
    sync_status: str
    last_synced_at: datetime | None = None


class ProductionProcessDetailRead(BaseModel):
    process: ProductionProcessRead
    timeline: list[ProductionProcessEventRead] = Field(default_factory=list)
    approvals: list[ProductionApprovalLogRead] = Field(default_factory=list)
    inventory_sync: InventorySyncRead | None = None


class ReportGenerateRequest(BaseModel):
    report_type: str
    department_code: str
    period_start: date
    period_end: date


class ReportRead(BaseModel):
    id: str
    title: str
    status: str
    report_type: str | None = None
    department_code: str | None = None
    period_start: date | None = None
    period_end: date | None = None
    output_file_url: str | None = None


class ReportPublishResponse(BaseModel):
    id: str
    status: str


class ApprovalRead(BaseModel):
    id: str
    approval_type: str
    status: str


class ApprovalDecisionResponse(BaseModel):
    id: str
    status: str


class ConnectorRunRead(BaseModel):
    id: str
    connector_name: str
    started_at: datetime
    ended_at: datetime | None = None
    status: str
    inserted_rows: int | None = None
    updated_rows: int | None = None
    error_message: str | None = None


class DocumentRead(BaseModel):
    id: str
    title: str
    type: str
    highlights: list[str] = Field(default_factory=list)


class DocumentSearchRequest(BaseModel):
    query: str
    department_code: str | None = None


class DocumentSearchResultRead(BaseModel):
    id: str
    title: str
    score: float


class DocumentSearchResponse(BaseModel):
    query: str
    results: list[DocumentSearchResultRead]


class MeetingDocumentAnalysisRead(BaseModel):
    file_name: str
    document_type: str
    summary: str
    directives: list[MeetingDirectiveRead]
    detected_sections: list[str] = Field(default_factory=list)


class SystemHealthRead(BaseModel):
    status: str
    services: dict[str, str]


# ────────────────────────────── Quality ──────────────────────────────

class QualityNCRRead(BaseModel):
    id: str
    ncr_no: str
    detected_at: date
    department_code: str
    item_code: str | None = None
    item_name: str | None = None
    defect_type: str
    defect_qty: int
    total_qty: int
    defect_rate: float
    status: str                # open | investigating | resolved | closed
    severity: str              # critical | major | minor
    detected_by: str
    root_cause: str | None = None
    action_taken: str | None = None
    resolved_at: date | None = None
    customer_name: str | None = None
    remark: str | None = None


class QualityNCRUpsertRequest(BaseModel):
    ncr_no: str
    detected_at: date
    department_code: str
    item_code: str | None = None
    item_name: str | None = None
    defect_type: str
    defect_qty: int
    total_qty: int
    status: str
    severity: str
    detected_by: str
    root_cause: str | None = None
    action_taken: str | None = None
    resolved_at: date | None = None
    customer_name: str | None = None
    remark: str | None = None


class QualityNCRStatusUpdate(BaseModel):
    status: str
    action_taken: str | None = None
    root_cause: str | None = None


# ────────────────────────────── Inventory ──────────────────────────────

class InventoryLedgerRead(BaseModel):
    id: str
    item_code: str
    item_name: str
    spec: str | None = None
    unit: str
    warehouse: str
    stock_qty: int
    safety_stock: int
    is_below_safety: bool
    last_updated: datetime


class InventoryTransactionRead(BaseModel):
    id: str
    item_code: str
    item_name: str
    tx_type: str              # receipt | issue | adjust | return
    qty: int
    balance_after: int
    warehouse: str
    reference_no: str | None = None
    actor_name: str
    tx_at: datetime
    note: str | None = None


class InventoryTransactionCreateRequest(BaseModel):
    item_code: str
    tx_type: str
    qty: int
    warehouse: str
    reference_no: str | None = None
    note: str | None = None
