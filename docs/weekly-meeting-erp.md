# Weekly Meeting ERP Blueprint

## Source Summary

기준 문서: `2.주간회의자료.pdf`

문서에서 확인된 실제 업무 흐름은 다음과 같습니다.

- 결재 / 검토 / 승인 / 공유 / 지시사항 관리
- 생산/생관/제조본부: 작업자 배치, 생산금액 실적, 자동화 라인 정상화
- 품질: 고객 이슈, 주간 계획/실적, 공정 불량, WORST 품목 집중관리, 개선대책
- 영업/개발/연구소/CS: 매출 목표 대비 실적, 고객사별 발주/생산 대응, 미달 원인 및 개선대책
- 구매·자재/경영지원: 수불관리 안정화, 자재 대응, 경영지원 공유

## ERP 방향 전환 목표

F.A.C.T를 단순 API 허브가 아니라 아래 기능을 수행하는 ERP 프로그램으로 전환합니다.

1. 회의자료를 업로드하면 부서별 핵심 이슈와 지시사항을 자동 추출
2. 담당자, 일정, 완료 여부를 액션아이템으로 등록
3. 생산/품질/영업/구매 데이터를 부서별 ERP 화면에서 통합 관리
4. WORST 품목과 위험 지표를 자동 감지하고 개선대책을 추천
5. 주간회의 보고서와 경영회의 보고서를 자동 초안 생성

## Core ERP Modules

### 1. Weekly Meeting Command Center

- 회의 일자, 업무기간, 주요 지시사항
- 부서별 핵심 이슈 요약
- 미완료 액션아이템 및 결재 상태
- 위험도 상위 항목

### 2. Production ERP

- 작업자 배치 현황
- 생산금액 실적
- 자동화 라인 정상화 진행 현황
- 4M 완료 건 추적
- 품번별 생산 계획 대비 실적

### 3. Quality ERP

- 고객 이슈 / 사내 이슈 관리
- 주간 계획/실적 관리
- 품번별 불량수, 금액, PPM
- WORST 아이템 집중관리
- 개선대책 / 담당자 / 일정 / 완료 여부
- 리워크 및 차기 LOT 모니터링

### 4. Sales / Customer ERP

- 고객사 목표 대비 실적
- 미달 금액 및 원인
- 고객사별 발주 감소 / 증가 신호
- 차월 예상 발주 및 생산 대응
- OEM / KD / 수출 대응 메모

### 5. Procurement / Inventory ERP

- 구매 수불관리 안정화
- 자재 부족 / 미입고 / 백오더 현황
- 발주 추천
- 재고 반영 매입 비율 관리

### 6. Approval / Directive Workflow

- 지시사항 등록
- 담당자 지정
- 완료 기한 설정
- 승인 / 반려 / 공유 흐름
- 부서장 검토 이력

## Automation Candidates

### Document Ingestion

- PDF / PPT / Excel 회의자료 업로드
- 부서, 품목, 고객사, 일정, 담당자 엔티티 추출
- 전주 대비 변경사항 요약

### KPI & Alert Automation

- PPM 임계치 초과 알림
- 목표 대비 실적 미달 알림
- WORST 품목 자동 랭킹
- 미완료 지시사항 SLA 경과 알림

### AI Assistant

- "이번 주 품질 WORST 품목은?"
- "평화산업 목표 대비 미달 원인 요약해줘"
- "구매 수불관리 불안정 원인과 대응안 보여줘"
- "회의자료에서 액션아이템만 추출해줘"

## Recommended Data Model Additions

- `weekly_meetings`
- `meeting_sections`
- `meeting_directives`
- `directive_assignees`
- `production_snapshots`
- `quality_defect_metrics`
- `sales_gap_metrics`
- `inventory_balance_metrics`

## Implementation Order

1. 회의 ERP 홈 화면과 대시보드 용어 정리
2. 주간회의 지시사항 / 액션아이템 모델 추가
3. 품질 / 생산 / 영업 / 구매 카드와 KPI 화면 강화
4. 회의자료 업로드 및 분석 API 추가
5. 지시사항 자동 추출과 후속조치 추천 자동화
