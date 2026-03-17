/**
 * FACT ERP — 주간회의 26년 02월 04주차 (전부서 완료) PPT 문서 기준
 * 영동테크 주간회의 실적 정확 반영
 */

// ─── 회의 기본 정보 ─────────────────────────────────────────────────────
export const MEETING_INFO = {
  title: "26. 03. 03(화) 02월(04주차) 주간 회의",
  date: "2026-03-03",
  weekRange: "2.23~2.27",
  weekLabel: "2월 4주차",
  yearPlan: 254,        // 억원
  monthPlan: 19,         // 억원 (02월)
  nextReport: "26년 01월 사업 계획 대비 실적보고 02/27 (금)→추후 공지",
  workPeriod: "02월 20일 ~ 02월 26일",
};

// ─── 목차 (PPT 구조) ─────────────────────────────────────────────────────
export const TOC = [
  "Ⅰ. 생산/생관/제조본부장",
  "Ⅱ. 품질",
  "Ⅲ. 영업/개발/연구소/CS본부장",
  "Ⅳ. 구매·자재/경영지원",
  "Ⅴ. AISLVINA",
];

export const YEAR_MONTH = "2026-02";

// ─── 대시보드 KPI 7개 (PPT Slide 2, 5, 17 정확 반영) ─────────────────────
export const DASHBOARD_KPIS = {
  sales_amount: 175166,           // 천원 (2/28 월 마감 기준)
  sales_gap: -7007,              // 천원 (목표 대비 차이)
  sales_rate: 96.5,              // %
  avg_ppm: 16281,                // PPM (2월 합계)
  defect_amount: 10481311,       // 원
  production_rate: 99.3,         // % (투입시간 달성률)
  labor_count: { current: 50, total: 51 },  // 명, 담당 박건우
  equipment_rate: null as number | null,
};

// ─── 담당자 (PPT Slide 5, 16, 17) ───────────────────────────────────────
export const RESPONSIBLES = {
  productionManager: "박건우",
  productionLeader: "생산 람 반장",
  qualityLeader: "검사 정정순 반장",
  qualityPlanner: "연규열",
  qualityEng: "옥성석",
  qualityManager: "김용식 실장",
  salesDirector: "최재영 이사",
  purchaseDirector: "이규영 이사",
  purchaseManager: "이규희 책임",
};

// ─── 인력 운영 현황 (Slide 5) ───────────────────────────────────────────
export const LABOR_STATUS = {
  plan: 51,
  actual: 50,
  byProcess: [
    { process: "성형", shift: "주간", plan: 2, actual: 2, gap: 0 },
    { process: "성형", shift: "야간", plan: 8, actual: 8, gap: 0 },
    { process: "조립", shift: "주간", plan: 6, actual: 6, gap: 0 },
    { process: "검사", shift: "주간", plan: 11, actual: 11, gap: 0 },
    { process: "지원", shift: "주간", plan: 2, actual: 2, gap: 0 },
    { process: "제외", shift: "열외", plan: 1, actual: 1, gap: 0 },
    { process: "합계", shift: "주간", plan: 38, actual: 36, gap: 0 },
    { process: "합계", shift: "야간", plan: 12, actual: 13, gap: 0 },
  ],
};

// ─── 투입시간 (Slide 5) ─────────────────────────────────────────────────
export const INPUT_HOURS = {
  dayShift: { plan: 2660, extra: 20, total: 2788, actual: 2640, rate: 99.3 },
  nightShift: { plan: 700, extra: 40, total: 740, actual: 700, rate: 100.0 },
};

// ─── 도포실 (Slide 11) ─────────────────────────────────────────────────
export const COATING_ROOM = {
  marchNeed: { day: 2, night: 2 },  // 3월 필요원: 주간 2명, 야간 2명
  inhouse: 73801460,    // 사내 도포금액 (원)
  daeyoung: 14849109,   // 대영 도포금액 (원)
  daeyoungPreprocess: 31404707,  // 대영 전처리비 (원)
};

// ─── 고객사별 매출 (영업 Slide, 2026.02.28 월 마감 기준) ────────────────────
export const CUSTOMER_SALES = [
  { customer: "영동테크", target: 32000, actual: 30009, gap: -1991, rate: 93.8, notes: "니코 바이그로멧 재고부족, SR 이너씰 백오더 확인" },
  { customer: "삼익 THK", target: 15000, actual: 22353, gap: 7353, rate: 149.0, notes: "해외 공장 대량 발주, 미입고 1억7천만원 분납 진행" },
  { customer: "평화산업", target: 61315, actual: 56806, gap: -4509, rate: 92.6, notes: "주력 750/760/780 OEM 발주량 저조, PHA 5천만원 수주" },
  { customer: "SECO AIA", target: 73145, actual: 65996, gap: -7149, rate: 90.2, notes: "혼플레이트 소요량 급감, KD 출고 완료(2/27)" },
];
export const SALES_TOTAL = { target: 181461, actual: 175166, gap: -7007 };  // 천원

// ─── 공정별 PPM 요약 (Slide 17) ─────────────────────────────────────────
export const PPM_CARDS = [
  { category: "평화 BUSH", ppm: 5428, amount: 3312392, status: "주의" as const },
  { category: "접시", ppm: 9213, amount: 216175, status: "양호" as const },
  { category: "아이아 댐퍼", ppm: 4190, amount: 727346, status: "양호" as const },
  { category: "혼플레이트", ppm: 850, amount: 26000, status: "양호" as const },
  { category: "A/S·SP2", ppm: 12956, amount: 1662000, status: "주의" as const },
  { category: "삼익 이너씰", ppm: 158585, amount: 3688425, status: "위험" as const },
  { category: "니프코 외 순고무", ppm: 21982, amount: 848973, status: "주의" as const },
];

// ─── BUSH 품번별 PPM 드릴다운 (Slide 18) ─────────────────────────────────
export const BUSH_DRILLDOWN = [
  { item_no: "2421750", inspected: 625000, defect: 625, ppm: 4052, amount: 796875, cause: "기포불량", action: "금형 수리" },
  { item_no: "2421760", inspected: 587000, defect: 587, ppm: 4548, amount: 647461, cause: "기포불량", action: "배합조건 변경" },
  { item_no: "2421770", inspected: 45000, defect: 45, ppm: 2494, amount: 49365, cause: "착불량", action: "금형 점검" },
  { item_no: "2421780", inspected: 816000, defect: 816, ppm: 9613, amount: 1139136, cause: "기포불량", action: "금형 파손 확인" },
];

// ─── 이너씰 SRG 계열 (Slide 23) ─────────────────────────────────────────
export const INNER_SEAL_SRG = [
  { item_no: "SRG35", inspected: 4795, defect: 225, ppm: 46924, amount: 184050 },
  { item_no: "SRG45", inspected: 9228, defect: 2028, ppm: 219766, amount: 2074644 },
  { item_no: "SRG45L", inspected: 8480, defect: 2260, ppm: 266509, amount: 3152700 },
  { item_no: "SRG55", inspected: 3948, defect: 2069, ppm: 524063, amount: 3064189 },
];

// ─── 매입비율 경보 (75% / 110%) ─────────────────────────────────────────
export const PURCHASE_RATIO_ALERT = [
  { material: "방진원재료", planned: 49000000, actual: 26854935, ratio: 56, status: "75% 미달" as const },
  { material: "BUSH (평화)", planned: 396000000, actual: 461552908, ratio: 114, status: "110% 초과" as const },
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
