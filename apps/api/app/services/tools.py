from __future__ import annotations

from app.schemas.domain import AgentActionRead, AgentToolCallRead


def build_tool_call(tool_name: str, purpose: str, status: str = "planned") -> AgentToolCallRead:
    return AgentToolCallRead(tool_name=tool_name, purpose=purpose, status=status)


def safety_stock_recommendation() -> tuple[list[AgentToolCallRead], list[AgentActionRead]]:
    return (
        [
            build_tool_call("cortex_analyst", "안전재고 미달 품목을 조회합니다.", "completed"),
            build_tool_call("safety_stock_calculator", "부족 예상일과 추천 발주량을 계산합니다.", "completed"),
            build_tool_call("approval_generator", "발주 추천안을 승인 워크플로로 전환합니다.", "planned"),
        ],
        [
            AgentActionRead(
                action_type="approval_request",
                title="발주 추천 승인 요청 생성",
                description="추천 발주 수량 검토 후 구매팀 승인함으로 전송합니다.",
            )
        ],
    )


def quality_pattern_analysis() -> tuple[list[AgentToolCallRead], list[AgentActionRead]]:
    return (
        [
            build_tool_call("cortex_analyst", "품질 KPI와 반복 불량 패턴을 분석합니다.", "completed"),
            build_tool_call("cortex_search", "회의록/클레임 문서에서 근거를 검색합니다.", "completed"),
            build_tool_call("quality_anomaly_detector", "반복 불량 원인 후보를 도출합니다.", "completed"),
        ],
        [
            AgentActionRead(
                action_type="quality_action",
                title="품질 조치안 검토",
                description="반복 불량 상위 원인 후보에 대한 CAPA 초안 생성을 제안합니다.",
            )
        ],
    )


def report_generation_plan() -> tuple[list[AgentToolCallRead], list[AgentActionRead]]:
    return (
        [
            build_tool_call("cortex_analyst", "주간 KPI 마트를 조회합니다.", "completed"),
            build_tool_call("report_drafter", "보고서 초안을 생성합니다.", "completed"),
            build_tool_call("approval_generator", "배포 전 승인 요청을 생성합니다.", "planned"),
        ],
        [
            AgentActionRead(
                action_type="report_generation",
                title="주간 보고서 초안 생성",
                description="PDF/PPT 보고서 초안 생성을 백그라운드 작업으로 등록합니다.",
            )
        ],
    )


def default_analysis_plan() -> tuple[list[AgentToolCallRead], list[AgentActionRead]]:
    return (
        [
            build_tool_call("router_agent", "질문을 분석 유형으로 분류합니다.", "completed"),
            build_tool_call("cortex_analyst", "관련 KPI/팩트 테이블을 조회합니다.", "planned"),
        ],
        []
    )
