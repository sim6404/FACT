// ─── 영동테크 주간보고 통합 타입 정의 ────────────────────────────────────────
// 섹션 간 데이터 연동을 위한 공유 타입

// ── 생산/입고 ──────────────────────────────────────────────────────────────

export interface WorkOrder {
  id: string;
  wo_no: string;
  item_code: string;
  item_name: string;
  customer: string;
  line: string;
  planned_qty: number;
  actual_qty: number;
  ng_qty: number;
  start_date: string;
  due_date: string;
  status: "대기" | "생산중" | "완료" | "지연" | "보류";
  week: string;
  unit_price: number;
  remark?: string;
}

export interface DailyProductionRecord {
  id: string;
  record_date: string;
  shift: "주간" | "야간";
  line: string;
  wo_no: string;
  item_code: string;
  item_name: string;
  plan_qty: number;
  actual_qty: number;
  ng_qty: number;
  workers: number;
  operator: string;
  remark?: string;
}

export interface WorkerAssignment {
  id: string;
  assign_date: string;
  line: string;
  standard_workers: number;
  assigned_workers: number;
  operator_names: string;
  remarks?: string;
}

export interface WeeklySummary {
  id: string;
  year: number;
  week_no: number;
  week_range: string;
  line: string;
  item_code: string;
  item_name: string;
  plan_qty: number;
  actual_qty: number;
  ng_qty: number;
  rework_qty: number;
  achievement_rate: number;
}

// ── 품질 ──────────────────────────────────────────────────────────────────

export interface QualityWeeklyTask {
  id: string;
  week: string;
  team: string;
  task_type: "화성작업" | "이슈" | "프레임" | "인증";
  plan_task: string;
  plan_assignee: string;
  plan_due: string;
  actual_task: string;
  actual_assignee: string;
  actual_due: string;
  customer_issue: string;
  defect_count: number;
  status: "미완료" | "진행중" | "완료";
}

export interface ProcessDefect {
  id: string;
  week: string;
  week_no: number;         // 1,2,3 = 해당 주차 불량
  category: "BUSH" | "스트럿폼패드" | "스플라이너" | "이너씰" | "고무류";
  item_no: string;
  inspected_qty: number;
  defect_qty: number;
  defect_amount: number;   // 원
  ppm: number;
  main_cause: string;
  action: string;
  assignee: string;
  action_due: string;
  status: "발생" | "원인조사" | "조치완료" | "모니터링";
}

export interface ReworkRecord {
  id: string;
  week: string;
  category: "BUSH" | "스트럿폼패드" | "스플라이너" | "이너씰" | "고무류";
  item_no: string;
  month1_qty: number;
  month1_amount: number;
  month2_qty: number;
  month2_amount: number;
  total_qty: number;
  total_amount: number;
  reason: string;
  assignee: string;
}

// ── 영업/수주 ─────────────────────────────────────────────────────────────

export interface MonthlySalesCategory {
  id: string;
  year: number;
  month: number;
  category: string;
  sub_category?: string;
  year_target: number;
  month_target_rate: number;
  month_plan: number;
  month_actual: number;
  ytd_actual: number;
  purchase_target_rate: number;
  purchase_plan: number;
  purchase_actual: number;
  w1_sales: number;
  w2_sales: number;
  w3_sales: number;
  w4_sales: number;
  w5_sales: number;
  notes: string;
}

export interface HkmcProgress {
  id: string;
  year: number;
  month: number;
  item_code: string;
  item_name: string;
  customer: string;
  monthly_plan: number;
  w1_plan: number; w2_plan: number; w3_plan: number; w4_plan: number; w5_plan: number;
  w1_actual: number; w2_actual: number; w3_actual: number; w4_actual: number; w5_actual: number;
  mtd_actual: number;
  achievement_rate: number;
  status: "정상" | "지연" | "완료";
  remarks?: string;
}

export interface CustomerTarget {
  id: string;
  year: number;
  month: number;
  customer: string;
  division: string;
  target_amount: number;
  actual_amount: number;
  gap: number;
  achievement_rate: number;
  action_items: string[];
  status: "달성" | "미달" | "초과";
}

// ── 구매/자재 ─────────────────────────────────────────────────────────────

export interface PurchaseOrder {
  id: string;
  po_no: string;
  vendor: string;
  item_code: string;
  item_name: string;
  spec?: string;
  qty: number;
  unit: string;
  unit_price: number;
  total_amount: number;
  order_date: string;
  due_date: string;
  received_qty: number;
  status: "발주" | "입고대기" | "부분입고" | "입고완료" | "취소";
  linked_pr_no?: string;
  remark?: string;
}

export interface MaterialSupplyPlan {
  id: string;
  item_code: string;
  item_name: string;
  category: string;
  customer: string;
  unit: string;
  current_stock: number;
  safety_stock: number;
  monthly_requirement: number;
  w1_req: number; w2_req: number; w3_req: number; w4_req: number;
  pending_order_qty: number;
  gap: number;
  plan_order_date?: string;
  vendor?: string;
  remarks?: string;
}

// ── 공유 집계 타입 ─────────────────────────────────────────────────────────

export interface WeeklyReportSummary {
  report_no: string;
  year: number;
  week_no: number;
  week_range: string;
  written_by: string;
  written_date: string;
  department: string;
  // 생산
  prod_plan_total: number;
  prod_actual_total: number;
  prod_achievement: number;
  prod_ng_total: number;
  // 품질
  qual_defect_total: number;
  qual_defect_amount: number;
  qual_ppm_avg: number;
  qual_ncr_open: number;
  // 영업
  sales_target: number;
  sales_actual: number;
  sales_achievement: number;
  // 구매
  purchase_total: number;
  purchase_received: number;
  // 이슈
  key_issues: string[];
  action_items: { task: string; assignee: string; due: string; status: string }[];
}
