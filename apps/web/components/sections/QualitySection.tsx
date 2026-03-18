"use client";
// ─── 품질 관리 섹션 (코딩계획서 v1.0) ────────────────────────────────────────
// 종합·BUSH·이너씰·댐퍼/혼플레이트·순고무·리워크·고객사 이슈

import { useState, useMemo } from "react";
import { Plus, ShieldCheck, AlertTriangle, RefreshCcw, Cog, Layers, CircleDot, Wind, FileWarning } from "lucide-react";
import {
  Badge, Btn, Fld, Inp, Sl, Textarea, Modal, Srch, Tabs,
  Tbl, TR, TD, NoRow, StatC, AlertBanner, SaveBar, uid,
  fc, fp, PageModal, SectionLanding, ExcelExportBtn, PrintBtn,
  type LandingCardDef, type ExcelRow,
} from "./shared";
import type { QualityWeeklyTask, ProcessDefect, ReworkRecord } from "./types";
import { PPM_CARDS, BUSH_DRILLDOWN, DASHBOARD_KPIS } from "@/lib/fact-plan-data";

const DEF_STATUS: Record<string, { l: string; c: string }> = {
  발생:     { l: "발생",     c: "red" },
  원인조사: { l: "원인조사", c: "amber" },
  조치완료: { l: "조치완료", c: "blue" },
  모니터링: { l: "모니터링", c: "green" },
};
const TASK_STATUS: Record<string, { l: string; c: string }> = {
  미완료: { l: "미완료", c: "red" },
  진행중: { l: "진행중", c: "amber" },
  완료:   { l: "완료",   c: "green" },
};

const THIS_WEEK = "2026-03-1주";

const INIT_TASKS: QualityWeeklyTask[] = [
  { id: "qt1", week: THIS_WEEK, team: "화성작업팀", task_type: "화성작업",
    plan_task: "NX5 신규 2호 ALL TOOL 교체", plan_assignee: "김대상", plan_due: "2026-03-11",
    actual_task: "작업 준비 중 — 생산 TOOL 교체 준비 완료", actual_assignee: "김대상", actual_due: "2026-03-11",
    customer_issue: "", defect_count: 0, status: "진행중" },
  { id: "qt2", week: THIS_WEEK, team: "이슈팀", task_type: "이슈",
    plan_task: "모듈퍼 품질문제 관련 공정서류 — 코모스 생산 신규 3/5", plan_assignee: "이슈팀", plan_due: "2026-03-05",
    actual_task: "아메가프레임 종료 (HMC 고불량 기록)", actual_assignee: "이슈팀", actual_due: "2026-03-05",
    customer_issue: "NG 마스터 제작 → 체크시트 요청 [3/6 완료]", defect_count: 0, status: "완료" },
  { id: "qt3", week: THIS_WEEK, team: "프레임팀", task_type: "프레임",
    plan_task: "SEAL RUBBER 리크 불량 리워크 작업 — 프레임 생산 완성 3/5", plan_assignee: "프레임팀", plan_due: "2026-03-05",
    actual_task: "SEAL RUBBER 리크 불량 리워크 완성 3/12", actual_assignee: "프레임팀", actual_due: "2026-03-12",
    customer_issue: "리크 불량 분해 작업 (2,480ea 중 984 교체) → 차주 완료 요청", defect_count: 2480, status: "진행중" },
  { id: "qt4", week: THIS_WEEK, team: "인증팀", task_type: "인증",
    plan_task: "ISO9001/14001 인증 사후 조사 — 더먼서트 신규 3/3", plan_assignee: "인증팀", plan_due: "2026-03-03",
    actual_task: "SQ 지적 지도사항 개선계획서 완성 신규 3/13", actual_assignee: "인증팀", actual_due: "2026-03-13",
    customer_issue: "지도사항 15건 계획서 수립", defect_count: 0, status: "완료" },
];

const INIT_DEFECTS: ProcessDefect[] = [
  { id: "pd1",  week: THIS_WEEK, week_no: 3, category: "BUSH",        item_no: "2421750",      inspected_qty: 24000,  defect_qty: 47,   defect_amount: 59925,   ppm: 1956,  main_cause: "금형 코어 이상",         action: "금형 수리",      assignee: "품질팀",  action_due: "2026-03-10", status: "원인조사" },
  { id: "pd2",  week: THIS_WEEK, week_no: 3, category: "BUSH",        item_no: "2421760",      inspected_qty: 16758,  defect_qty: 185,  defect_amount: 204055,  ppm: 11034, main_cause: "기포불량 — 러버/재료문제",action: "배합조건 변경",  assignee: "생산팀", action_due: "2026-03-07", status: "조치완료" },
  { id: "pd3",  week: THIS_WEEK, week_no: 3, category: "BUSH",        item_no: "2421780",      inspected_qty: 20126,  defect_qty: 149,  defect_amount: 208004,  ppm: 7405,  main_cause: "착불량",                 action: "금형 점검",      assignee: "생산팀", action_due: "2026-03-14", status: "발생" },
  { id: "pd4",  week: THIS_WEEK, week_no: 3, category: "스트럿폼패드",item_no: "56170-AA000",  inspected_qty: 4909,   defect_qty: 10,   defect_amount: 20940,   ppm: 2037,  main_cause: "압력 불균일",            action: "공정조건 조정",  assignee: "공정팀", action_due: "2026-03-10", status: "모니터링" },
  { id: "pd5",  week: THIS_WEEK, week_no: 3, category: "스트럿폼패드",item_no: "56170-L8500",  inspected_qty: 591,    defect_qty: 8,    defect_amount: 18208,   ppm: 13536, main_cause: "고무 손상 — 원인 파악중",action: "원인분석",       assignee: "품질팀", action_due: "2026-03-12", status: "원인조사" },
  { id: "pd6",  week: THIS_WEEK, week_no: 1, category: "스플라이너",  item_no: "21832-A9001-B",inspected_qty: 3672,   defect_qty: 71,   defect_amount: 284000,  ppm: 19336, main_cause: "조립불량",               action: "작업표준 보강",  assignee: "품질팀", action_due: "2026-03-08", status: "조치완료" },
  { id: "pd7",  week: THIS_WEEK, week_no: 1, category: "이너씰",      item_no: "SRG45",        inspected_qty: 9228,   defect_qty: 2028, defect_amount: 2074644, ppm: 219766,main_cause: "치수 불량",              action: "금형 수정",      assignee: "기술팀", action_due: "2026-03-07", status: "원인조사" },
  { id: "pd8",  week: THIS_WEEK, week_no: 1, category: "이너씰",      item_no: "SRG45L",       inspected_qty: 8480,   defect_qty: 2260, defect_amount: 3152700, ppm: 266509,main_cause: "치수 불량",              action: "금형 수정",      assignee: "기술팀", action_due: "2026-03-07", status: "원인조사" },
  { id: "pd9",  week: THIS_WEEK, week_no: 2, category: "고무류",      item_no: "RB09Z1",       inspected_qty: 10146,  defect_qty: 3146, defect_amount: 213928,  ppm: 310073,main_cause: "금형 불량",              action: "금형 교체",      assignee: "생산팀", action_due: "2026-03-10", status: "발생" },
  { id: "pd10", week: THIS_WEEK, week_no: 2, category: "고무류",      item_no: "RB00GS",       inspected_qty: 44688,  defect_qty: 8688, defect_amount: 173760,  ppm: 194415,main_cause: "성형 불량",              action: "원인분석 중",    assignee: "품질팀", action_due: "2026-03-14", status: "원인조사" },
];

const INIT_REWORK: ReworkRecord[] = [
  { id: "r1", week: THIS_WEEK, category: "이너씰",      item_no: "SRG35",       month1_qty: 207,  month1_amount: 169326,  month2_qty: 139,  month2_amount: 113702,  total_qty: 346,  total_amount: 283028,  reason: "치수 불량 리워크",     assignee: "조덕현" },
  { id: "r2", week: THIS_WEEK, category: "이너씰",      item_no: "SRG45",       month1_qty: 487,  month1_amount: 498201,  month2_qty: 1243, month2_amount: 1271589, total_qty: 1730, total_amount: 1769790, reason: "치수 불량 리워크",     assignee: "조덕현" },
  { id: "r3", week: THIS_WEEK, category: "이너씰",      item_no: "SRG45L",      month1_qty: 1704, month1_amount: 2377080, month2_qty: 2445, month2_amount: 3410775, total_qty: 4149, total_amount: 5787855, reason: "치수 불량 리워크",     assignee: "조덕현" },
  { id: "r4", week: THIS_WEEK, category: "스트럿폼패드",item_no: "56170-L8500", month1_qty: 0,    month1_amount: 0,       month2_qty: 984,  month2_amount: 1230000, total_qty: 984,  total_amount: 1230000, reason: "리크 불량 분해 리워크", assignee: "이슈팀" },
];

// ── 주간 품질보고 ─────────────────────────────────────────────────────────────
function QualWeeklyPage({ tasks, setTasks }: { tasks: QualityWeeklyTask[]; setTasks: React.Dispatch<React.SetStateAction<QualityWeeklyTask[]>> }) {
  const [modal, setModal] = useState(false);
  const [f, setF] = useState<QualityWeeklyTask>({
    id: uid(), week: THIS_WEEK, team: "품질팀", task_type: "이슈",
    plan_task: "", plan_assignee: "", plan_due: new Date().toISOString().slice(0,10),
    actual_task: "", actual_assignee: "", actual_due: "",
    customer_issue: "", defect_count: 0, status: "미완료",
  });

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatC label="총 업무" value={tasks.length} unit="건" />
        <StatC label="완료" value={tasks.filter(t => t.status === "완료").length} unit="건" />
        <StatC label="진행중" value={tasks.filter(t => t.status === "진행중").length} unit="건" />
        <StatC label="미완료" value={tasks.filter(t => t.status === "미완료").length} unit="건" warn={tasks.some(t => t.status === "미완료")} />
      </div>
      <div className="flex justify-end">
        <Btn v="primary" icon={<Plus size={12} />} onClick={() => setModal(true)}>업무 등록</Btn>
      </div>
      <Tbl cols={["팀", "업무유형", "금주 계획 업무", "담당", "계획완료일", "실적 결과", "담당", "완료일", "고객이슈", "상태", "변경"]}>
        {tasks.length === 0 ? <NoRow n={11} /> : tasks.map(t => {
          const st = TASK_STATUS[t.status] ?? { l: t.status, c: "gray" };
          return (
            <TR key={t.id}>
              <TD bold>{t.team}</TD>
              <td className="px-3 py-2"><Badge l={t.task_type} c="blue" /></td>
              <td className="max-w-52 px-3 py-2 text-[#1e2247]" style={{ fontSize: 11 }}>{t.plan_task}</td>
              <TD muted>{t.plan_assignee}</TD>
              <TD muted>{t.plan_due}</TD>
              <td className="max-w-52 px-3 py-2 text-slate-500" style={{ fontSize: 11 }}>{t.actual_task || "—"}</td>
              <TD muted>{t.actual_assignee || "—"}</TD>
              <TD muted>{t.actual_due || "—"}</TD>
              <td className="max-w-44 px-3 py-2 text-slate-500" style={{ fontSize: 10 }}>{t.customer_issue || "—"}</td>
              <td className="px-3 py-2"><Badge l={st.l} c={st.c} /></td>
              <td className="px-3 py-2">
                <select value={t.status}
                  onChange={e => setTasks(p => p.map(x => x.id === t.id ? { ...x, status: e.target.value as QualityWeeklyTask["status"] } : x))}
                  className="h-6 rounded-lg border border-[#e8eaf0] bg-white px-1.5 text-[10px] text-[#1e2247] outline-none">
                  {["미완료", "진행중", "완료"].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </td>
            </TR>
          );
        })}
      </Tbl>
      {modal && (
        <Modal title="주간 품질업무 등록" onClose={() => setModal(false)} wide>
          <div className="grid grid-cols-2 gap-3">
            <Fld label="주차"><Inp value={f.week} onChange={e => setF(p => ({ ...p, week: e.target.value }))} /></Fld>
            <Fld label="팀명" req><Inp value={f.team} onChange={e => setF(p => ({ ...p, team: e.target.value }))} /></Fld>
            <Fld label="업무유형">
              <Sl v={f.task_type} set={v => setF(p => ({ ...p, task_type: v as QualityWeeklyTask["task_type"] }))}
                opts={["화성작업","이슈","프레임","인증"].map(x => ({ value: x, label: x }))} />
            </Fld>
            <Fld label="계획 담당자" req><Inp value={f.plan_assignee} onChange={e => setF(p => ({ ...p, plan_assignee: e.target.value }))} /></Fld>
            <div className="col-span-2"><Fld label="계획 업무 내용" req><Textarea rows={2} value={f.plan_task} onChange={e => setF(p => ({ ...p, plan_task: e.target.value }))} /></Fld></div>
            <Fld label="계획 완료일"><Inp type="date" value={f.plan_due} onChange={e => setF(p => ({ ...p, plan_due: e.target.value }))} /></Fld>
            <Fld label="상태"><Sl v={f.status} set={v => setF(p => ({ ...p, status: v as QualityWeeklyTask["status"] }))} opts={["미완료","진행중","완료"].map(x => ({ value: x, label: x }))} /></Fld>
            <div className="col-span-2"><Fld label="고객 이슈"><Textarea rows={2} value={f.customer_issue} onChange={e => setF(p => ({ ...p, customer_issue: e.target.value }))} /></Fld></div>
          </div>
          <SaveBar onSave={() => { setTasks(p => [{ ...f, id: uid() }, ...p]); setModal(false); }} onClose={() => setModal(false)} />
        </Modal>
      )}
    </div>
  );
}

// ── 공정불량 페이지 (카테고리별 공용) ────────────────────────────────────────
function DefectPage({ category, defects, setDefects }: {
  category: ProcessDefect["category"];
  defects: ProcessDefect[];
  setDefects: React.Dispatch<React.SetStateAction<ProcessDefect[]>>;
}) {
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(false);
  const [f, setF] = useState<ProcessDefect>({
    id: uid(), week: THIS_WEEK, week_no: 3, category,
    item_no: "", inspected_qty: 0, defect_qty: 0, defect_amount: 0, ppm: 0,
    main_cause: "", action: "", assignee: "", action_due: new Date(Date.now()+604800000).toISOString().slice(0,10), status: "발생",
  });

  const catDef = defects.filter(d => d.category === category);
  const fil = useMemo(() => catDef.filter(d => {
    const s = q.toLowerCase();
    return !s || d.item_no.toLowerCase().includes(s) || d.main_cause.toLowerCase().includes(s);
  }), [catDef, q]);

  const stats = useMemo(() => ({
    inspected: catDef.reduce((a, d) => a + d.inspected_qty, 0),
    defect:    catDef.reduce((a, d) => a + d.defect_qty, 0),
    amount:    catDef.reduce((a, d) => a + d.defect_amount, 0),
    ppmAvg:    catDef.length ? Math.round(catDef.reduce((a, d) => a + d.ppm, 0) / catDef.length) : 0,
  }), [catDef]);

  const recalcPpm = (ins: number, def: number) => ins ? Math.round((def / ins) * 1_000_000) : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatC label="검사수량"  value={fc(stats.inspected)} unit="EA" />
        <StatC label="불량수량"  value={fc(stats.defect)} unit="EA" warn={stats.defect > 0} />
        <StatC label="불량금액"  value={`${Math.round(stats.amount / 10000)}만`} unit="원" warn={stats.amount > 0} />
        <StatC label="평균 PPM"  value={fc(stats.ppmAvg)} warn={stats.ppmAvg > 5000} />
      </div>

      <div className="flex items-center justify-between gap-3">
        <Srch v={q} set={setQ} ph="품번, 원인 검색" />
        <div className="flex items-center gap-2 shrink-0">
          <Btn v="primary" icon={<Plus size={12} />} onClick={() => setModal(true)}>불량 입력</Btn>
        </div>
      </div>

      <Tbl cols={["주차", "품번", "검사수↓", "불량수↓", "불량금액↓", "PPM↓", "주요원인", "조치내용", "담당", "완료일", "상태", "변경"]}>
        {fil.length === 0 ? <NoRow n={12} /> : fil.map(d => {
          const st = DEF_STATUS[d.status] ?? { l: d.status, c: "gray" };
          return (
            <TR key={d.id}>
              <TD muted>{d.week_no}주</TD>
              <TD mono bold>{d.item_no}</TD>
              <TD r>{fc(d.inspected_qty)}</TD>
              <td className="px-3 py-2 text-right tabular-nums font-bold text-red-500" style={{ fontSize: 11 }}>{fc(d.defect_qty)}</td>
              <td className="px-3 py-2 text-right tabular-nums font-semibold text-[#1e2247]" style={{ fontSize: 11 }}>{Math.round(d.defect_amount / 10000)}만</td>
              <td className={`px-3 py-2 text-right tabular-nums font-bold ${d.ppm > 10000 ? "text-red-500" : d.ppm > 5000 ? "text-amber-500" : "text-[#1e2247]"}`} style={{ fontSize: 11 }}>{fc(d.ppm)}</td>
              <td className="max-w-32 px-3 py-2 text-[#1e2247] truncate" style={{ fontSize: 11 }}>{d.main_cause}</td>
              <TD muted cls="max-w-32 truncate">{d.action}</TD>
              <TD muted>{d.assignee}</TD>
              <TD muted>{d.action_due}</TD>
              <td className="px-3 py-2"><Badge l={st.l} c={st.c} /></td>
              <td className="px-3 py-2">
                <select value={d.status}
                  onChange={e => setDefects(p => p.map(x => x.id === d.id ? { ...x, status: e.target.value as ProcessDefect["status"] } : x))}
                  className="h-6 rounded-lg border border-[#e8eaf0] bg-white px-1.5 text-[10px] text-[#1e2247] outline-none">
                  {["발생", "원인조사", "조치완료", "모니터링"].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </td>
            </TR>
          );
        })}
      </Tbl>

      {modal && (
        <Modal title={`${category} 공정불량 입력`} onClose={() => setModal(false)} wide>
          <div className="grid grid-cols-2 gap-3">
            <Fld label="주차"><Inp value={f.week} onChange={e => setF(p => ({ ...p, week: e.target.value }))} /></Fld>
            <Fld label="주차번호"><Sl v={String(f.week_no)} set={v => setF(p => ({ ...p, week_no: +v }))} opts={[1,2,3,4,5].map(n => ({ value: String(n), label: `${n}주차` }))} /></Fld>
            <Fld label="품번" req><Inp value={f.item_no} onChange={e => setF(p => ({ ...p, item_no: e.target.value }))} /></Fld>
            <Fld label="검사수량"><Inp type="number" value={f.inspected_qty} onChange={e => setF(p => ({ ...p, inspected_qty: +e.target.value }))} /></Fld>
            <Fld label="불량수량" req><Inp type="number" value={f.defect_qty} onChange={e => setF(p => ({ ...p, defect_qty: +e.target.value }))} /></Fld>
            <Fld label="불량금액(원)"><Inp type="number" value={f.defect_amount} onChange={e => setF(p => ({ ...p, defect_amount: +e.target.value }))} /></Fld>
            <Fld label="담당자" req><Inp value={f.assignee} onChange={e => setF(p => ({ ...p, assignee: e.target.value }))} /></Fld>
            <Fld label="조치 완료일"><Inp type="date" value={f.action_due} onChange={e => setF(p => ({ ...p, action_due: e.target.value }))} /></Fld>
            <div className="col-span-2"><Fld label="주요 원인" req><Textarea rows={2} value={f.main_cause} onChange={e => setF(p => ({ ...p, main_cause: e.target.value }))} /></Fld></div>
            <div className="col-span-2"><Fld label="조치 내용"><Textarea rows={2} value={f.action} onChange={e => setF(p => ({ ...p, action: e.target.value }))} /></Fld></div>
          </div>
          <SaveBar onSave={() => {
            const rec = { ...f, id: uid(), ppm: recalcPpm(f.inspected_qty, f.defect_qty) };
            setDefects(p => [rec, ...p]); setModal(false);
          }} onClose={() => setModal(false)} />
        </Modal>
      )}
    </div>
  );
}

// ── 리워크 페이지 ─────────────────────────────────────────────────────────────
function ReworkPage({ reworks, setReworks }: { reworks: ReworkRecord[]; setReworks: React.Dispatch<React.SetStateAction<ReworkRecord[]>> }) {
  const [modal, setModal] = useState(false);
  const [f, setF] = useState<ReworkRecord>({
    id: uid(), week: THIS_WEEK, category: "이너씰", item_no: "",
    month1_qty: 0, month1_amount: 0, month2_qty: 0, month2_amount: 0,
    total_qty: 0, total_amount: 0, reason: "", assignee: "",
  });

  const stats = useMemo(() => ({
    totalQty: reworks.reduce((a, r) => a + r.total_qty, 0),
    totalAmt: reworks.reduce((a, r) => a + r.total_amount, 0),
  }), [reworks]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <StatC label="총 리워크 수량" value={fc(stats.totalQty)} unit="EA" warn />
        <StatC label="총 리워크 금액" value={`${Math.round(stats.totalAmt / 10000)}만`} unit="원" warn />
      </div>

      <div className="flex justify-end">
        <Btn v="primary" icon={<Plus size={12} />} onClick={() => setModal(true)}>리워크 입력</Btn>
      </div>

      <Tbl cols={["주차", "제품군", "품번", "1월 수량↓", "1월 금액↓", "2월 수량↓", "2월 금액↓", "합계수량↓", "합계금액↓", "원인", "담당"]}>
        {reworks.length === 0 ? <NoRow n={11} /> : reworks.map(r => (
          <TR key={r.id}>
            <TD muted>{r.week}</TD>
            <td className="px-3 py-2"><Badge l={r.category} c="blue" /></td>
            <TD mono bold>{r.item_no}</TD>
            <TD r>{fc(r.month1_qty)}</TD>
            <td className="px-3 py-2 text-right tabular-nums text-slate-500" style={{ fontSize: 11 }}>{Math.round(r.month1_amount / 1000)}천</td>
            <TD r>{fc(r.month2_qty)}</TD>
            <td className="px-3 py-2 text-right tabular-nums text-slate-500" style={{ fontSize: 11 }}>{Math.round(r.month2_amount / 1000)}천</td>
            <td className="px-3 py-2 text-right tabular-nums font-bold text-amber-600" style={{ fontSize: 11 }}>{fc(r.total_qty)}</td>
            <td className="px-3 py-2 text-right tabular-nums font-bold text-red-500" style={{ fontSize: 11 }}>{Math.round(r.total_amount / 10000)}만</td>
            <TD muted cls="max-w-32 truncate">{r.reason}</TD>
            <TD muted>{r.assignee}</TD>
          </TR>
        ))}
      </Tbl>

      {modal && (
        <Modal title="리워크 현황 입력" onClose={() => setModal(false)} wide>
          <div className="grid grid-cols-2 gap-3">
            <Fld label="주차"><Inp value={f.week} onChange={e => setF(p => ({ ...p, week: e.target.value }))} /></Fld>
            <Fld label="제품군"><Sl v={f.category} set={v => setF(p => ({ ...p, category: v as ReworkRecord["category"] }))} opts={["BUSH","스트럿폼패드","스플라이너","이너씰","고무류"].map(x => ({ value: x, label: x }))} /></Fld>
            <Fld label="품번" req><Inp value={f.item_no} onChange={e => setF(p => ({ ...p, item_no: e.target.value }))} /></Fld>
            <Fld label="담당자"><Inp value={f.assignee} onChange={e => setF(p => ({ ...p, assignee: e.target.value }))} /></Fld>
            <Fld label="1월 수량"><Inp type="number" value={f.month1_qty} onChange={e => setF(p => ({ ...p, month1_qty: +e.target.value }))} /></Fld>
            <Fld label="1월 금액(원)"><Inp type="number" value={f.month1_amount} onChange={e => setF(p => ({ ...p, month1_amount: +e.target.value }))} /></Fld>
            <Fld label="2월 수량"><Inp type="number" value={f.month2_qty} onChange={e => setF(p => ({ ...p, month2_qty: +e.target.value }))} /></Fld>
            <Fld label="2월 금액(원)"><Inp type="number" value={f.month2_amount} onChange={e => setF(p => ({ ...p, month2_amount: +e.target.value }))} /></Fld>
            <div className="col-span-2"><Fld label="리워크 원인" req><Textarea rows={2} value={f.reason} onChange={e => setF(p => ({ ...p, reason: e.target.value }))} /></Fld></div>
          </div>
          <SaveBar onSave={() => {
            const t = { ...f, id: uid(), total_qty: f.month1_qty + f.month2_qty, total_amount: f.month1_amount + f.month2_amount };
            setReworks(p => [t, ...p]); setModal(false);
          }} onClose={() => setModal(false)} />
        </Modal>
      )}
    </div>
  );
}

// ── PPM 요약 카드 7개 (PPT Slide 17: 품질 합계) ─────────────────────────────
function PpmSummaryCards() {
  return (
    <div className="mb-6">
      <div className="mb-4 rounded-xl border border-slate-200/80 bg-slate-50/90 p-4">
        <p className="mb-2 font-semibold text-slate-800" style={{ fontSize: 13 }}>□ 2월 품질 합계 (PPT 02월 04주차)</p>
        <div className="flex flex-wrap gap-4">
          <StatC label="평균 PPM" value={DASHBOARD_KPIS.avg_ppm.toLocaleString()} unit="PPM" />
          <StatC label="불량금액" value={`${Math.round(DASHBOARD_KPIS.defect_amount/10000).toLocaleString()}만`} unit="원" warn />
        </div>
      </div>
      <p className="mb-3 font-bold text-[#0a2535]" style={{ fontSize: 14 }}>공정별 PPM 요약</p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {PPM_CARDS.map((c) => (
          <div
            key={c.category}
            className={`rounded-xl border p-3 ${
              c.status === "위험" ? "border-red-300 bg-red-50" : c.status === "주의" ? "border-amber-300 bg-amber-50" : "border-green-200 bg-green-50"
            }`}
          >
            <p className="font-semibold text-[#0a2535]" style={{ fontSize: 11 }}>{c.category}</p>
            <p className="mt-0.5 font-black" style={{ fontSize: 16 }}>{c.ppm > 0 ? fc(c.ppm) : "—"} PPM</p>
            <p className="text-slate-600" style={{ fontSize: 9 }}>{Math.round(c.amount / 10000)}만원</p>
            <Badge l={c.status} c={c.status === "위험" ? "red" : c.status === "주의" ? "amber" : "green"} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── BUSH 드릴다운 테이블 (코딩계획서 v1.0) ───────────────────────────────────
function BushDrillDownTable() {
  return (
    <div className="mb-6">
      <p className="mb-3 font-bold text-[#0a2535]" style={{ fontSize: 14 }}>BUSH 품번별 PPM 드릴다운</p>
      <Tbl cols={["품번", "검사수↓", "불량수↓", "PPM↓", "불량금액↓", "주요원인", "조치내용"]}>
        {BUSH_DRILLDOWN.map((r) => (
          <TR key={r.item_no}>
            <TD mono bold>{r.item_no}</TD>
            <TD r>{fc(r.inspected)}</TD>
            <TD r warn>{fc(r.defect)}</TD>
            <td className={`px-3 py-2 text-right font-bold ${r.ppm > 10000 ? "text-red-500" : r.ppm > 5000 ? "text-amber-500" : ""}`}>{fc(r.ppm)}</td>
            <TD r>{Math.round(r.amount / 1000)}천</TD>
            <TD muted cls="max-w-32 truncate">{r.cause}</TD>
            <TD muted cls="max-w-24 truncate">{r.action}</TD>
          </TR>
        ))}
      </Tbl>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
type QPage = "summary" | "weekly" | "bush" | "strut" | "vibro" | "seal" | "rubber" | "rework" | "customer" | null;

const CAT_MAP: Record<string, ProcessDefect["category"]> = {
  bush: "BUSH", strut: "스트럿폼패드", vibro: "스플라이너", seal: "이너씰", rubber: "고무류",
};

export default function QualitySection() {
  const [openPage, setOpenPage] = useState<QPage>(null);
  const [tab, setTab] = useState<string>("summary");
  const [tasks, setTasks] = useState<QualityWeeklyTask[]>(INIT_TASKS);
  const [defects, setDefects] = useState<ProcessDefect[]>(INIT_DEFECTS);
  const [reworks, setReworks] = useState<ReworkRecord[]>(INIT_REWORK);

  const openDef = defects.filter(d => d.status === "발생" || d.status === "원인조사");

  const qTabs = [
    { key: "summary", label: "종합", n: 0 },
    { key: "weekly", label: "주간 품질", n: tasks.length },
    { key: "bush", label: "BUSH", n: defects.filter(d => d.category === "BUSH").length },
    { key: "seal", label: "이너씰", n: defects.filter(d => d.category === "이너씰").length },
    { key: "vibro", label: "댐퍼/혼플레이트", n: defects.filter(d => d.category === "스플라이너").length },
    { key: "rubber", label: "순고무", n: defects.filter(d => d.category === "고무류").length },
    { key: "rework", label: "리워크", n: reworks.length },
    { key: "customer", label: "고객사 이슈", n: 0 },
  ];

  const cards: LandingCardDef[] = [
    { key: "summary", label: "종합", desc: "PPM 요약 카드 7개, BUSH 드릴다운.", Icon: ShieldCheck, count: 0, color: "#5c6bc0" },
    { key: "weekly", label: "주간 품질 보고", desc: "팀별 주간 품질계획 대비 실적, 고객이슈.", Icon: ShieldCheck, count: tasks.length, alert: tasks.filter(t => t.status === "미완료").length, color: "#5c6bc0" },
    { key: "bush", label: "BUSH", desc: "2421750/2421760/2421780 PPM·불량 현황.", Icon: Cog, count: defects.filter(d => d.category === "BUSH").length, alert: defects.filter(d => d.category === "BUSH" && (d.status === "발생" || d.status === "원인조사")).length, color: "#dc2626" },
    { key: "seal", label: "이너씰", desc: "SRG35/45/45L 이너씰 고불량 현황.", Icon: CircleDot, count: defects.filter(d => d.category === "이너씰").length, alert: defects.filter(d => d.category === "이너씰" && d.status === "원인조사").length, color: "#0891b2" },
    { key: "vibro", label: "댐퍼/혼플레이트", desc: "방진A/S 등 스플라이너 공정불량.", Icon: Wind, count: defects.filter(d => d.category === "스플라이너").length, color: "#7c3aed" },
    { key: "rubber", label: "순고무", desc: "RB09Z1/RB00GS 고무류 성형·금형 불량.", Icon: AlertTriangle, count: defects.filter(d => d.category === "고무류").length, alert: defects.filter(d => d.category === "고무류" && d.status === "발생").length, color: "#059669" },
    { key: "rework", label: "리워크", desc: "제품군별 리워크 수량·금액.", Icon: RefreshCcw, count: reworks.length, extra: `총 ${Math.round(reworks.reduce((a,r)=>a+r.total_amount,0)/10000)}만원`, color: "#b45309" },
    { key: "customer", label: "고객사 이슈", desc: "고객사별 품질 이슈 추적.", Icon: FileWarning, count: 0, color: "#0d7f8a" },
  ];

  const PAGE_TITLE: Record<string, string> = {
    summary: "종합",
    weekly: "주간 품질 보고",
    bush:   "BUSH 공정불량",
    strut:  "스트럿폼패드 불량",
    vibro:  "댐퍼/혼플레이트",
    seal:   "이너씰 불량",
    rubber: "순고무 불량",
    rework: "리워크 현황",
    customer: "고객사 이슈",
  };

  return (
    <div>
      {openDef.length > 0 && (
        <div className="mb-4">
          <AlertBanner msg={`조치 필요 불량 ${openDef.length}건 — ${openDef.slice(0,3).map(d => d.item_no).join(", ")} 즉시 조치 필요`} />
        </div>
      )}

      <SectionLanding
        title="품질 관리 (QC)"
        sub="주간 품질보고 · 공정불량 5개 제품군 · 리워크 현황"
        cards={cards}
        onOpen={k => setOpenPage(k as QPage)}
      />

      {openPage && (() => {
        let exData: ExcelRow[] = [];
        let exHeaders: Record<string, string> = {};
        let exFilename = "품질관리";

        if (openPage === "summary" || openPage === "customer") {
          exData = BUSH_DRILLDOWN as unknown as ExcelRow[];
          exHeaders = { "품번":"item_no","품목명":"item_name","검사수":"inspected","불량수":"defect","PPM":"ppm","불량금액":"amount","주요원인":"cause","조치내용":"action" };
          exFilename = openPage === "summary" ? "품질종합" : "고객사이슈";
        } else if (openPage === "weekly") {
          exData = tasks as unknown as ExcelRow[];
          exHeaders = { "주차":"week","팀":"team","업무유형":"task_type","계획업무":"plan_task","계획담당":"plan_assignee","계획완료일":"plan_due","실적결과":"actual_task","실적담당":"actual_assignee","완료일":"actual_due","고객이슈":"customer_issue","상태":"status" };
          exFilename = "주간품질보고";
        } else if (CAT_MAP[openPage]) {
          const cat = CAT_MAP[openPage];
          exData = defects.filter(d => d.category === cat) as unknown as ExcelRow[];
          exHeaders = { "주차":"week","주차번호":"week_no","품번":"item_no","검사수량":"inspected_qty","불량수량":"defect_qty","불량금액":"defect_amount","PPM":"ppm","주요원인":"main_cause","조치내용":"action","담당":"assignee","완료일":"action_due","상태":"status" };
          exFilename = `${cat}공정불량`;
        } else if (openPage === "rework") {
          exData = reworks as unknown as ExcelRow[];
          exHeaders = { "주차":"week","제품군":"category","품번":"item_no","1월수량":"month1_qty","1월금액":"month1_amount","2월수량":"month2_qty","2월금액":"month2_amount","합계수량":"total_qty","합계금액":"total_amount","원인":"reason","담당":"assignee" };
          exFilename = "리워크현황";
        }

        return (
          <PageModal
            title={PAGE_TITLE[openPage]}
            section="품질 관리"
            onClose={() => setOpenPage(null)}
            actions={
              <div className="flex items-center gap-1.5">
                <ExcelExportBtn data={exData} options={{ filename: exFilename, sheetName: PAGE_TITLE[openPage], headers: exHeaders }} />
                <PrintBtn title={PAGE_TITLE[openPage]} printId="quality-content" />
              </div>
            }
          >
            <div id="quality-content">
              {openPage === "summary" && (
                <>
                  <PpmSummaryCards />
                  <BushDrillDownTable />
                </>
              )}
              {openPage === "weekly" && <QualWeeklyPage tasks={tasks} setTasks={setTasks} />}
              {CAT_MAP[openPage] && <DefectPage category={CAT_MAP[openPage]} defects={defects} setDefects={setDefects} />}
              {openPage === "rework" && <ReworkPage reworks={reworks} setReworks={setReworks} />}
              {openPage === "customer" && (
                <div className="space-y-4">
                  <StatC label="진행 이슈" value="3" unit="건" />
                  <Tbl cols={["고객사", "이슈 내용", "발생일", "상태", "조치"]}>
                    <TR>
                      <TD bold>HKMC</TD>
                      <td className="px-3 py-2">SRG45 치수 불량 — NG 마스터 제작 요청</td>
                      <TD muted>2026-03-05</TD>
                      <td className="px-3 py-2"><Badge l="진행중" c="amber" /></td>
                      <TD muted>체크시트 3/6 완료</TD>
                    </TR>
                    <TR>
                      <TD bold>SECO AIA</TD>
                      <td className="px-3 py-2">BUSH 2421760 기포불량 — 배합조건 변경</td>
                      <TD muted>2026-03-03</TD>
                      <td className="px-3 py-2"><Badge l="조치완료" c="green" /></td>
                      <TD muted>배합조건 변경 완료</TD>
                    </TR>
                  </Tbl>
                </div>
              )}
            </div>
          </PageModal>
        );
      })()}
    </div>
  );
}
