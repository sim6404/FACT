"use client";
// ─── 생산/입고/조립본부 ─────────────────────────────────────────────────────

import { useState, useMemo, useCallback } from "react";
import {
  Plus, RefreshCw, Download, Printer,
  ClipboardList, BarChart2, Users, TrendingUp,
} from "lucide-react";
import {
  Badge, Btn, Fld, Inp, Sl, Textarea, Modal, Srch,
  Tbl, TR, TD, NoRow, PBar, StatC, AlertBanner, SaveBar, uid,
  fc, fp, PageModal, SectionLanding, ExcelExportBtn, ExcelImportBtn, PrintBtn,
  type LandingCardDef, type ExcelRow,
} from "./shared";
import type {
  WorkOrder, DailyProductionRecord, WorkerAssignment, WeeklySummary,
} from "./types";
import { COATING_ROOM, LABOR_STATUS, INPUT_HOURS, RESPONSIBLES } from "@/lib/fact-plan-data";

const WO_S: Record<string, { l: string; c: string }> = {
  대기:   { l: "대기",   c: "gray" },
  생산중: { l: "생산중", c: "blue" },
  완료:   { l: "완료",   c: "green" },
  지연:   { l: "지연",   c: "red" },
  보류:   { l: "보류",   c: "amber" },
};

const NOW_WEEK = "2026-03-1주";

const INIT_WO: WorkOrder[] = [
  { id: "w1", wo_no: "WO-2026-03-001", item_code: "2421750", item_name: "BUSH 2421750", customer: "HKMC", line: "BUSH라인", planned_qty: 5000, actual_qty: 3200, ng_qty: 47, start_date: "2026-03-03", due_date: "2026-03-07", status: "생산중", week: NOW_WEEK, unit_price: 1274, remark: "" },
  { id: "w2", wo_no: "WO-2026-03-002", item_code: "56170-AA000", item_name: "스트럿폼패드 AA000", customer: "HKMC", line: "스트럿라인", planned_qty: 27365, actual_qty: 27365, ng_qty: 187, start_date: "2026-03-03", due_date: "2026-03-07", status: "완료", week: NOW_WEEK, unit_price: 2092, remark: "" },
  { id: "w3", wo_no: "WO-2026-03-003", item_code: "21832-A9001-B", item_name: "방진AS A9001-B", customer: "HKMC", line: "방진라인", planned_qty: 4000, actual_qty: 3672, ng_qty: 71, start_date: "2026-03-03", due_date: "2026-03-07", status: "생산중", week: NOW_WEEK, unit_price: 4000, remark: "" },
  { id: "w4", wo_no: "WO-2026-03-004", item_code: "SRG45", item_name: "이너씰 SRG45", customer: "HKMC", line: "이너씰라인", planned_qty: 10000, actual_qty: 9228, ng_qty: 2028, start_date: "2026-03-03", due_date: "2026-03-07", status: "지연", week: NOW_WEEK, unit_price: 1024, remark: "고불량발생" },
  { id: "w5", wo_no: "WO-2026-03-005", item_code: "RB09Z1", item_name: "고무류 RB09Z1", customer: "HKMC", line: "고무류라인", planned_qty: 12000, actual_qty: 10146, ng_qty: 3146, start_date: "2026-03-01", due_date: "2026-03-05", status: "지연", week: NOW_WEEK, unit_price: 68, remark: "" },
  { id: "w6", wo_no: "WO-2026-03-006", item_code: "2421760", item_name: "BUSH 2421760", customer: "SECO AIA", line: "BUSH라인", planned_qty: 3000, actual_qty: 2800, ng_qty: 185, start_date: "2026-03-03", due_date: "2026-03-10", status: "생산중", week: NOW_WEEK, unit_price: 1100, remark: "" },
];

const INIT_DAILY: DailyProductionRecord[] = [
  { id: "d1", record_date: "2026-03-03", shift: "주간", line: "BUSH라인", wo_no: "WO-2026-03-001", item_code: "2421750", item_name: "BUSH 2421750", plan_qty: 1000, actual_qty: 890, ng_qty: 12, workers: 6, operator: "김철수", remark: "" },
  { id: "d2", record_date: "2026-03-03", shift: "야간", line: "BUSH라인", wo_no: "WO-2026-03-001", item_code: "2421750", item_name: "BUSH 2421750", plan_qty: 1000, actual_qty: 960, ng_qty: 8, workers: 5, operator: "이영희", remark: "" },
  { id: "d3", record_date: "2026-03-04", shift: "주간", line: "스트럿라인", wo_no: "WO-2026-03-002", item_code: "56170-AA000", item_name: "스트럿폼패드 AA000", plan_qty: 5500, actual_qty: 5480, ng_qty: 40, workers: 8, operator: "박민수", remark: "" },
  { id: "d4", record_date: "2026-03-04", shift: "주간", line: "이너씰라인", wo_no: "WO-2026-03-004", item_code: "SRG45", item_name: "이너씰 SRG45", plan_qty: 2000, actual_qty: 1845, ng_qty: 420, workers: 4, operator: "최정훈", remark: "SRG45L 고불량" },
];

const INIT_WORKER: WorkerAssignment[] = [
  { id: "wa1", assign_date: "2026-03-03", line: "BUSH라인",   standard_workers: 7, assigned_workers: 6, operator_names: "김철수, 이영희, 박순자, 최민호, 강현수, 윤소라", remarks: "1명 결근" },
  { id: "wa2", assign_date: "2026-03-03", line: "스트럿라인", standard_workers: 9, assigned_workers: 9, operator_names: "박민수, 김지현, 이상철, 최영수, 홍길동, 이민정, 조현우, 강태양, 박서연", remarks: "" },
  { id: "wa3", assign_date: "2026-03-03", line: "방진라인",   standard_workers: 5, assigned_workers: 5, operator_names: "신동호, 이수진, 김명훈, 박성현, 장미라", remarks: "" },
  { id: "wa4", assign_date: "2026-03-03", line: "이너씰라인", standard_workers: 5, assigned_workers: 4, operator_names: "최정훈, 이지은, 강동원, 박혜진", remarks: "1명 연차" },
  { id: "wa5", assign_date: "2026-03-03", line: "고무류라인", standard_workers: 4, assigned_workers: 4, operator_names: "정우성, 한지민, 오세훈, 이나영", remarks: "" },
];

const INIT_WEEKLY: WeeklySummary[] = [
  { id: "ws1", year: 2026, week_no: 9, week_range: "2/23~2/28", line: "BUSH라인",   item_code: "2421750", item_name: "BUSH 2421750",    plan_qty: 5000,  actual_qty: 4320,  ng_qty: 110, rework_qty: 80,  achievement_rate: 86 },
  { id: "ws2", year: 2026, week_no: 9, week_range: "2/23~2/28", line: "스트럿라인", item_code: "56170-AA000", item_name: "스트럿폼패드", plan_qty: 25000, actual_qty: 24100, ng_qty: 580, rework_qty: 400, achievement_rate: 96 },
  { id: "ws3", year: 2026, week_no: 9, week_range: "2/23~2/28", line: "방진라인",   item_code: "21832-A9001-B", item_name: "방진AS",    plan_qty: 3800,  actual_qty: 3672,  ng_qty: 195, rework_qty: 195, achievement_rate: 97 },
  { id: "ws4", year: 2026, week_no: 10, week_range: "3/3~3/7",  line: "BUSH라인",   item_code: "2421750", item_name: "BUSH 2421750",    plan_qty: 5000,  actual_qty: 3200,  ng_qty: 47,  rework_qty: 0,   achievement_rate: 64 },
  { id: "ws5", year: 2026, week_no: 10, week_range: "3/3~3/7",  line: "이너씰라인", item_code: "SRG45",  item_name: "이너씰 SRG45",     plan_qty: 10000, actual_qty: 9228,  ng_qty: 2028,rework_qty: 1730,achievement_rate: 92 },
];

// ── 작업지시 모달 ─────────────────────────────────────────────────────────────
function WoModal({ init, onSave, onClose }: {
  init?: WorkOrder; onSave: (w: WorkOrder) => void; onClose: () => void;
}) {
  const blank = (): WorkOrder => ({
    id: uid(), wo_no: `WO-${new Date().toISOString().slice(0,7)}-${String(Math.floor(Math.random()*900)+100)}`,
    item_code: "", item_name: "", customer: "HKMC", line: "BUSH라인",
    planned_qty: 0, actual_qty: 0, ng_qty: 0,
    start_date: new Date().toISOString().slice(0,10),
    due_date: new Date(Date.now()+604800000).toISOString().slice(0,10),
    status: "대기", week: NOW_WEEK, unit_price: 0, remark: "",
  });
  const [f, setF] = useState<WorkOrder>(init ?? blank());
  const set = (k: keyof WorkOrder, v: WorkOrder[keyof WorkOrder]) => setF(p => ({ ...p, [k]: v }));
  return (
    <Modal title={init ? "작업지시 수정" : "신규 작업지시 등록"} onClose={onClose} wide>
      <div className="grid grid-cols-2 gap-3">
        <Fld label="작업지시번호" req><Inp value={f.wo_no} onChange={e => set("wo_no", e.target.value)} /></Fld>
        <Fld label="주차"><Inp value={f.week} onChange={e => set("week", e.target.value)} placeholder="예: 2026-03-1주" /></Fld>
        <Fld label="품목코드" req><Inp value={f.item_code} onChange={e => set("item_code", e.target.value)} /></Fld>
        <Fld label="품목명" req><Inp value={f.item_name} onChange={e => set("item_name", e.target.value)} /></Fld>
        <Fld label="고객사"><Sl v={f.customer} set={v => set("customer", v)} opts={["HKMC","평화산업","SECO AIA","익THK","화성업"].map(x => ({ value: x, label: x }))} /></Fld>
        <Fld label="생산라인"><Sl v={f.line} set={v => set("line", v)} opts={["BUSH라인","스트럿라인","방진라인","이너씰라인","고무류라인"].map(x => ({ value: x, label: x }))} /></Fld>
        <Fld label="계획수량" req><Inp type="number" value={f.planned_qty} onChange={e => set("planned_qty", +e.target.value)} /></Fld>
        <Fld label="단가(원)"><Inp type="number" value={f.unit_price} onChange={e => set("unit_price", +e.target.value)} /></Fld>
        <Fld label="시작일"><Inp type="date" value={f.start_date} onChange={e => set("start_date", e.target.value)} /></Fld>
        <Fld label="납기일" req><Inp type="date" value={f.due_date} onChange={e => set("due_date", e.target.value)} /></Fld>
        <Fld label="상태"><Sl v={f.status} set={v => set("status", v as WorkOrder["status"])} opts={Object.keys(WO_S).map(k => ({ value: k, label: k }))} /></Fld>
        <Fld label="실적수량"><Inp type="number" value={f.actual_qty} onChange={e => set("actual_qty", +e.target.value)} /></Fld>
        <Fld label="불량수량"><Inp type="number" value={f.ng_qty} onChange={e => set("ng_qty", +e.target.value)} /></Fld>
        <div className="col-span-2"><Fld label="비고"><Textarea rows={2} value={f.remark} onChange={e => set("remark", e.target.value)} /></Fld></div>
      </div>
      <SaveBar onSave={() => onSave(f)} onClose={onClose} />
    </Modal>
  );
}

// ── 생산일보 모달 ─────────────────────────────────────────────────────────────
function DailyModal({ wos, onSave, onClose }: {
  wos: WorkOrder[]; onSave: (r: DailyProductionRecord) => void; onClose: () => void;
}) {
  const [f, setF] = useState<DailyProductionRecord>({
    id: uid(), record_date: new Date().toISOString().slice(0,10), shift: "주간",
    line: wos[0]?.line ?? "BUSH라인", wo_no: wos[0]?.wo_no ?? "",
    item_code: wos[0]?.item_code ?? "", item_name: wos[0]?.item_name ?? "",
    plan_qty: 0, actual_qty: 0, ng_qty: 0, workers: 0, operator: "", remark: "",
  });
  const set = (k: keyof DailyProductionRecord, v: DailyProductionRecord[keyof DailyProductionRecord]) =>
    setF(p => ({ ...p, [k]: v }));
  const pickWo = (woNo: string) => {
    const w = wos.find(x => x.wo_no === woNo);
    if (w) setF(p => ({ ...p, wo_no: w.wo_no, item_code: w.item_code, item_name: w.item_name, line: w.line }));
  };
  return (
    <Modal title="생산일보 입력" onClose={onClose} wide>
      <div className="grid grid-cols-2 gap-3">
        <Fld label="생산일" req><Inp type="date" value={f.record_date} onChange={e => set("record_date", e.target.value)} /></Fld>
        <Fld label="시프트"><Sl v={f.shift} set={v => set("shift", v as DailyProductionRecord["shift"])} opts={[{ value: "주간", label: "주간" }, { value: "야간", label: "야간" }]} /></Fld>
        <Fld label="작업지시" req>
          <select value={f.wo_no} onChange={e => pickWo(e.target.value)}
            className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-[11px] text-[#1e2247] outline-none transition focus:border-[#5c6bc0] focus:bg-white">
            <option value="">— 선택 —</option>
            {wos.map(w => <option key={w.id} value={w.wo_no}>{w.wo_no} ({w.item_name})</option>)}
          </select>
        </Fld>
        <Fld label="생산라인"><Inp value={f.line} readOnly className="bg-slate-100 cursor-default" /></Fld>
        <Fld label="품목코드"><Inp value={f.item_code} readOnly className="bg-slate-100 cursor-default" /></Fld>
        <Fld label="품목명"><Inp value={f.item_name} readOnly className="bg-slate-100 cursor-default" /></Fld>
        <Fld label="계획수량" req><Inp type="number" value={f.plan_qty} onChange={e => set("plan_qty", +e.target.value)} /></Fld>
        <Fld label="실적수량" req><Inp type="number" value={f.actual_qty} onChange={e => set("actual_qty", +e.target.value)} /></Fld>
        <Fld label="불량수량"><Inp type="number" value={f.ng_qty} onChange={e => set("ng_qty", +e.target.value)} /></Fld>
        <Fld label="작업인원"><Inp type="number" value={f.workers} onChange={e => set("workers", +e.target.value)} /></Fld>
        <div className="col-span-2"><Fld label="작업자" req><Inp value={f.operator} onChange={e => set("operator", e.target.value)} placeholder="담당 작업자명" /></Fld></div>
        <div className="col-span-2"><Fld label="비고"><Textarea rows={2} value={f.remark} onChange={e => set("remark", e.target.value)} /></Fld></div>
      </div>
      <SaveBar onSave={() => onSave(f)} onClose={onClose} />
    </Modal>
  );
}

// ── 작업인원 배치 모달 ────────────────────────────────────────────────────────
function WorkerModal({ onSave, onClose }: { onSave: (w: WorkerAssignment) => void; onClose: () => void }) {
  const [f, setF] = useState<WorkerAssignment>({
    id: uid(), assign_date: new Date().toISOString().slice(0,10),
    line: "BUSH라인", standard_workers: 7, assigned_workers: 0, operator_names: "", remarks: "",
  });
  const set = (k: keyof WorkerAssignment, v: WorkerAssignment[keyof WorkerAssignment]) =>
    setF(p => ({ ...p, [k]: v }));
  return (
    <Modal title="작업인원 배치 입력" onClose={onClose}>
      <div className="space-y-3">
        <Fld label="날짜" req><Inp type="date" value={f.assign_date} onChange={e => set("assign_date", e.target.value)} /></Fld>
        <Fld label="생산라인" req>
          <Sl v={f.line} set={v => set("line", v)} opts={["BUSH라인","스트럿라인","방진라인","이너씰라인","고무류라인"].map(x => ({ value: x, label: x }))} />
        </Fld>
        <div className="grid grid-cols-2 gap-3">
          <Fld label="표준인원"><Inp type="number" value={f.standard_workers} onChange={e => set("standard_workers", +e.target.value)} /></Fld>
          <Fld label="실배치인원" req><Inp type="number" value={f.assigned_workers} onChange={e => set("assigned_workers", +e.target.value)} /></Fld>
        </div>
        <Fld label="작업자명 (콤마 구분)" req><Textarea rows={3} value={f.operator_names} onChange={e => set("operator_names", e.target.value)} placeholder="홍길동, 김철수, 이영희, ..." /></Fld>
        <Fld label="비고"><Textarea rows={2} value={f.remarks ?? ""} onChange={e => set("remarks", e.target.value)} /></Fld>
      </div>
      <SaveBar onSave={() => onSave(f)} onClose={onClose} />
    </Modal>
  );
}

// ── 작업지시 현황 페이지 콘텐츠 ───────────────────────────────────────────────
function WoPage({ wos, setWos }: { wos: WorkOrder[]; setWos: React.Dispatch<React.SetStateAction<WorkOrder[]>> }) {
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(false);
  const [editWo, setEditWo] = useState<WorkOrder | undefined>();

  const filtWo = useMemo(() => wos.filter(w => {
    const s = q.toLowerCase();
    return !s || w.wo_no.toLowerCase().includes(s) || w.item_name.toLowerCase().includes(s) || w.customer.toLowerCase().includes(s);
  }), [wos, q]);

  const stats = useMemo(() => ({
    total: wos.length,
    done: wos.filter(w => w.status === "완료").length,
    inProd: wos.filter(w => w.status === "생산중").length,
    delayed: wos.filter(w => w.status === "지연").length,
    planQty: wos.reduce((a, w) => a + w.planned_qty, 0),
    actualQty: wos.reduce((a, w) => a + w.actual_qty, 0),
  }), [wos]);

  return (
    <div className="space-y-5">
      {stats.delayed > 0 && <AlertBanner msg={`지연 작업지시 ${stats.delayed}건 — 생산 일정 즉시 확인 필요`} />}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatC label="전체 지시" value={stats.total} unit="건" />
        <StatC label="생산중" value={stats.inProd} unit="건" />
        <StatC label="지연" value={stats.delayed} unit="건" warn={stats.delayed > 0} />
        <StatC label="달성률" value={fp(stats.actualQty, stats.planQty)} unit="%" sub={`${fc(stats.actualQty)} / ${fc(stats.planQty)} EA`} />
      </div>

      <div className="flex items-center justify-between gap-3">
        <Srch v={q} set={setQ} ph="작업지시번호, 품목명, 고객사 검색" />
        <div className="flex items-center gap-2 shrink-0">
          <Btn v="secondary" icon={<Download size={12} />}>엑셀</Btn>
          <Btn v="primary" icon={<Plus size={12} />} onClick={() => { setEditWo(undefined); setModal(true); }}>작업지시 등록</Btn>
        </div>
      </div>

      <Tbl cols={["작업지시번호", "주차", "품목코드", "품목명", "고객사", "라인", "계획↓", "실적↓", "불량↓", "달성률", "시작일", "납기일", "상태", ""]}>
        {filtWo.length === 0 ? <NoRow n={14} /> : filtWo.map(w => {
          const s = WO_S[w.status] ?? { l: w.status, c: "gray" };
          const delayed = w.status === "지연" || (w.status !== "완료" && w.due_date < new Date().toISOString().slice(0,10));
          return (
            <TR key={w.id}>
              <TD mono>{w.wo_no}</TD>
              <TD muted>{w.week}</TD>
              <TD mono>{w.item_code}</TD>
              <TD bold>{w.item_name}</TD>
              <TD muted>{w.customer}</TD>
              <TD muted>{w.line}</TD>
              <TD r>{fc(w.planned_qty)}</TD>
              <TD r bold>{fc(w.actual_qty)}</TD>
              <td className="px-3 py-2 text-right tabular-nums font-bold text-red-500" style={{ fontSize: 11 }}>{fc(w.ng_qty)}</td>
              <td className="px-3 py-2"><PBar a={w.actual_qty} b={w.planned_qty} c={fp(w.actual_qty, w.planned_qty) >= 100 ? "green" : "indigo"} /></td>
              <TD muted>{w.start_date}</TD>
              <td className={`px-3 py-2 ${delayed ? "font-bold text-red-500" : "text-slate-400"}`} style={{ fontSize: 11 }}>{w.due_date}</td>
              <td className="px-3 py-2"><Badge l={s.l} c={s.c} /></td>
              <td className="px-3 py-2">
                <button onClick={() => { setEditWo(w); setModal(true); }} className="text-[#5c6bc0] hover:underline" style={{ fontSize: 10 }}>수정</button>
              </td>
            </TR>
          );
        })}
      </Tbl>

      {modal && (
        <WoModal init={editWo} onClose={() => setModal(false)} onSave={w => {
          setWos(p => editWo ? p.map(x => x.id === w.id ? w : x) : [w, ...p]);
          setModal(false);
        }} />
      )}
    </div>
  );
}

// ── 생산 일보·투입시간 페이지 (PPT Slide 5: 2월 4주차 투입시간) ───────────────
function DailyPage({ wos, daily, setDaily }: {
  wos: WorkOrder[]; daily: DailyProductionRecord[];
  setDaily: React.Dispatch<React.SetStateAction<DailyProductionRecord[]>>;
}) {
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(false);

  const filtDaily = useMemo(() => daily.filter(d => {
    const s = q.toLowerCase();
    return !s || d.wo_no.toLowerCase().includes(s) || d.item_name.toLowerCase().includes(s) || d.line.toLowerCase().includes(s);
  }), [daily, q]);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
        <p className="mb-2 font-bold text-sky-800" style={{ fontSize: 12 }}>□ 2월 4주차 투입시간 관리 (PPT 기준)</p>
        <div className="flex flex-wrap gap-4">
          <StatC label="주간 계획" value={INPUT_HOURS.dayShift.plan} unit="h" />
          <StatC label="주간 실적" value={INPUT_HOURS.dayShift.actual} unit="h" />
          <StatC label="주간 달성률" value={INPUT_HOURS.dayShift.rate} unit="%" />
          <StatC label="야간 계획" value={INPUT_HOURS.nightShift.plan} unit="h" />
          <StatC label="야간 실적" value={INPUT_HOURS.nightShift.actual} unit="h" />
          <StatC label="야간 달성률" value={INPUT_HOURS.nightShift.rate} unit="%" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatC label="입력 건수" value={daily.length} unit="건" />
        <StatC label="계획 합계" value={fc(daily.reduce((a,d)=>a+d.plan_qty,0))} unit="EA" />
        <StatC label="실적 합계" value={fc(daily.reduce((a,d)=>a+d.actual_qty,0))} unit="EA" />
        <StatC label="불량 합계" value={fc(daily.reduce((a,d)=>a+d.ng_qty,0))} unit="EA" warn />
      </div>

      <div className="flex items-center justify-between gap-3">
        <Srch v={q} set={setQ} ph="지시번호, 품목명, 라인 검색" />
        <div className="flex items-center gap-2 shrink-0">
          <Btn v="secondary" icon={<Download size={12} />}>엑셀</Btn>
          <Btn v="primary" icon={<Plus size={12} />} onClick={() => setModal(true)}>일보 입력</Btn>
        </div>
      </div>

      <Tbl cols={["날짜", "시프트", "라인", "작업지시번호", "품목명", "계획↓", "실적↓", "불량↓", "불량률↓", "인원↓", "작업자", "비고"]}>
        {filtDaily.length === 0 ? <NoRow n={12} /> : filtDaily.map(d => (
          <TR key={d.id}>
            <TD muted>{d.record_date}</TD>
            <td className="px-3 py-2"><Badge l={d.shift} c={d.shift === "주간" ? "blue" : "purple"} /></td>
            <TD muted>{d.line}</TD>
            <TD mono>{d.wo_no}</TD>
            <TD bold>{d.item_name}</TD>
            <TD r>{fc(d.plan_qty)}</TD>
            <TD r bold>{fc(d.actual_qty)}</TD>
            <td className="px-3 py-2 text-right tabular-nums text-red-500 font-bold" style={{fontSize:11}}>{fc(d.ng_qty)}</td>
            <td className="px-3 py-2 text-right tabular-nums font-semibold text-[#1e2247]" style={{fontSize:11}}>
              {d.actual_qty ? (d.ng_qty / d.actual_qty * 100).toFixed(2) + "%" : "—"}
            </td>
            <TD r>{d.workers}명</TD>
            <TD muted>{d.operator}</TD>
            <TD muted cls="max-w-32 truncate">{d.remark || "—"}</TD>
          </TR>
        ))}
      </Tbl>

      {modal && (
        <DailyModal wos={wos} onClose={() => setModal(false)} onSave={r => {
          setDaily(p => [r, ...p]);
          setModal(false);
        }} />
      )}
    </div>
  );
}

// ── 작업인원 배치 페이지 콘텐츠 (PPT Slide 5: 인력 운영 현황) ─────────────────
function WorkerPage({ workers, setWorkers }: {
  workers: WorkerAssignment[];
  setWorkers: React.Dispatch<React.SetStateAction<WorkerAssignment[]>>;
}) {
  const [modal, setModal] = useState(false);
  const stats = useMemo(() => {
    const total = workers.reduce((a, w) => a + w.standard_workers, 0);
    const assigned = workers.reduce((a, w) => a + w.assigned_workers, 0);
    return { total, assigned, shortage: total - assigned };
  }, [workers]);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
        <p className="mb-2 font-bold text-indigo-800" style={{ fontSize: 12 }}>□ 인력 운영 현황 (PPT 02월 04주차)</p>
        <div className="flex flex-wrap items-center gap-4">
          <StatC label="계획인원" value={LABOR_STATUS.plan} unit="명" />
          <StatC label="투입인원" value={LABOR_STATUS.actual} unit="명" />
          <StatC label="담당자" value={RESPONSIBLES.productionManager} unit="" />
          <p className="text-indigo-700" style={{ fontSize: 10 }}>생산 {RESPONSIBLES.productionLeader}, 검사 {RESPONSIBLES.qualityLeader}</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <StatC label="표준 총인원" value={stats.total} unit="명" />
        <StatC label="실배치 인원" value={stats.assigned} unit="명" />
        <StatC label="인원 부족" value={stats.shortage} unit="명" warn={stats.shortage > 0} />
      </div>

      <div className="flex justify-end">
        <Btn v="primary" icon={<Plus size={12} />} onClick={() => setModal(true)}>인원배치 입력</Btn>
      </div>

      <Tbl cols={["날짜", "라인", "표준인원↓", "실배치↓", "인원현황", "작업자", "비고", ""]}>
        {workers.length === 0 ? <NoRow n={8} /> : workers.map(w => {
          const shortage = w.standard_workers - w.assigned_workers;
          return (
            <TR key={w.id}>
              <TD muted>{w.assign_date}</TD>
              <TD bold>{w.line}</TD>
              <TD r>{w.standard_workers}명</TD>
              <TD r>{w.assigned_workers}명</TD>
              <td className="px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="h-1.5 w-20 overflow-hidden rounded-full bg-[#eef1f8]">
                    <div className={`h-full rounded-full ${shortage > 0 ? "bg-amber-400" : "bg-[#5c6bc0]"}`}
                      style={{ width: `${fp(w.assigned_workers, w.standard_workers)}%` }} />
                  </div>
                  <span className="tabular-nums text-slate-500" style={{ fontSize: 10 }}>
                    {fp(w.assigned_workers, w.standard_workers)}%
                    {shortage > 0 && <span className="ml-1 text-amber-500">(-{shortage})</span>}
                  </span>
                </div>
              </td>
              <TD muted cls="max-w-48 truncate">{w.operator_names}</TD>
              <TD muted>{w.remarks || "—"}</TD>
              <td className="px-3 py-2">
                <button className="text-[#5c6bc0] hover:underline" style={{ fontSize: 10 }}>수정</button>
              </td>
            </TR>
          );
        })}
      </Tbl>

      {modal && (
        <WorkerModal onClose={() => setModal(false)} onSave={w => {
          setWorkers(p => [w, ...p]);
          setModal(false);
        }} />
      )}
    </div>
  );
}

// ── 주간 생산 집계 페이지 콘텐츠 ─────────────────────────────────────────────
function WeeklyPage({ weekly }: { weekly: WeeklySummary[] }) {
  const [selWk, setSelWk] = useState("전체");
  const wkNos = useMemo(() => ["전체", ...Array.from(new Set(weekly.map(w => `${w.year}-${w.week_no}주`)))], [weekly]);
  const filtWeekly = useMemo(() =>
    weekly.filter(w => selWk === "전체" || `${w.year}-${w.week_no}주` === selWk), [weekly, selWk]);
  const wkStats = useMemo(() => ({
    plan: filtWeekly.reduce((a, w) => a + w.plan_qty, 0),
    actual: filtWeekly.reduce((a, w) => a + w.actual_qty, 0),
    ng: filtWeekly.reduce((a, w) => a + w.ng_qty, 0),
    rework: filtWeekly.reduce((a, w) => a + w.rework_qty, 0),
  }), [filtWeekly]);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <span className="text-slate-500 font-medium" style={{ fontSize: 11 }}>주차 선택:</span>
        {wkNos.map(w => (
          <button key={w} onClick={() => setSelWk(w)}
            className={`h-7 rounded-full px-3 font-medium transition-all ${selWk === w ? "bg-[#5c6bc0] text-white shadow-sm" : "border border-[#e8eaf0] bg-white text-slate-500 hover:text-[#1e2247]"}`}
            style={{ fontSize: 11 }}>{w}</button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatC label="계획 수량" value={fc(wkStats.plan)} unit="EA" />
        <StatC label="실적 수량" value={fc(wkStats.actual)} unit="EA" />
        <StatC label="불량 수량" value={fc(wkStats.ng)} unit="EA" warn={wkStats.ng > 0} />
        <StatC label="주간 달성률" value={fp(wkStats.actual, wkStats.plan)} unit="%" />
      </div>

      <Tbl cols={["연도", "주차", "주간범위", "라인", "품목코드", "품목명", "계획↓", "실적↓", "불량↓", "리워크↓", "달성률↓"]}>
        {filtWeekly.length === 0 ? <NoRow n={11} /> : filtWeekly.map(w => (
          <TR key={w.id}>
            <TD muted>{w.year}</TD>
            <TD muted>{w.week_no}주</TD>
            <TD muted>{w.week_range}</TD>
            <TD>{w.line}</TD>
            <TD mono>{w.item_code}</TD>
            <TD bold>{w.item_name}</TD>
            <TD r>{fc(w.plan_qty)}</TD>
            <TD r bold>{fc(w.actual_qty)}</TD>
            <td className="px-3 py-2 text-right tabular-nums font-bold text-red-500" style={{fontSize:11}}>{fc(w.ng_qty)}</td>
            <td className="px-3 py-2 text-right tabular-nums font-semibold text-amber-500" style={{fontSize:11}}>{fc(w.rework_qty)}</td>
            <td className="px-3 py-2">
              <span className={`font-bold tabular-nums ${w.achievement_rate >= 95 ? "text-emerald-600" : w.achievement_rate >= 80 ? "text-[#5c6bc0]" : "text-red-500"}`} style={{fontSize:12}}>
                {w.achievement_rate}%
              </span>
            </td>
          </TR>
        ))}
      </Tbl>

      <div className="rounded-2xl border border-[#e8eaf0] bg-white p-5 shadow-sm">
        <p className="mb-4 font-semibold text-[#1e2247]" style={{ fontSize: 12 }}>종합 집계</p>
        <div className="grid grid-cols-5 gap-4">
          {[
            { l: "총 계획", v: fc(wkStats.plan) + " EA" },
            { l: "총 실적", v: fc(wkStats.actual) + " EA" },
            { l: "총 불량", v: fc(wkStats.ng) + " EA" },
            { l: "총 리워크", v: fc(wkStats.rework) + " EA" },
            { l: "종합 달성률", v: fp(wkStats.actual, wkStats.plan) + "%" },
          ].map(k => (
            <div key={k.l} className="text-center">
              <p className="text-slate-400" style={{ fontSize: 9 }}>{k.l}</p>
              <p className="mt-1 font-bold tabular-nums text-[#1e2247]" style={{ fontSize: 18 }}>{k.v}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 도포실 페이지 (PPT Slide 11: 3월 도포실 예상계획) ─────────────────────────
function CoatingPage() {
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="mb-2 font-bold text-amber-800" style={{ fontSize: 12 }}>□ 3월 도포실 예상계획</p>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatC label="3월 필요원 (주간)" value={COATING_ROOM.marchNeed.day} unit="명" />
          <StatC label="3월 필요원 (야간)" value={COATING_ROOM.marchNeed.night} unit="명" />
          <StatC label="사내 도포금액" value={`${Math.round(COATING_ROOM.inhouse/10000)}만`} unit="원" />
          <StatC label="대영 도포금액" value={`${Math.round(COATING_ROOM.daeyoung/10000)}만`} unit="원" />
        </div>
        <p className="mt-2 text-amber-700" style={{ fontSize: 10 }}>(대영 전처리비 {fc(COATING_ROOM.daeyoungPreprocess)}원)</p>
      </div>
      <Tbl cols={["구분", "금액(원)", "비고"]}>
        <TR><TD bold>사내 도포</TD><TD r>{fc(COATING_ROOM.inhouse)}</TD><TD muted>3월 연동</TD></TR>
        <TR><TD bold>대영 도포</TD><TD r>{fc(COATING_ROOM.daeyoung)}</TD><TD muted>전처리비 {fc(COATING_ROOM.daeyoungPreprocess)} 포함</TD></TR>
      </Tbl>
      <p className="text-slate-500" style={{ fontSize: 11 }}>※ PPT 주간회의 26년 02월 04주차 기준</p>
    </div>
  );
}

// ── 메인 컴포넌트 (코딩계획서 v1.0: 4탭) ─────────────────────────────────────
export interface ProductionSectionProps {
  onDataChange?: (data: { wos: WorkOrder[]; daily: DailyProductionRecord[]; weekly: WeeklySummary[] }) => void;
}

export default function ProductionSection({ onDataChange: _onDataChange }: ProductionSectionProps) {
  const [openPage, setOpenPage] = useState<"wo" | "daily" | "worker" | "weekly" | "coating" | null>(null);
  const [wos, setWos] = useState<WorkOrder[]>(INIT_WO);
  const [daily, setDaily] = useState<DailyProductionRecord[]>(INIT_DAILY);
  const [workers, setWorkers] = useState<WorkerAssignment[]>(INIT_WORKER);
  const [weekly] = useState<WeeklySummary[]>(INIT_WEEKLY);

  const delayed = wos.filter(w => w.status === "지연").length;
  const workerShortage = workers.reduce((a, w) => a + (w.standard_workers - w.assigned_workers), 0);

  const cards: LandingCardDef[] = [
    { key: "weekly", label: "주차별 실적", desc: "공정별 주·야간 계획·실적·달성률, 불량·리워크 집계.", Icon: TrendingUp, count: weekly.length, extra: weekly[weekly.length - 1]?.week_range ?? "—", color: "#059669" },
    { key: "worker", label: "인력 운영", desc: "라인별 표준/실배치 인원, 특이사항 관리.", Icon: Users, count: workers.length, alert: workerShortage > 0 ? workerShortage : undefined, color: "#7c3aed" },
    { key: "daily", label: "투입시간", desc: "일별 시프트별 생산 실적, 불량률 모니터링.", Icon: BarChart2, count: daily.length, color: "#0891b2" },
    { key: "coating", label: "도포실", desc: "사내/대영 도포 금액 비교 (PPT 02월 04주차).", Icon: ClipboardList, count: 1, color: "#5c6bc0" },
    { key: "wo", label: "작업지시", desc: "생산 계획 대비 실적, 지연 현황.", Icon: ClipboardList, count: wos.length, alert: delayed, color: "#0d7f8a" },
  ];

  const pageTitle: Record<string, string> = {
    weekly: "주차별 실적",
    worker: "인력 운영",
    daily: "투입시간",
    coating: "도포실",
    wo: "작업지시 현황",
  };

  const getExcelData = (): { data: ExcelRow[]; headers: Record<string, string>; filename: string } => {
    switch (openPage) {
      case "wo": return {
        data: wos as unknown as ExcelRow[],
        headers: { "작업지시번호": "wo_no", "주차": "week", "품목코드": "item_code", "품목명": "item_name", "고객사": "customer", "라인": "line", "계획수량": "planned_qty", "실적수량": "actual_qty", "불량수량": "ng_qty", "단가": "unit_price", "시작일": "start_date", "납기일": "due_date", "상태": "status", "비고": "remark" },
        filename: "작업지시현황",
      };
      case "daily": return {
        data: daily as unknown as ExcelRow[],
        headers: { "날짜": "record_date", "시프트": "shift", "라인": "line", "지시번호": "wo_no", "품목명": "item_name", "계획": "plan_qty", "실적": "actual_qty", "불량": "ng_qty", "인원": "workers", "작업자": "operator", "비고": "remark" },
        filename: "생산일보",
      };
      case "worker": return {
        data: workers as unknown as ExcelRow[],
        headers: { "날짜": "assign_date", "라인": "line", "표준인원": "standard_workers", "실배치인원": "assigned_workers", "작업자": "operator_names", "비고": "remarks" },
        filename: "작업인원배치",
      };
      case "weekly": return {
        data: weekly as unknown as ExcelRow[],
        headers: { "연도": "year", "주차": "week_no", "기간": "week_range", "라인": "line", "품목코드": "item_code", "품목명": "item_name", "계획": "plan_qty", "실적": "actual_qty", "불량": "ng_qty", "리워크": "rework_qty", "달성률": "achievement_rate" },
        filename: "주차별실적",
      };
      case "coating": return {
        data: [{ inhouse: COATING_ROOM.inhouse, daeyoung: COATING_ROOM.daeyoung }] as unknown as ExcelRow[],
        headers: { "사내금액": "inhouse", "대영금액": "daeyoung" },
        filename: "도포실_사내대영비교",
      };
      default: return { data: [], headers: {}, filename: "export" };
    }
  };

  const excelInfo = getExcelData();

  const handleImport = (rows: ExcelRow[]) => {
    if (openPage === "wo") {
      const mapped = rows.map(r => ({
        id: uid(), wo_no: String(r["작업지시번호"] ?? r["wo_no"] ?? ""),
        item_code: String(r["품목코드"] ?? r["item_code"] ?? ""),
        item_name: String(r["품목명"] ?? r["item_name"] ?? ""),
        customer: String(r["고객사"] ?? r["customer"] ?? "HKMC"),
        line: String(r["라인"] ?? r["line"] ?? "BUSH라인"),
        planned_qty: Number(r["계획수량"] ?? r["planned_qty"] ?? 0),
        actual_qty: Number(r["실적수량"] ?? r["actual_qty"] ?? 0),
        ng_qty: Number(r["불량수량"] ?? r["ng_qty"] ?? 0),
        start_date: String(r["시작일"] ?? r["start_date"] ?? ""),
        due_date: String(r["납기일"] ?? r["due_date"] ?? ""),
        status: String(r["상태"] ?? r["status"] ?? "대기") as WorkOrder["status"],
        week: String(r["주차"] ?? r["week"] ?? NOW_WEEK),
        unit_price: Number(r["단가"] ?? r["unit_price"] ?? 0),
        remark: String(r["비고"] ?? r["remark"] ?? ""),
      }));
      setWos(p => [...mapped, ...p]);
    }
  };

  return (
    <div>
      <SectionLanding
        title="생산관리"
        sub="주차별 실적 · 인력 운영 · 투입시간 · 도포실"
        cards={cards}
        onOpen={k => setOpenPage(k as typeof openPage)}
      />

      {openPage && (
        <PageModal
          title={pageTitle[openPage]}
          section="생산 관리"
          onClose={() => setOpenPage(null)}
          actions={
            <div id={`prod-print-${openPage}`} className="flex items-center gap-1.5">
              <ExcelImportBtn
                onImport={handleImport}
                templateHeaders={Object.keys(excelInfo.headers)}
                templateFilename={`${excelInfo.filename}_양식`}
              />
              <ExcelExportBtn data={excelInfo.data} options={{ filename: excelInfo.filename, sheetName: pageTitle[openPage], headers: excelInfo.headers }} />
              <PrintBtn title={pageTitle[openPage]} printId={`prod-content-${openPage}`} />
            </div>
          }
        >
          <div id={`prod-content-${openPage}`}>
            {openPage === "wo"      && <WoPage wos={wos} setWos={setWos} />}
            {openPage === "daily"  && <DailyPage wos={wos} daily={daily} setDaily={setDaily} />}
            {openPage === "worker" && <WorkerPage workers={workers} setWorkers={setWorkers} />}
            {openPage === "weekly" && <WeeklyPage weekly={weekly} />}
            {openPage === "coating" && <CoatingPage />}
          </div>
        </PageModal>
      )}
    </div>
  );
}
