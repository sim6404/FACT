from __future__ import annotations

from dataclasses import dataclass
from importlib import import_module

from app.core.config import settings


@dataclass
class StructuredQueryResult:
    sql: str
    summary: str
    dataset_name: str


@dataclass
class DocumentSearchHit:
    source_ref: str
    source_type: str
    score: float


class BaseSnowflakeGateway:
    """Gateway interface for Snowflake/Cortex-backed services."""

    def run_structured_analytics(self, *, question: str, department_code: str | None) -> StructuredQueryResult:
        raise NotImplementedError

    def search_documents(self, *, question: str, department_code: str | None) -> list[DocumentSearchHit]:
        raise NotImplementedError


class MockSnowflakeGateway(BaseSnowflakeGateway):
    """Deterministic mock gateway for local MVP development."""

    def run_structured_analytics(self, *, question: str, department_code: str | None) -> StructuredQueryResult:
        lowered = question.lower()

        if "재고" in question or "발주" in question or "stock" in lowered or "purchase" in lowered:
            return StructuredQueryResult(
                sql=(
                    "SELECT item_code, current_stock, safety_stock, recommended_order_qty\n"
                    "FROM mart_procurement_risk_daily\n"
                    "WHERE risk_level = 'HIGH'\n"
                    "ORDER BY shortage_days ASC;"
                ),
                summary="안전재고 미달 가능성이 높은 품목을 발주 추천 관점으로 조회했습니다.",
                dataset_name="mart_procurement_risk_daily",
            )

        if "불량" in question or "품질" in question or "ppm" in lowered or "quality" in lowered:
            return StructuredQueryResult(
                sql=(
                    "SELECT defect_type, ppm, line_code, event_week\n"
                    "FROM mart_quality_ppm_weekly\n"
                    "WHERE event_week >= DATEADD(week, -4, CURRENT_DATE())\n"
                    "ORDER BY ppm DESC;"
                ),
                summary="최근 4주 품질 이상 패턴과 반복 불량 유형을 조회했습니다.",
                dataset_name="mart_quality_ppm_weekly",
            )

        return StructuredQueryResult(
            sql=(
                "SELECT department_code, kpi_name, kpi_value, period_key\n"
                "FROM mart_exec_kpi_weekly\n"
                "WHERE department_code = COALESCE(:department_code, department_code);"
            ),
            summary="부서 KPI 요약을 조회했습니다.",
            dataset_name="mart_exec_kpi_weekly",
        )

    def search_documents(self, *, question: str, department_code: str | None) -> list[DocumentSearchHit]:
        if "불량" in question or "회의" in question or "클레임" in question:
            return [
                DocumentSearchHit(source_ref="doc:quality-claim-history", source_type="document", score=0.92),
                DocumentSearchHit(source_ref="doc:weekly-production-meeting", source_type="document", score=0.85),
            ]

        if "발주" in question or "재고" in question:
            return [
                DocumentSearchHit(source_ref="doc:purchase-policy-v1.2", source_type="document", score=0.88),
                DocumentSearchHit(source_ref="doc:supplier-leadtime-guide", source_type="document", score=0.82),
            ]

        return [
            DocumentSearchHit(source_ref="doc:exec-weekly-brief-template", source_type="document", score=0.80),
        ]


class RealSnowflakeGateway(BaseSnowflakeGateway):
    """Credential-gated live Snowflake gateway.

    The live path is enabled only when `SNOWFLAKE_MODE=live` and the Snowflake
    connector package plus credentials are available. If not, the factory will
    transparently fall back to the mock gateway.
    """

    def _connect(self):
        connector = import_module("snowflake.connector")
        return connector.connect(
            account=settings.snowflake_account,
            user=settings.snowflake_user,
            password=settings.snowflake_password,
            warehouse=settings.snowflake_warehouse,
            database=settings.snowflake_database,
            schema=settings.snowflake_schema,
            role=settings.snowflake_role,
        )

    def _structured_sql(self, question: str, department_code: str | None) -> StructuredQueryResult:
        mock = MockSnowflakeGateway()
        return mock.run_structured_analytics(question=question, department_code=department_code)

    def run_structured_analytics(self, *, question: str, department_code: str | None) -> StructuredQueryResult:
        template = self._structured_sql(question, department_code)

        try:
            with self._connect() as connection:
                with connection.cursor() as cursor:
                    cursor.execute(template.sql)
                    cursor.fetchmany(3)
            return template
        except Exception as exc:
            return StructuredQueryResult(
                sql=template.sql,
                summary=f"{template.summary} Snowflake live execution fallback: {exc}",
                dataset_name=template.dataset_name,
            )

    def search_documents(self, *, question: str, department_code: str | None) -> list[DocumentSearchHit]:
        mock = MockSnowflakeGateway()

        # Cortex Search / doc search API wiring can be swapped in here when
        # service endpoint details are available. Until then, the live gateway
        # keeps structured analytics live and document retrieval deterministic.
        return mock.search_documents(question=question, department_code=department_code)


def create_snowflake_gateway() -> BaseSnowflakeGateway:
    live_requested = settings.snowflake_mode.lower() == "live"
    required_values = [
        settings.snowflake_account,
        settings.snowflake_user,
        settings.snowflake_password,
    ]

    if not live_requested:
        return MockSnowflakeGateway()

    if any(value.startswith("placeholder") or value.startswith("your-") for value in required_values):
        return MockSnowflakeGateway()

    try:
        import_module("snowflake.connector")
    except Exception:
        return MockSnowflakeGateway()

    return RealSnowflakeGateway()
