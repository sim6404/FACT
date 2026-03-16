from __future__ import annotations

from dataclasses import dataclass

from app.schemas.domain import AgentActionRead, AgentSourceRead, AgentToolCallRead
from app.services.snowflake import BaseSnowflakeGateway, create_snowflake_gateway
from app.services.tools import (
    default_analysis_plan,
    quality_pattern_analysis,
    report_generation_plan,
    safety_stock_recommendation,
)


@dataclass
class AgentExecutionPlan:
    route_type: str
    specialist_agent: str
    generated_sql: str | None
    response_summary: str
    answer_markdown: str
    tool_calls: list[AgentToolCallRead]
    recommended_actions: list[AgentActionRead]
    sources: list[AgentSourceRead]


class AgentOrchestrator:
    def __init__(self, snowflake_gateway: BaseSnowflakeGateway | None = None) -> None:
        self.snowflake_gateway = snowflake_gateway or create_snowflake_gateway()

    def classify(self, question: str) -> tuple[str, str]:
        lowered = question.lower()

        if "보고서" in question or "요약본" in question or "report" in lowered:
            return "report_generation", "executive_agent"

        if "불량" in question or "클레임" in question or "quality" in lowered:
            return "hybrid_quality_analysis", "quality_agent"

        if "발주" in question or "재고" in question or "납기" in question or "purchase" in lowered:
            return "structured_procurement_analysis", "procurement_agent"

        if "문서" in question or "회의록" in question or "eco" in lowered:
            return "document_retrieval", "document_agent"

        return "structured_analytics", "executive_support_agent"

    def build_plan(self, *, question: str, department_code: str | None) -> AgentExecutionPlan:
        route_type, specialist_agent = self.classify(question)
        structured_result = self.snowflake_gateway.run_structured_analytics(
            question=question,
            department_code=department_code,
        )
        document_hits = self.snowflake_gateway.search_documents(
            question=question,
            department_code=department_code,
        )

        if route_type == "structured_procurement_analysis":
            tool_calls, recommended_actions = safety_stock_recommendation()
            answer_markdown = (
                "안전재고 미달 가능성이 높은 품목을 기준으로 추천 발주안을 계산했습니다.\n\n"
                "- 기준 데이터: 재고, 생산계획, 납기, 안전재고 정책\n"
                "- 다음 단계: 추천 발주량 검토 후 승인 요청 생성"
            )
        elif route_type == "hybrid_quality_analysis":
            tool_calls, recommended_actions = quality_pattern_analysis()
            answer_markdown = (
                "최근 4주 반복 불량 패턴을 정형 데이터와 문서 근거로 함께 분석했습니다.\n\n"
                "- 상위 반복 유형을 우선 점검\n"
                "- 관련 클레임/회의록 근거를 함께 검토 권장"
            )
        elif route_type == "report_generation":
            tool_calls, recommended_actions = report_generation_plan()
            answer_markdown = (
                "주간 KPI와 이상징후를 바탕으로 경영회의용 보고서 초안 생성 흐름을 준비했습니다.\n\n"
                "- KPI 집계\n"
                "- 이상징후 요약\n"
                "- 승인 후 배포"
            )
        else:
            tool_calls, recommended_actions = default_analysis_plan()
            answer_markdown = (
                "질문을 구조화 분석형으로 분류했습니다.\n\n"
                "- KPI/팩트 기반 정형 질의 우선 수행\n"
                "- 필요 시 문서 검색과 승인 액션으로 확장"
            )

        sources = [
            AgentSourceRead(
                source_type="sql_dataset",
                source_ref=structured_result.dataset_name,
                relevance_score=0.96,
            ),
            *[
                AgentSourceRead(
                    source_type=hit.source_type,
                    source_ref=hit.source_ref,
                    relevance_score=hit.score,
                )
                for hit in document_hits
            ],
        ]

        return AgentExecutionPlan(
            route_type=route_type,
            specialist_agent=specialist_agent,
            generated_sql=structured_result.sql,
            response_summary=structured_result.summary,
            answer_markdown=answer_markdown,
            tool_calls=tool_calls,
            recommended_actions=recommended_actions,
            sources=sources,
        )
