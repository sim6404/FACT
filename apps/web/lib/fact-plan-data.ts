/**
 * FACT ERP 코딩계획서 v1.0 기준 mock 데이터
 * 영동테크 주간회의 실적 반영
 */

export const YEAR_MONTH = "2026-02";

// ─── 대시보드 KPI 7개 ─────────────────────────────────────────────────────
export const DASHBOARD_KPIS = {
  sales_amount: 175166,           // 천원
  sales_rate: 96.5,               // %
  avg_ppm: 16281,                 // PPM
  defect_amount: 10481311,        // 원
  production_rate: 99.3,          // %
  labor_count: { current: 50, total: 51 }, // 명
  equipment_rate: null as number | null, // AISLVINA 연동
};

// ─── 고객사별 매출 (영업 현황) ─────────────────────────────────────────────
export const CUSTOMER_SALES = [
  { customer: "평화산업", target: 58000, actual: 52100, rate: 89.8, cause: "수요 변동", action: "수요 회복 시 재주문 대비" },
  { customer: "SECO AIA", target: 42000, actual: 40100, rate: 95.5, cause: "BUSH 리드타임", action: "생산 사이클 단축" },
  { customer: "삼익 THK", target: 38000, actual: 35200, rate: 92.6, cause: "이너씰 고불량", action: "금형 교체 진행" },
  { customer: "자동차(기타)", target: 28000, actual: 26400, rate: 94.3, cause: "일부 품목 지연", action: "우선순위 조정" },
];

// ─── 공정별 PPM 요약 (품질 카드 7개) ───────────────────────────────────────
export const PPM_CARDS = [
  { category: "BUSH", ppm: 19500, amount: 620000, status: "주의" as const },
  { category: "이너씰", ppm: 266509, amount: 5300000, status: "위험" as const },
  { category: "댐퍼/혼플레이트", ppm: 12000, amount: 180000, status: "양호" as const },
  { category: "순고무", ppm: 310000, amount: 215000, status: "위험" as const },
  { category: "스트럿폼패드", ppm: 13500, amount: 38000, status: "주의" as const },
  { category: "리워크", ppm: 0, amount: 9060000, status: "주의" as const },
  { category: "기타", ppm: 8500, amount: 120000, status: "양호" as const },
];

// ─── BUSH 품번별 PPM 드릴다운 ─────────────────────────────────────────────
export const BUSH_DRILLDOWN = [
  { item_no: "2421750", item_name: "BUSH 2421750", inspected: 24000, defect: 47, ppm: 1956, amount: 59925, cause: "금형 코어 이상", action: "금형 수리" },
  { item_no: "2421760", item_name: "BUSH 2421760", inspected: 16758, defect: 185, ppm: 11034, amount: 204055, cause: "기포불량", action: "배합조건 변경" },
  { item_no: "2421780", item_name: "BUSH 2421780", inspected: 20126, defect: 149, ppm: 7405, amount: 208004, cause: "착불량", action: "금형 점검" },
];

// ─── 이너씰 SRG 계열 ─────────────────────────────────────────────────────
export const INNER_SEAL_SRG = [
  { item_no: "SRG35", inspected: 5200, defect: 520, ppm: 100000, amount: 169000 },
  { item_no: "SRG45", inspected: 9228, defect: 2028, ppm: 219766, amount: 2075000 },
  { item_no: "SRG45L", inspected: 8480, defect: 2260, ppm: 266509, amount: 3153000 },
  { item_no: "SRG45L(WORST)", inspected: 8480, defect: 2260, ppm: 266509, amount: 3153000 },
];

// ─── 매입비율 경보 (75% / 110%) ───────────────────────────────────────────
export const PURCHASE_RATIO_ALERT = [
  { material: "BUSH 소재 2421750", planned: 100000, actual: 72000, ratio: 72, status: "75% 미달" as const },
  { material: "이너씰 원자재", planned: 50000, actual: 58000, ratio: 116, status: "110% 초과" as const },
];

// ─── 설비 가동률 (AISLVINA) ───────────────────────────────────────────────
export const EQUIPMENT_AVAILABILITY = [
  { line: "BUSH라인", rate: 94.2, total_h: 168, run_h: 158.3, down_h: 9.7 },
  { line: "스트럿라인", rate: 96.1, total_h: 168, run_h: 161.4, down_h: 6.6 },
  { line: "이너씰라인", rate: 88.5, total_h: 168, run_h: 148.7, down_h: 19.3 },
];

// ─── 비가동 원인 (파이 차트용) ────────────────────────────────────────────
export const DOWNTIME_CAUSES = [
  { cause: "금형 교체", hours: 12, pct: 35 },
  { cause: "원자재 부족", hours: 8, pct: 23 },
  { cause: "설비 고장", hours: 7, pct: 20 },
  { cause: "품질 점검", hours: 5, pct: 15 },
  { cause: "기타", hours: 2, pct: 7 },
];
