# F.A.C.T

`F.A.C.T (FourD AI Convergence Transformer)`는 주간회의 자료, 생산/품질 실적, 영업 계획, 구매·자재 현황을 통합 분석하여
지시사항 추적과 실행까지 자동화하는 ERP 프로그램입니다.

현재 저장소는 제조업 주간회의 운영 흐름을 ERP 형태로 자동화하는 1차 MVP를 기준으로 구성되어 있습니다.

## Structure

- `apps/web`: Next.js + TypeScript 기반 사용자 포털
- `apps/api`: FastAPI 기반 API 서버
- `apps/worker`: Celery 기반 비동기 워커
- `infra`: 로컬 개발용 인프라 설정
- `docs`: 아키텍처 및 MVP 설계 문서

기존 루트의 `App.js`, `index.html`은 초기 시안/프로토타입 파일로 남겨두고, 실제 서비스 개발은 위 구조에서 진행합니다.

## ERP MVP Scope

- 주간회의 지시사항, 주요사항, 부서별 실적을 한 화면에서 보는 `회의 ERP 대시보드`
- 생산/생관: 작업자 배치, 생산금액 실적, 자동화 라인 정상화, 4M 진행현황 추적
- 품질: 고객 이슈, 주간 계획/실적, 불량 PPM, WORST 아이템 집중관리, 개선대책 추적
- 영업/개발/연구/CS: 매출 목표 대비 실적, 고객사별 미달 원인, 차월 발주/증산 대응 관리
- 구매·자재/경영지원: 수불관리 안정화, 자재 부족/재고 상태, 결재 및 공유 흐름 관리
- 문서 업로드 후 회의자료를 자동 분석해 액션아이템, 담당자, 일정, 리스크를 추출하는 업무 자동화
- FastAPI 기반 ERP 백엔드와 PostgreSQL/Redis/Celery 연결 기본 구조

## Quick Start

### Web ERP

```bash
cd apps/web
npm install
npm run dev
```

### API ERP Backend

```bash
cd apps/api
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
alembic upgrade head
uvicorn app.main:app --reload
```

### Local Infra

```bash
cd infra
docker compose up -d
```

PostgreSQL과 Redis를 먼저 올린 뒤 API 마이그레이션을 적용하는 흐름을 권장합니다.

로컬 MVP만 빠르게 확인할 때는 `.env`의 `ENABLE_DB_PERSISTENCE=false` 상태로 시작하면 됩니다.
실제 PostgreSQL 저장까지 활성화하려면 아래를 함께 켜세요.

```bash
ENABLE_DB_PERSISTENCE=true
AUTO_CREATE_TABLES=false
```

### Worker

```bash
cd apps/worker
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
celery -A worker.celery_app.celery_app worker --loglevel=info
```

자세한 설계는 `docs/architecture.md`와 `docs/weekly-meeting-erp.md`를 참고하세요.

## Migration

초기 스키마는 Alembic으로 관리합니다.

```bash
cd apps/api
alembic upgrade head
```

신규 리비전 생성:

```bash
cd apps/api
alembic revision -m "add new table"
```

## Snowflake Live Mode

기본값은 `mock` 모드입니다. 실제 Snowflake 연결을 사용하면 주간회의 ERP에서 다음과 같은 용도로 확장할 수 있습니다.

- 월/주간 생산, 품질, 매출 실적 집계
- 고객사/품번/불량유형 기준 이상 탐지
- 회의자료 요약용 KPI mart 구성
- 자연어 기반 원인 분석과 후속 액션 추천

실제 Snowflake 연결을 사용하려면 `apps/api/.env`에서 아래를 설정하세요.

```bash
SNOWFLAKE_MODE=live
SNOWFLAKE_ACCOUNT=<account>
SNOWFLAKE_USER=<user>
SNOWFLAKE_PASSWORD=<password>
SNOWFLAKE_WAREHOUSE=<warehouse>
SNOWFLAKE_DATABASE=<database>
SNOWFLAKE_SCHEMA=<schema>
SNOWFLAKE_ROLE=<role>
```

현재 구현은 다음 전략을 사용합니다.

- Structured analytics: 생산/품질/영업/구매 ERP 데이터 분석용 실 Snowflake 연결 경로 제공
- Document search: 회의자료, 품질 보고서, 고객 이슈 문서 검색에 활용
- ERP automation: 회의자료 기반 지시사항 추출, 부서별 후속 조치 추천, 보고서 초안 생성 방향으로 확장
