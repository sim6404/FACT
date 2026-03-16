# F.A.C.T ERP Architecture

## Product Direction

F.A.C.T는 단순 API 제공 서비스가 아니라, 주간회의 자료와 부서별 실적 데이터를 분석해 실제 업무를 자동화하는
제조업 ERP 프로그램을 목표로 합니다.

첨부된 주간회의 자료 기준으로 현재 1차 자동화 대상은 아래와 같습니다.

- 의사결정/결재/공유/지시사항 관리
- 생산/생관 실적 및 작업자 배치 현황
- 품질 이슈, 불량 PPM, WORST 품목 집중관리
- 영업/개발/연구/CS 매출 목표 대비 실적 및 원인 분석
- 구매·자재 수불관리 안정화
- 회의자료 업로드 후 액션아이템, 담당자, 일정, 리스크 자동 추출

## Target Stack

- Frontend: Next.js + TypeScript + Tailwind CSS + Recharts
- Backend: FastAPI + SQLAlchemy + Pydantic
- Worker: Celery + Redis
- App DB: PostgreSQL
- Analytics / AI Hub: Snowflake + Cortex Analyst/Search/Agents
- Deployment: container-based monorepo

## Monorepo Layout

```text
FACT/
  apps/
    web/
    api/
    worker/
  infra/
  docs/
```

## ERP MVP Modules

### Web Portal

- Weekly meeting control tower
- Production / manufacturing dashboard
- Quality issue and defect control board
- Sales / customer performance board
- Procurement / materials workflow screen
- Approval and instruction tracking inbox
- Meeting document explorer and automation workspace
- Operations / connector admin

### API Layer

- Auth / me
- Weekly meeting summary and directive extraction
- Department KPI summary and trend
- Production / quality / sales / procurement snapshots
- Agent query / run history
- Reports generate / publish
- Approvals list / approve / reject
- Documents list / search / ingestion
- Connector runs / health

### Application Services

- Weekly meeting parser
- Directive / action item tracker
- Query orchestrator
- Report composer
- Approval workflow service
- Alert service
- Document retrieval service
- ERP analytics aggregator

## Agent Flow

### Router Agent

- KPI 조회형
- 원인 분석형
- 문서 검색형
- 보고서 생성형
- 실행 요청형
- 회의자료 지시사항 추출형
- 부서별 후속조치 추천형

### Specialist Mapping

- `executive_agent`
- `production_agent`
- `procurement_agent`
- `quality_agent`
- `sales_agent`
- `document_agent`
- `executive_support_agent`

### Tool Chain

- Structured analytics: Cortex Analyst adapter
- Document retrieval: Cortex Search adapter
- Business tools:
  - weekly meeting directive extractor
  - production performance summarizer
  - purchase recommendation
  - quality anomaly detector
  - sales gap analyzer
  - report drafter
  - approval generator

현재 구현은 실제 Snowflake 연결 전 단계로, `SnowflakeGateway` 인터페이스와 `AgentOrchestrator`를 통해
ERP 질문 분류와 툴 체인 계획을 우선 제공합니다.

## Storage Boundary

### PostgreSQL

- users / roles
- weekly_meetings / meeting_directives
- approvals / workflow state
- reports / report_jobs
- saved_queries
- agent_runs / agent_run_sources
- connector_runs

### Snowflake

- RAW / CORE / MART / DOC layers
- weekly meeting KPI mart
- department performance mart
- quality defect mart
- sales plan vs actual mart
- procurement / inventory mart
- Cortex Analyst / Search / Agents integration

## Initial Delivery Principle

1. Start with weekly meeting document analysis and department ERP flows.
2. Keep service boundaries clear from the first commit.
3. Make the UI operations-oriented, even if data is mocked first.
4. Add Snowflake / SSO / connectors incrementally behind interfaces.
5. Prioritize instruction tracking and actual workflow execution over generic API exposure.
