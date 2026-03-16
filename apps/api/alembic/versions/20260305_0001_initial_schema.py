"""initial schema

Revision ID: 20260305_0001
Revises:
Create Date: 2026-03-05 11:30:00
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "20260305_0001"
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "roles",
        sa.Column("code", sa.String(length=50), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("permissions_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.PrimaryKeyConstraint("code"),
    )

    op.create_table(
        "users",
        sa.Column("id", sa.String(length=50), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("department_code", sa.String(length=50), nullable=False),
        sa.Column("role_code", sa.String(length=50), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("last_login_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["role_code"], ["roles.code"]),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_department_code", "users", ["department_code"])
    op.create_index("ix_users_role_code", "users", ["role_code"])

    op.create_table(
        "saved_queries",
        sa.Column("id", sa.String(length=50), nullable=False),
        sa.Column("user_id", sa.String(length=50), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("query_text", sa.Text(), nullable=False),
        sa.Column("department_scope", sa.String(length=50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_saved_queries_user_id", "saved_queries", ["user_id"])

    op.create_table(
        "reports",
        sa.Column("id", sa.String(length=50), nullable=False),
        sa.Column("report_type", sa.String(length=50), nullable=False),
        sa.Column("department_code", sa.String(length=50), nullable=False),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("period_start", sa.Date(), nullable=False),
        sa.Column("period_end", sa.Date(), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("output_file_url", sa.String(length=500), nullable=True),
        sa.Column("generated_by", sa.String(length=50), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["generated_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_reports_department_code", "reports", ["department_code"])
    op.create_index("ix_reports_report_type", "reports", ["report_type"])
    op.create_index("ix_reports_status", "reports", ["status"])

    op.create_table(
        "report_jobs",
        sa.Column("id", sa.String(length=50), nullable=False),
        sa.Column("report_id", sa.String(length=50), nullable=False),
        sa.Column("job_status", sa.String(length=50), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(["report_id"], ["reports.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_report_jobs_report_id", "report_jobs", ["report_id"])
    op.create_index("ix_report_jobs_job_status", "report_jobs", ["job_status"])

    op.create_table(
        "alerts",
        sa.Column("id", sa.String(length=50), nullable=False),
        sa.Column("alert_type", sa.String(length=50), nullable=False),
        sa.Column("severity", sa.String(length=20), nullable=False),
        sa.Column("department_code", sa.String(length=50), nullable=False),
        sa.Column("entity_type", sa.String(length=50), nullable=True),
        sa.Column("entity_id", sa.String(length=50), nullable=True),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("source_ref", sa.String(length=255), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_alerts_alert_type", "alerts", ["alert_type"])
    op.create_index("ix_alerts_department_code", "alerts", ["department_code"])
    op.create_index("ix_alerts_severity", "alerts", ["severity"])
    op.create_index("ix_alerts_status", "alerts", ["status"])

    op.create_table(
        "approvals",
        sa.Column("id", sa.String(length=50), nullable=False),
        sa.Column("approval_type", sa.String(length=50), nullable=False),
        sa.Column("target_entity_type", sa.String(length=50), nullable=False),
        sa.Column("target_entity_id", sa.String(length=50), nullable=False),
        sa.Column("requested_by", sa.String(length=50), nullable=False),
        sa.Column("approver_id", sa.String(length=50), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("request_payload_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("approved_payload_json", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("decided_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["approver_id"], ["users.id"]),
        sa.ForeignKeyConstraint(["requested_by"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_approvals_approval_type", "approvals", ["approval_type"])
    op.create_index("ix_approvals_approver_id", "approvals", ["approver_id"])
    op.create_index("ix_approvals_requested_by", "approvals", ["requested_by"])
    op.create_index("ix_approvals_status", "approvals", ["status"])

    op.create_table(
        "agent_runs",
        sa.Column("id", sa.String(length=50), nullable=False),
        sa.Column("user_id", sa.String(length=50), nullable=False),
        sa.Column("department_code", sa.String(length=50), nullable=False),
        sa.Column("question", sa.Text(), nullable=False),
        sa.Column("route_type", sa.String(length=50), nullable=False),
        sa.Column("response_summary", sa.Text(), nullable=True),
        sa.Column("confidence_score", sa.Float(), nullable=True),
        sa.Column("model_name", sa.String(length=100), nullable=True),
        sa.Column("policy_version", sa.String(length=100), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_agent_runs_department_code", "agent_runs", ["department_code"])
    op.create_index("ix_agent_runs_route_type", "agent_runs", ["route_type"])
    op.create_index("ix_agent_runs_status", "agent_runs", ["status"])
    op.create_index("ix_agent_runs_user_id", "agent_runs", ["user_id"])

    op.create_table(
        "agent_run_sources",
        sa.Column("id", sa.String(length=50), nullable=False),
        sa.Column("agent_run_id", sa.String(length=50), nullable=False),
        sa.Column("source_type", sa.String(length=50), nullable=False),
        sa.Column("source_ref", sa.String(length=255), nullable=False),
        sa.Column("relevance_score", sa.Float(), nullable=True),
        sa.ForeignKeyConstraint(["agent_run_id"], ["agent_runs.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_agent_run_sources_agent_run_id", "agent_run_sources", ["agent_run_id"])

    op.create_table(
        "connector_runs",
        sa.Column("id", sa.String(length=50), nullable=False),
        sa.Column("connector_name", sa.String(length=100), nullable=False),
        sa.Column("started_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ended_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("status", sa.String(length=50), nullable=False),
        sa.Column("inserted_rows", sa.Integer(), nullable=True),
        sa.Column("updated_rows", sa.Integer(), nullable=True),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_connector_runs_connector_name", "connector_runs", ["connector_name"])
    op.create_index("ix_connector_runs_status", "connector_runs", ["status"])


def downgrade() -> None:
    op.drop_index("ix_connector_runs_status", table_name="connector_runs")
    op.drop_index("ix_connector_runs_connector_name", table_name="connector_runs")
    op.drop_table("connector_runs")

    op.drop_index("ix_agent_run_sources_agent_run_id", table_name="agent_run_sources")
    op.drop_table("agent_run_sources")

    op.drop_index("ix_agent_runs_user_id", table_name="agent_runs")
    op.drop_index("ix_agent_runs_status", table_name="agent_runs")
    op.drop_index("ix_agent_runs_route_type", table_name="agent_runs")
    op.drop_index("ix_agent_runs_department_code", table_name="agent_runs")
    op.drop_table("agent_runs")

    op.drop_index("ix_approvals_status", table_name="approvals")
    op.drop_index("ix_approvals_requested_by", table_name="approvals")
    op.drop_index("ix_approvals_approver_id", table_name="approvals")
    op.drop_index("ix_approvals_approval_type", table_name="approvals")
    op.drop_table("approvals")

    op.drop_index("ix_alerts_status", table_name="alerts")
    op.drop_index("ix_alerts_severity", table_name="alerts")
    op.drop_index("ix_alerts_department_code", table_name="alerts")
    op.drop_index("ix_alerts_alert_type", table_name="alerts")
    op.drop_table("alerts")

    op.drop_index("ix_report_jobs_job_status", table_name="report_jobs")
    op.drop_index("ix_report_jobs_report_id", table_name="report_jobs")
    op.drop_table("report_jobs")

    op.drop_index("ix_reports_status", table_name="reports")
    op.drop_index("ix_reports_report_type", table_name="reports")
    op.drop_index("ix_reports_department_code", table_name="reports")
    op.drop_table("reports")

    op.drop_index("ix_saved_queries_user_id", table_name="saved_queries")
    op.drop_table("saved_queries")

    op.drop_index("ix_users_role_code", table_name="users")
    op.drop_index("ix_users_department_code", table_name="users")
    op.drop_table("users")

    op.drop_table("roles")
