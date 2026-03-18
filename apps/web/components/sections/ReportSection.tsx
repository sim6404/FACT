"use client";
// ─── 주간 보고서 자동 집계 (PPT 주간회의 26년 02월 04주차 양식) ───────────────────
// 모든 섹션 데이터를 연동하여 영동테크 주간회의 보고서 서식으로 자동 출력

import { useMemo, useRef, useCallback } from "react";
import { Download, Printer, FileBarChart2, FileDown } from "lucide-react";
import { Btn, PgHdr, Tbl, TR, TD, NoRow, Badge, PBar, StatC, fc, fw, fp, fd } from "./shared";
import { MEETING_INFO, CUSTOMER_SALES } from "@/lib/fact-plan-data";

// ── 인쇄 / PDF 유틸리티 ────────────────────────────────────────────────────────
function triggerPrint(title: string) {
  const prev = document.title;
  document.title = title;
  window.print();
  // 비동기로 복원 (print 다이얼로그가 닫힌 후)
  setTimeout(() => { document.title = prev; }, 1000);
}

function triggerPdfSave(title: string) {
  const prev = document.title;
  document.title = title;
  // 브라우저 Print 다이얼로그에서 "PDF로 저장" 선택 안내
  const ua = navigator.userAgent;
  const isMac = /Mac/.test(ua);
  const hint = isMac
    ? "인쇄 대화상자에서 PDF 버튼을 눌러 저장하세요."
    : "인쇄 대화상자 > 프린터를 'Microsoft Print to PDF' 또는 'Save as PDF'로 선택하세요.";
  // 짧은 toast 표시 후 print
  const toast = document.createElement("div");
  toast.textContent = hint;
  Object.assign(toast.style, {
    position:"fixed", bottom:"24px", left:"50%", transform:"translateX(-50%)",
    background:"#0a2535", color:"white", padding:"10px 20px", borderRadius:"10px",
    fontSize:"12px", zIndex:"9999", boxShadow:"0 4px 16px rgba(0,0,0,0.25)",
    whiteSpace:"nowrap",
  });
  document.body.appendChild(toast);
  setTimeout(() => {
    document.body.removeChild(toast);
    window.print();
    setTimeout(() => { document.title = prev; }, 1000);
  }, 1200);
}

// ── 타입 ─────────────────────────────────────────────────────────────────────
interface ReportData {
  // 생산
  prodPlanTotal: number;
  prodActualTotal: number;
  prodNgTotal: number;
  workOrders: { wo_no: string; item_name: string; customer: string; plan_qty: number; actual_qty: number; ng_qty: number; status: string; due_date: string }[];
  // 품질
  qualTasks: { team: string; task_type: string; plan_task: string; actual_task: string; customer_issue: string; status: string }[];
  defects: { category: string; item_no: string; defect_qty: number; defect_amount: number; ppm: number; main_cause: string; action: string; assignee: string; action_due: string; status: string }[];
  reworks: { category: string; item_no: string; total_qty: number; total_amount: number; reason: string }[];
  // 영업
  salesCategories: { category: string; month_plan: number; month_actual: number }[];
  customers: { customer: string; target_amount: number; actual_amount: number; gap: number; action_items: string[] }[];
  // 구매
  pos: { po_no: string; vendor: string; item_name: string; total_amount: number; status: string; due_date: string }[];
  supplyShortages: { item_name: string; current_stock: number; monthly_requirement: number; gap: number }[];
}

// ── 기본 mock 데이터 (app-shell.tsx 에서 props로 받을 수 있음) ────────────────
const DEFAULT_DATA: ReportData = {
  prodPlanTotal: 59365, prodActualTotal: 50034, prodNgTotal: 6682,
  workOrders: [
    { wo_no: "WO-2026-03-001", item_name: "BUSH 2421750",       customer: "HKMC",    plan_qty: 5000,  actual_qty: 3200,  ng_qty: 47,   status: "생산중", due_date: "2026-03-07" },
    { wo_no: "WO-2026-03-002", item_name: "스트럿폼패드 AA000", customer: "HKMC",    plan_qty: 27365, actual_qty: 27365, ng_qty: 187,  status: "완료",   due_date: "2026-03-07" },
    { wo_no: "WO-2026-03-003", item_name: "방진AS A9001-B",     customer: "HKMC",    plan_qty: 4000,  actual_qty: 3672,  ng_qty: 71,   status: "생산중", due_date: "2026-03-07" },
    { wo_no: "WO-2026-03-004", item_name: "이너씰 SRG45",       customer: "HKMC",    plan_qty: 10000, actual_qty: 9228,  ng_qty: 2028, status: "지연",   due_date: "2026-03-07" },
    { wo_no: "WO-2026-03-005", item_name: "고무류 RB09Z1",      customer: "HKMC",    plan_qty: 12000, actual_qty: 10146, ng_qty: 3146, status: "지연",   due_date: "2026-03-05" },
    { wo_no: "WO-2026-03-006", item_name: "BUSH 2421760",        customer: "SECO AIA",plan_qty: 3000,  actual_qty: 2800,  ng_qty: 185,  status: "생산중", due_date: "2026-03-10" },
  ],
  qualTasks: [
    { team: "화성작업팀", task_type: "화성작업", plan_task: "NX5 신규 2호 ALL TOOL 교체",      actual_task: "TOOL 교체 준비 완료",               customer_issue: "",                                     status: "진행중" },
    { team: "이슈팀",    task_type: "이슈",    plan_task: "모듈퍼 품질문제 관련 공정서류",   actual_task: "아메가프레임 종료",                    customer_issue: "NG 마스터 제작 → 체크시트 완료",       status: "완료" },
    { team: "프레임팀",  task_type: "프레임",  plan_task: "SEAL RUBBER 리크불량 리워크",     actual_task: "리워크 완성 3/12",                      customer_issue: "2,480ea 중 984 교체 → 차주 완료",     status: "진행중" },
    { team: "인증팀",    task_type: "인증",    plan_task: "ISO9001/14001 인증 사후조사",     actual_task: "SQ 지적 개선계획서 완성",              customer_issue: "지도사항 15건 계획서 수립",            status: "완료" },
  ],
  defects: [
    { category: "BUSH",        item_no: "2421750",     defect_qty: 47,   defect_amount: 59925,   ppm: 1956,  main_cause: "금형 코어 이상",         action: "금형 수리",          assignee: "품질팀", action_due: "2026-03-10", status: "원인조사" },
    { category: "BUSH",        item_no: "2421760",     defect_qty: 185,  defect_amount: 204055,  ppm: 11034, main_cause: "기포불량 — 러버/재료문제", action: "배합조건 변경",       assignee: "생산팀", action_due: "2026-03-07", status: "조치완료" },
    { category: "스트럿폼패드",item_no: "56170-L8500", defect_qty: 8,    defect_amount: 18208,   ppm: 13536, main_cause: "고무 손상",               action: "원인분석",           assignee: "품질팀", action_due: "2026-03-12", status: "원인조사" },
    { category: "이너씰",      item_no: "SRG45",       defect_qty: 2028, defect_amount: 2074644, ppm: 219766,main_cause: "치수 불량",               action: "금형 수정",          assignee: "기술팀", action_due: "2026-03-07", status: "원인조사" },
    { category: "이너씰",      item_no: "SRG45L",      defect_qty: 2260, defect_amount: 3152700, ppm: 266509,main_cause: "치수 불량",               action: "금형 수정",          assignee: "기술팀", action_due: "2026-03-07", status: "원인조사" },
    { category: "고무류",      item_no: "RB09Z1",      defect_qty: 3146, defect_amount: 213928,  ppm: 310073,main_cause: "금형 불량",               action: "금형 교체",          assignee: "생산팀", action_due: "2026-03-10", status: "발생" },
  ],
  reworks: [
    { category: "이너씰", item_no: "SRG45",  total_qty: 1730, total_amount: 1769790, reason: "치수 불량 리워크" },
    { category: "이너씰", item_no: "SRG45L", total_qty: 4149, total_amount: 5787855, reason: "치수 불량 리워크" },
    { category: "스트럿", item_no: "56170-L8500", total_qty: 984, total_amount: 1230000, reason: "리크 불량 분해 리워크" },
  ],
  salesCategories: [
    { category: "스트럿폼패드", month_plan: 181500000, month_actual: 176491425 },
    { category: "방진A/S",      month_plan: 117000000, month_actual: 44843870 },
    { category: "BUSH",         month_plan: 528000000, month_actual: 341815317 },
    { category: "이너씰",       month_plan: 49000000,  month_actual: 42450140 },
  ],
  customers: CUSTOMER_SALES.map(c => ({
    customer: c.customer,
    target_amount: c.target * 1000,
    actual_amount: c.actual * 1000,
    gap: c.gap * 1000,
    action_items: c.notes ? [c.notes] : [],
  })),
  pos: [
    { po_no: "PO-2026-03-001", vendor: "㈜한국폼",    item_name: "BUSH 2421750 원자재",   total_amount: 1600000,  status: "발주",    due_date: "2026-03-10" },
    { po_no: "PO-2026-03-002", vendor: "금속부품㈜",  item_name: "BUSH 760 TYPE 소재",    total_amount: 600000,   status: "부분입고",due_date: "2026-03-08" },
    { po_no: "PO-2026-03-005", vendor: "야마구치공업",item_name: "SR15 이너씰 원자재",   total_amount: 1750000,  status: "발주",    due_date: "2026-03-14" },
  ],
  supplyShortages: [
    { item_name: "이너씰 SRG45 소재", current_stock: 500,  monthly_requirement: 28000, gap: -3500 },
    { item_name: "SR15 이너씰 원자재",current_stock: 0,    monthly_requirement: 10000, gap: -2000 },
  ],
};

// ── 보고서 섹션 컴포넌트 ─────────────────────────────────────────────────────

function ReportHdr({ no, week, range, writer }: { no: string; week: string; range: string; writer: string }) {
  return (
    <div className="overflow-hidden rounded-2xl shadow-sm" style={{ background: "linear-gradient(135deg,#0a2535 0%,#0d3d52 50%,#0b4f63 100%)" }}>
      <div className="flex items-start justify-between px-7 py-6">
        <div className="flex items-center gap-4">
          {/* 영동테크 로고 마크 */}
          <div>
            <p className="font-bold uppercase tracking-[0.2em] text-white" style={{ fontSize: 10 }}>영동테크 주식회사</p>
            <h2 className="mt-1.5 font-black tracking-tight text-white" style={{ fontSize: 22 }}>02월(04주차) 주간 회의</h2>
            <p className="mt-1" style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
              {MEETING_INFO.title} &nbsp;|&nbsp; 2026년 {MEETING_INFO.yearPlan}억 매출계획({MEETING_INFO.monthPlan}억/02월) &nbsp;|&nbsp; 업무기간 {MEETING_INFO.workPeriod}
            </p>
          </div>
        </div>
        <div className="text-right" style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>
          <p>보고번호 {no}</p>
          <p className="mt-0.5">작성일 {new Date().toLocaleDateString("ko-KR")}</p>
          <p className="mt-0.5">보고자 {writer}</p>
        </div>
      </div>
    </div>
  );
}

function SReportSec({ title, n, children }: { title: string; n?: number; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#e8eaf0] bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-[#eef1f8] bg-[#f7f8fc] px-5 py-3">
        <h3 className="font-bold text-[#1e2247]" style={{ fontSize: 13 }}>{title}</h3>
        {n !== undefined && <span className="text-slate-400" style={{ fontSize: 10 }}>총 {n}건</span>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

// ── 메인 ─────────────────────────────────────────────────────────────────────
export interface ReportSectionProps {
  data?: Partial<ReportData>;
}

export default function ReportSection({ data: extData }: ReportSectionProps) {
  const d: ReportData = useMemo(() => ({
    ...DEFAULT_DATA,
    ...extData,
  }), [extData]);

  const weekNo = 4;
  const year   = 2026;
  const range  = MEETING_INFO.workPeriod;
  const reportTitle = `주간회의_26년_02월_04주차`;

  // 집계
  const prodRate   = fp(d.prodActualTotal, d.prodPlanTotal);
  const totalDef   = d.defects.reduce((a, x) => a + x.defect_qty, 0);
  const totalDefAmt= d.defects.reduce((a, x) => a + x.defect_amount, 0);
  const totalRwk   = d.reworks.reduce((a, x) => a + x.total_qty, 0);
  const totalSalPlan = d.salesCategories.reduce((a, x) => a + x.month_plan, 0);
  const totalSalAct  = d.salesCategories.reduce((a, x) => a + x.month_actual, 0);
  const openDefects  = d.defects.filter(x => x.status === "발생" || x.status === "원인조사");

  const kpiGood = (val: boolean) => val ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700";

  return (
    <div className="space-y-4">
      {/* ── 상단 액션 바 (PDF 저장 · 인쇄) ── */}
      <div
        className="flex items-center justify-between rounded-2xl border px-5 py-3.5"
        style={{ background: "white", borderColor: "#e0e6ea", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
      >
        <div>
          <p className="font-bold text-[#0a2535]" style={{ fontSize: 14 }}>주간 보고서</p>
          <p className="text-[#8fa0ab]" style={{ fontSize: 10 }}>{year}년 {weekNo}주차 · {range}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* PDF 저장 */}
          <button
            onClick={() => triggerPdfSave(reportTitle)}
            className="flex items-center gap-1.5 rounded-xl border px-3.5 py-2 font-semibold transition-all hover:shadow-md"
            style={{
              fontSize: 12,
              borderColor: "#0d7f8a",
              color: "#0d7f8a",
              background: "rgba(13,127,138,0.05)",
            }}
          >
            <FileDown size={13} />
            PDF 저장
          </button>
          {/* 인쇄 */}
          <button
            onClick={() => triggerPrint(reportTitle)}
            className="flex items-center gap-1.5 rounded-xl px-3.5 py-2 font-semibold text-white transition-all hover:brightness-105 hover:shadow-md"
            style={{
              fontSize: 12,
              background: "linear-gradient(135deg, #0d7f8a 0%, #0a5f6e 100%)",
              boxShadow: "0 2px 8px rgba(13,127,138,0.3)",
            }}
          >
            <Printer size={13} />
            인쇄
          </button>
        </div>
      </div>

      {/* ── 표지 ── */}
      <ReportHdr no={`${year}-${weekNo}`} week={`${year}년 ${weekNo}주차`} range={range} writer="심현보 생산관리팀" />

      {/* ── KPI 요약 카드 4개 ── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { l: "생산 달성률", v: `${prodRate}%`,                    g: prodRate >= 90,  s: `${fc(d.prodActualTotal)} / ${fc(d.prodPlanTotal)} EA` },
          { l: "불량률",     v: totalSalPlan ? (totalDef / d.prodActualTotal * 100).toFixed(2) + "%" : "—", g: totalDef / d.prodActualTotal < 0.03, s: `불량 ${fc(totalDef)} EA` },
          { l: "영업 달성률",v: `${fp(totalSalAct, totalSalPlan)}%`, g: fp(totalSalAct, totalSalPlan) >= 90, s: `${Math.round(totalSalAct/10000)}만원` },
          { l: "미조치 불량",v: `${openDefects.length}건`,           g: openDefects.length === 0, s: `리워크 ${fc(totalRwk)} EA` },
        ].map(k => (
          <div key={k.l} className={`rounded-xl p-3.5 ${k.g ? "bg-emerald-50" : "bg-amber-50"}`}>
            <p className="text-slate-500" style={{ fontSize: 10 }}>{k.l}</p>
            <p className={`mt-1 font-bold leading-none tabular-nums ${k.g ? "text-emerald-700" : "text-amber-700"}`} style={{ fontSize: 26 }}>{k.v}</p>
            <p className={`mt-1 ${k.g ? "text-emerald-500" : "text-amber-500"}`} style={{ fontSize: 9 }}>{k.s}</p>
          </div>
        ))}
      </div>

      {/* ── 1. 생산/입고 현황 ── */}
      <SReportSec title="1. 생산 / 입고 현황" n={d.workOrders.length}>
        <div className="mb-4 grid grid-cols-4 gap-3">
          <StatC label="계획 수량" value={fc(d.prodPlanTotal)} unit="EA" />
          <StatC label="실적 수량" value={fc(d.prodActualTotal)} unit="EA" />
          <StatC label="불량 수량" value={fc(d.prodNgTotal)} unit="EA" warn />
          <StatC label="종합 달성률" value={prodRate} unit="%" />
        </div>
        <Tbl cols={["작업지시번호", "품목명", "고객사", "계획↓", "실적↓", "불량↓", "불량률↓", "달성률", "납기일", "상태"]}>
          {d.workOrders.map((w, i) => {
            const delayed = w.status === "지연";
            const defRate = w.actual_qty ? (w.ng_qty / w.actual_qty * 100).toFixed(2) + "%" : "—";
            const stC: Record<string, string> = { 완료: "green", 생산중: "blue", 지연: "red", 대기: "gray" };
            return (
              <TR key={i}>
                <TD mono>{w.wo_no}</TD>
                <TD bold>{w.item_name}</TD>
                <TD muted>{w.customer}</TD>
                <TD r>{fc(w.plan_qty)}</TD>
                <TD r bold>{fc(w.actual_qty)}</TD>
                <td className="px-3 py-2 text-right tabular-nums font-bold text-red-500" style={{ fontSize: 11 }}>{fc(w.ng_qty)}</td>
                <td className="px-3 py-2 text-right tabular-nums font-semibold text-[#1e2247]" style={{ fontSize: 11 }}>{defRate}</td>
                <td className="px-3 py-2"><PBar a={w.actual_qty} b={w.plan_qty} c={fp(w.actual_qty, w.plan_qty) >= 100 ? "green" : "indigo"} /></td>
                <td className={`px-3 py-2 ${delayed ? "font-bold text-red-500" : "text-slate-400"}`} style={{ fontSize: 11 }}>{w.due_date}</td>
                <td className="px-3 py-2"><Badge l={w.status} c={stC[w.status] ?? "gray"} /></td>
              </TR>
            );
          })}
        </Tbl>
      </SReportSec>

      {/* ── 2. 품질 현황 ── */}
      <SReportSec title="2. 품질 현황">
        {/* 주간 업무 계획/실적 */}
        <h4 className="mb-2 font-semibold text-[#1e2247]" style={{ fontSize: 11 }}>2-1. 주간 품질 계획 / 실적</h4>
        <Tbl cols={["팀", "업무유형", "금주 계획 업무", "금주 실적 결과", "고객 이슈", "상태"]}>
          {d.qualTasks.map((t, i) => {
            const stC: Record<string, string> = { 완료: "green", 진행중: "amber", 미완료: "red" };
            return (
              <TR key={i}>
                <TD bold>{t.team}</TD>
                <td className="px-3 py-2"><Badge l={t.task_type} c="blue" /></td>
                <TD cls="max-w-48">{t.plan_task}</TD>
                <TD cls="max-w-48">{t.actual_task}</TD>
                <TD muted cls="max-w-48">{t.customer_issue || "—"}</TD>
                <td className="px-3 py-2"><Badge l={t.status} c={stC[t.status] ?? "gray"} /></td>
              </TR>
            );
          })}
        </Tbl>

        {/* 공정 불량 현황 */}
        <h4 className="mb-2 mt-5 font-semibold text-[#1e2247]" style={{ fontSize: 11 }}>2-2. 공정 불량 현황 (2월 4주차)</h4>
        <Tbl cols={["제품군", "품번", "불량수↓", "불량금액↓", "PPM↓", "주요원인", "조치내용", "담당", "완료일", "상태"]}>
          {d.defects.map((def, i) => {
            const stC: Record<string, string> = { 발생: "red", 원인조사: "amber", 조치완료: "blue", 모니터링: "green" };
            return (
              <TR key={i}>
                <td className="px-3 py-2"><Badge l={def.category} c="blue" /></td>
                <TD mono bold>{def.item_no}</TD>
                <td className="px-3 py-2 text-right tabular-nums font-bold text-red-500" style={{ fontSize: 11 }}>{fc(def.defect_qty)}</td>
                <td className="px-3 py-2 text-right tabular-nums font-semibold text-[#1e2247]" style={{ fontSize: 11 }}>{Math.round(def.defect_amount / 10000)}만</td>
                <td className={`px-3 py-2 text-right tabular-nums font-bold ${def.ppm > 10000 ? "text-red-500" : def.ppm > 5000 ? "text-amber-500" : "text-[#1e2247]"}`} style={{ fontSize: 11 }}>{fc(def.ppm)}</td>
                <TD cls="max-w-32 truncate">{def.main_cause}</TD>
                <TD muted cls="max-w-32 truncate">{def.action}</TD>
                <TD muted>{def.assignee}</TD>
                <TD muted>{def.action_due}</TD>
                <td className="px-3 py-2"><Badge l={def.status} c={stC[def.status] ?? "gray"} /></td>
              </TR>
            );
          })}
          {/* 합계 */}
          <tr className="bg-[#f0f2fa] border-t border-[#e8eaf0]">
            <td colSpan={2} className="px-3 py-2 font-bold text-[#1e2247]" style={{ fontSize: 11 }}>합 계</td>
            <td className="px-3 py-2 text-right tabular-nums font-bold text-red-500" style={{ fontSize: 11 }}>{fc(totalDef)}</td>
            <td className="px-3 py-2 text-right tabular-nums font-bold text-red-500" style={{ fontSize: 11 }}>{Math.round(totalDefAmt / 10000)}만</td>
            <td colSpan={6} />
          </tr>
        </Tbl>

        {/* 리워크 현황 */}
        <h4 className="mb-2 mt-5 font-semibold text-[#1e2247]" style={{ fontSize: 11 }}>2-3. 리워크 현황</h4>
        <Tbl cols={["제품군", "품번", "리워크 수량↓", "리워크 금액↓", "원인"]}>
          {d.reworks.map((r, i) => (
            <TR key={i}>
              <td className="px-3 py-2"><Badge l={r.category} c="blue" /></td>
              <TD mono bold>{r.item_no}</TD>
              <td className="px-3 py-2 text-right tabular-nums font-bold text-amber-600" style={{ fontSize: 11 }}>{fc(r.total_qty)} EA</td>
              <td className="px-3 py-2 text-right tabular-nums font-bold text-red-500" style={{ fontSize: 11 }}>{Math.round(r.total_amount / 10000)}만원</td>
              <TD muted>{r.reason}</TD>
            </TR>
          ))}
        </Tbl>
      </SReportSec>

      {/* ── 3. 영업 현황 ── */}
      <SReportSec title="3. 영업 / 매출 현황">
        <div className="mb-4 grid grid-cols-3 gap-3">
          <StatC label="월 계획합계" value={`${Math.round(totalSalPlan / 10000)}만`} unit="원" />
          <StatC label="월 실적합계" value={`${Math.round(totalSalAct / 10000)}만`} unit="원" />
          <StatC label="달성률" value={fp(totalSalAct, totalSalPlan)} unit="%" warn={fp(totalSalAct, totalSalPlan) < 90} />
        </div>
        <Tbl cols={["제품군", "월 계획↓", "월 실적↓", "달성률"]}>
          {d.salesCategories.map((s, i) => {
            const rate = fp(s.month_actual, s.month_plan);
            return (
              <TR key={i}>
                <TD bold>{s.category}</TD>
                <TD r>{Math.round(s.month_plan / 10000)}만원</TD>
                <TD r bold>{Math.round(s.month_actual / 10000)}만원</TD>
                <td className="px-3 py-2"><PBar a={s.month_actual} b={s.month_plan} c={rate >= 100 ? "green" : "indigo"} /></td>
              </TR>
            );
          })}
        </Tbl>

        <h4 className="mb-2 mt-5 font-semibold text-[#1e2247]" style={{ fontSize: 11 }}>고객사별 목표/실적 및 개선 사항</h4>
        <Tbl cols={["고객사", "목표↓", "실적↓", "차이↓", "달성률", "개선·조치 사항"]}>
          {d.customers.map((c, i) => {
            const rate = fp(c.actual_amount, c.target_amount);
            return (
              <TR key={i}>
                <TD bold>{c.customer}</TD>
                <TD r>{Math.round(c.target_amount / 10000)}만</TD>
                <TD r bold>{Math.round(c.actual_amount / 10000)}만</TD>
                <td className={`px-3 py-2 text-right tabular-nums font-bold ${c.gap >= 0 ? "text-emerald-600" : "text-red-500"}`} style={{ fontSize: 11 }}>
                  {c.gap >= 0 ? "+" : ""}{Math.round(c.gap / 10000)}만
                </td>
                <td className="px-3 py-2">
                  <span className={`font-bold tabular-nums ${rate >= 100 ? "text-emerald-600" : rate >= 85 ? "text-[#5c6bc0]" : "text-red-500"}`} style={{ fontSize: 12 }}>{rate}%</span>
                </td>
                <td className="px-3 py-2" style={{ fontSize: 10 }}>
                  <ul className="space-y-0.5">
                    {c.action_items.filter(Boolean).map((a, j) => (
                      <li key={j} className="flex items-start gap-1 text-slate-600">
                        <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-[#5c6bc0]" />{a}
                      </li>
                    ))}
                  </ul>
                </td>
              </TR>
            );
          })}
        </Tbl>
      </SReportSec>

      {/* ── 4. 구매/자재 현황 ── */}
      <SReportSec title="4. 구매 / 자재 현황">
        <div className="grid grid-cols-2 gap-6">
          <div>
            <h4 className="mb-2 font-semibold text-[#1e2247]" style={{ fontSize: 11 }}>진행중 발주 현황</h4>
            <Tbl cols={["발주번호", "공급업체", "품목", "금액↓", "납기일", "상태"]}>
              {d.pos.map((p, i) => {
                const stC: Record<string, string> = { 발주: "blue", 입고대기: "sky", 부분입고: "amber", 입고완료: "green" };
                return (
                  <TR key={i}>
                    <TD mono>{p.po_no}</TD>
                    <TD muted>{p.vendor}</TD>
                    <TD bold>{p.item_name}</TD>
                    <TD r>{Math.round(p.total_amount / 10000)}만</TD>
                    <TD muted>{p.due_date}</TD>
                    <td className="px-3 py-2"><Badge l={p.status} c={stC[p.status] ?? "gray"} /></td>
                  </TR>
                );
              })}
            </Tbl>
          </div>
          <div>
            <h4 className="mb-2 font-semibold text-[#1e2247]" style={{ fontSize: 11 }}>자재 부족 현황 (즉시 발주 필요)</h4>
            {d.supplyShortages.length === 0 ? (
              <div className="flex items-center justify-center rounded-xl border border-emerald-200 bg-emerald-50 py-8 text-emerald-600" style={{ fontSize: 11 }}>자재 부족 없음 ✓</div>
            ) : (
              <Tbl cols={["품목명", "현재재고↓", "월소요↓", "부족↓"]}>
                {d.supplyShortages.map((s, i) => (
                  <TR key={i}>
                    <TD bold>{s.item_name}</TD>
                    <TD r warn>{fc(s.current_stock)}</TD>
                    <TD r>{fc(s.monthly_requirement)}</TD>
                    <td className="px-3 py-2 text-right tabular-nums font-bold text-red-500" style={{ fontSize: 11 }}>-{fc(Math.abs(s.gap))}</td>
                  </TR>
                ))}
              </Tbl>
            )}
          </div>
        </div>
      </SReportSec>

      {/* ── 서명란 ── */}
      <div className="rounded-xl border border-[#e8eaf0] bg-white p-5 shadow-sm">
        <div className="grid grid-cols-4 gap-4">
          {["작 성", "검 토", "팀 장", "대 표"].map(r => (
            <div key={r} className="text-center">
              <p className="mb-12 text-slate-400" style={{ fontSize: 10 }}>{r}</p>
              <div className="mx-4 border-b border-slate-300" />
              <p className="mt-1.5 text-slate-300" style={{ fontSize: 9 }}>(서명)</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
