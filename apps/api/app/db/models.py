from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class Role(Base):
    __tablename__ = "roles"

    code: Mapped[str] = mapped_column(String(50), primary_key=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    permissions_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    department_code: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    role_code: Mapped[str] = mapped_column(ForeignKey("roles.code"), nullable=False, index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    role: Mapped["Role"] = relationship()


class SavedQuery(Base):
    __tablename__ = "saved_queries"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    query_text: Mapped[str] = mapped_column(Text, nullable=False)
    department_scope: Mapped[str | None] = mapped_column(String(50), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class Report(Base):
    __tablename__ = "reports"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    report_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    department_code: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    period_start: Mapped[date] = mapped_column(Date, nullable=False)
    period_end: Mapped[date] = mapped_column(Date, nullable=False)
    status: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    output_file_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    generated_by: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class ReportJob(Base):
    __tablename__ = "report_jobs"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    report_id: Mapped[str] = mapped_column(ForeignKey("reports.id"), nullable=False, index=True)
    job_status: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    alert_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    severity: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    department_code: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    entity_type: Mapped[str | None] = mapped_column(String(50), nullable=True)
    entity_id: Mapped[str | None] = mapped_column(String(50), nullable=True)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    message: Mapped[str | None] = mapped_column(Text, nullable=True)
    source_ref: Mapped[str | None] = mapped_column(String(255), nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)


class Approval(Base):
    __tablename__ = "approvals"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    approval_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    target_entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    target_entity_id: Mapped[str] = mapped_column(String(50), nullable=False)
    requested_by: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    approver_id: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True, index=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    request_payload_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    approved_payload_json: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    decided_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


class AgentRun(Base):
    __tablename__ = "agent_runs"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    user_id: Mapped[str] = mapped_column(ForeignKey("users.id"), nullable=False, index=True)
    department_code: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    route_type: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    response_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    confidence_score: Mapped[float | None] = mapped_column(Float, nullable=True)
    model_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    policy_version: Mapped[str | None] = mapped_column(String(100), nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    sources: Mapped[list["AgentRunSource"]] = relationship(back_populates="agent_run")


class AgentRunSource(Base):
    __tablename__ = "agent_run_sources"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    agent_run_id: Mapped[str] = mapped_column(ForeignKey("agent_runs.id"), nullable=False, index=True)
    source_type: Mapped[str] = mapped_column(String(50), nullable=False)
    source_ref: Mapped[str] = mapped_column(String(255), nullable=False)
    relevance_score: Mapped[float | None] = mapped_column(Float, nullable=True)

    agent_run: Mapped["AgentRun"] = relationship(back_populates="sources")


class ConnectorRun(Base):
    __tablename__ = "connector_runs"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    connector_name: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    inserted_rows: Mapped[int | None] = mapped_column(Integer, nullable=True)
    updated_rows: Mapped[int | None] = mapped_column(Integer, nullable=True)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)


class ProductionItem(Base):
    __tablename__ = "production_items"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    item_code: Mapped[str] = mapped_column(String(50), unique=True, nullable=False, index=True)
    item_name: Mapped[str] = mapped_column(String(200), nullable=False)
    spec: Mapped[str] = mapped_column(String(200), nullable=False, default="")
    unit: Mapped[str] = mapped_column(String(20), nullable=False, default="EA")
    available_qty: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    process_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    warehouse: Mapped[str | None] = mapped_column(String(100), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    inquiries: Mapped[list["ProductionInquiry"]] = relationship(back_populates="item")


class ProductionInquiry(Base):
    __tablename__ = "production_inquiries"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    inquiry_no: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    production_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    workorder_no: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    status: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    item_id: Mapped[str | None] = mapped_column(ForeignKey("production_items.id"), nullable=True, index=True)
    item_code: Mapped[str | None] = mapped_column(String(50), nullable=True)
    item_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    spec: Mapped[str | None] = mapped_column(String(200), nullable=True)
    unit: Mapped[str] = mapped_column(String(20), nullable=False, default="EA")
    planned_qty: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    receipt_qty: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    warehouse: Mapped[str | None] = mapped_column(String(100), nullable=True)
    remark: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_by: Mapped[str | None] = mapped_column(ForeignKey("users.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)

    item: Mapped["ProductionItem | None"] = relationship(back_populates="inquiries")
    history: Mapped[list["InquiryHistory"]] = relationship(back_populates="inquiry", order_by="InquiryHistory.changed_at.desc()")


class InquiryHistory(Base):
    __tablename__ = "inquiry_history"

    id: Mapped[str] = mapped_column(String(50), primary_key=True)
    inquiry_id: Mapped[str] = mapped_column(ForeignKey("production_inquiries.id"), nullable=False, index=True)
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    actor_name: Mapped[str] = mapped_column(String(100), nullable=False)
    changed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, index=True)
    before_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    after_status: Mapped[str | None] = mapped_column(String(50), nullable=True)
    before_receipt_qty: Mapped[int | None] = mapped_column(Integer, nullable=True)
    after_receipt_qty: Mapped[int | None] = mapped_column(Integer, nullable=True)
    note: Mapped[str | None] = mapped_column(Text, nullable=True)

    inquiry: Mapped["ProductionInquiry"] = relationship(back_populates="history")
