"use client";
// ─── 구매/자재 섹션 ──────────────────────────────────────────────────────────

import { useState, useMemo } from "react";
import { Plus, RefreshCw, ShoppingCart, PackageSearch } from "lucide-react";
import {
  Badge, Btn, Fld, Inp, Sl, Modal, Srch,
  Tbl, TR, TD, NoRow, PBar, StatC, AlertBanner, SaveBar, uid,
  fc, fp, PageModal, SectionLanding, ExcelExportBtn, ExcelImportBtn, PrintBtn,
  type LandingCardDef, type ExcelRow,
} from "./shared";
import type { PurchaseOrder, MaterialSupplyPlan } from "./types";

const PO_S: Record<string, { l: string; c: string }> = {
  발주:     { l: "발주",     c: "blue"  },
  입고대기: { l: "입고대기", c: "sky"   },
  부분입고: { l: "부분입고", c: "amber" },
  입고완료: { l: "입고완료", c: "green" },
  취소:     { l: "취소",     c: "gray"  },
};

const INIT_PO: PurchaseOrder[] = [
  { id:"po1", po_no:"PO-2026-03-001", vendor:"㈜한국폼",    item_code:"2421750-MAT",  item_name:"BUSH 2421750 원자재",       qty:2000,  unit:"EA", unit_price:800,  total_amount:1600000,  order_date:"2026-03-03", due_date:"2026-03-10", received_qty:0,    status:"발주",    linked_pr_no:"PR-2026-03-001", remark:"" },
  { id:"po2", po_no:"PO-2026-03-002", vendor:"금속부품㈜",  item_code:"BUSH-760-MAT", item_name:"BUSH 760 TYPE 소재",        qty:500,   unit:"EA", unit_price:1200, total_amount:600000,   order_date:"2026-03-03", due_date:"2026-03-08", received_qty:200,  status:"부분입고",linked_pr_no:"PR-2026-03-002", remark:"2차 입고 예정 3/12" },
  { id:"po3", po_no:"PO-2026-03-003", vendor:"정밀기계㈜",  item_code:"MX5-070-MAT",  item_name:"MX5-070 가공 소재",         qty:1000,  unit:"EA", unit_price:1500, total_amount:1500000,  order_date:"2026-03-01", due_date:"2026-03-07", received_qty:1000, status:"입고완료",linked_pr_no:"PR-2026-03-004", remark:"" },
  { id:"po4", po_no:"PO-2026-03-004", vendor:"㈜러버테크",  item_code:"SEAL-A-MAT",   item_name:"INNER SEAL A TYPE 원자재",  qty:300,   unit:"EA", unit_price:4000, total_amount:1200000,  order_date:"2026-03-05", due_date:"2026-03-15", received_qty:0,    status:"입고대기",linked_pr_no:"PR-2026-03-003", remark:"NCR 폐기분 보충" },
  { id:"po5", po_no:"PO-2026-03-005", vendor:"야마구치공업", item_code:"SR15-MAT",     item_name:"SR15 이너씰 원자재",        qty:5000,  unit:"EA", unit_price:350,  total_amount:1750000,  order_date:"2026-03-06", due_date:"2026-03-14", received_qty:0,    status:"발주",    remark:"익THK 긴급 발주" },
  { id:"po6", po_no:"PO-2026-03-006", vendor:"삼성테크노㈜",item_code:"SRG45-MAT",    item_name:"이너씰 SRG45 소재",         qty:10000, unit:"EA", unit_price:200,  total_amount:2000000,  order_date:"2026-03-04", due_date:"2026-03-11", received_qty:3000, status:"부분입고",remark:"고불량 긴급 보충분" },
];

const INIT_SUPPLY: MaterialSupplyPlan[] = [
  { id:"sp1", item_code:"2421750-MAT",  item_name:"BUSH 2421750 원자재",  category:"BUSH",  customer:"HKMC",   unit:"EA", current_stock:1200, safety_stock:1000, monthly_requirement:5000,  w1_req:1200, w2_req:1200, w3_req:1300, w4_req:1300, pending_order_qty:2000, gap:-800,  plan_order_date:"2026-03-15", vendor:"㈜한국폼",    remarks:"" },
  { id:"sp2", item_code:"BUSH-760-MAT", item_name:"BUSH 760 TYPE 소재",   category:"BUSH",  customer:"화성업", unit:"EA", current_stock:500,  safety_stock:300,  monthly_requirement:2000,  w1_req:500,  w2_req:500,  w3_req:500,  w4_req:500,  pending_order_qty:500,  gap:0,     plan_order_date:"2026-03-20", vendor:"금속부품㈜",  remarks:"2차 입고 예정" },
  { id:"sp3", item_code:"56170-MAT",    item_name:"스트럿폼패드 원자재",  category:"스트럿",customer:"HKMC",   unit:"EA", current_stock:8000, safety_stock:5000, monthly_requirement:80000, w1_req:20000,w2_req:20000,w3_req:20000,w4_req:20000,pending_order_qty:0,    gap:0,     vendor:"평화산업",    remarks:"재고 충분" },
  { id:"sp4", item_code:"SRG45-MAT",    item_name:"이너씰 SRG45 소재",   category:"이너씰",customer:"익THK",  unit:"EA", current_stock:500,  safety_stock:2000, monthly_requirement:28000, w1_req:6000, w2_req:6000, w3_req:7000, w4_req:9000, pending_order_qty:10000,gap:-3500, plan_order_date:"2026-03-08", vendor:"삼성테크노㈜", remarks:"고불량으로 긴급 발주" },
  { id:"sp5", item_code:"SR15-MAT",     item_name:"SR15 이너씰 원자재",  category:"이너씰",customer:"익THK",  unit:"EA", current_stock:0,    safety_stock:1000, monthly_requirement:10000, w1_req:2000, w2_req:2500, w3_req:2500, w4_req:3000, pending_order_qty:5000, gap:-2000, plan_order_date:"2026-03-10", vendor:"야마구치공업", remarks:"백오더 확인" },
  { id:"sp6", item_code:"RUBBER-RB-MAT",item_name:"고무류 원자재 공통",  category:"고무류",customer:"HKMC",   unit:"KG", current_stock:2000, safety_stock:500,  monthly_requirement:5000,  w1_req:1200, w2_req:1200, w3_req:1300, w4_req:1300, pending_order_qty:0,    gap:0,     vendor:"㈜고무테크",  remarks:"재고 충분" },
];

// ── 구매발주 현황 페이지 ──────────────────────────────────────────────────────
function PoPage({ data, setData }: { data: PurchaseOrder[]; setData: React.Dispatch<React.SetStateAction<PurchaseOrder[]>> }) {
  const [q, setQ] = useState("");
  const [filterStatus, setFilterStatus] = useState("전체");
  const [modal, setModal] = useState(false);
  const [f, setF] = useState<PurchaseOrder>({
    id: uid(), po_no: `PO-${new Date().toISOString().slice(0,7)}-${String(Math.floor(Math.random()*900)+100)}`,
    vendor: "", item_code: "", item_name: "", qty: 0, unit: "EA",
    unit_price: 0, total_amount: 0, order_date: new Date().toISOString().slice(0,10),
    due_date: new Date(Date.now()+604800000).toISOString().slice(0,10),
    received_qty: 0, status: "발주", remark: "",
  });

  const statuses = ["전체", "발주", "입고대기", "부분입고", "입고완료", "취소"];
  const fil = useMemo(() => data.filter(d => {
    const t = filterStatus === "전체" || d.status === filterStatus;
    const s = q.toLowerCase();
    return t && (!s || d.po_no.toLowerCase().includes(s) || d.item_name.toLowerCase().includes(s) || d.vendor.toLowerCase().includes(s));
  }), [data, filterStatus, q]);

  const stats = useMemo(() => ({
    total:    data.length,
    pending:  data.filter(d => d.status === "발주" || d.status === "입고대기").length,
    partial:  data.filter(d => d.status === "부분입고").length,
    done:     data.filter(d => d.status === "입고완료").length,
    totalAmt: data.reduce((a, d) => a + d.total_amount, 0),
  }), [data]);

  const adv = (id: string) => {
    const nx: Record<string, PurchaseOrder["status"]> = { 발주: "입고대기", 입고대기: "입고완료", 부분입고: "입고완료" };
    setData(p => p.map(d => d.id === id ? { ...d, status: nx[d.status] ?? d.status, received_qty: nx[d.status] === "입고완료" ? d.qty : d.received_qty } : d));
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatC label="발주·입고대기" value={stats.pending} unit="건" warn={stats.pending > 0} />
        <StatC label="부분입고" value={stats.partial} unit="건" />
        <StatC label="입고완료" value={stats.done} unit="건" />
        <StatC label="총 발주금액" value={`${Math.round(stats.totalAmt / 10000)}만`} unit="원" />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {statuses.map(s => (
            <button key={s} onClick={() => setFilterStatus(s)}
              className={`h-7 rounded-full px-3 font-medium transition-all ${filterStatus === s ? "bg-[#5c6bc0] text-white shadow-sm" : "border border-[#e8eaf0] bg-white text-slate-500 hover:text-[#1e2247]"}`}
              style={{ fontSize: 11 }}>{s}</button>
          ))}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Btn v="primary" icon={<Plus size={12} />} onClick={() => setModal(true)}>발주 등록</Btn>
        </div>
      </div>

      <Srch v={q} set={setQ} ph="발주번호, 품목명, 공급업체 검색" />

      <Tbl cols={["발주번호","공급업체","품목코드","품목명","수량↓","단가↓","발주금액↓","발주일","납기일","입고수량↓","진행률","상태","처리"]}>
        {fil.length === 0 ? <NoRow n={13} /> : fil.map(d => {
          const st = PO_S[d.status] ?? { l: d.status, c: "gray" };
          const NX_L: Record<string, string> = { 발주: "입고대기", 입고대기: "입고완료", 부분입고: "입고완료" };
          const overdue = d.due_date < new Date().toISOString().slice(0,10) && d.status !== "입고완료";
          return (
            <TR key={d.id}>
              <TD mono>{d.po_no}</TD>
              <TD bold>{d.vendor}</TD>
              <TD mono>{d.item_code}</TD>
              <TD>{d.item_name}</TD>
              <TD r>{fc(d.qty)} {d.unit}</TD>
              <td className="px-3 py-2 text-right tabular-nums text-slate-500" style={{ fontSize: 11 }}>{fc(d.unit_price)}</td>
              <TD r bold>{fc(d.total_amount)}</TD>
              <TD muted>{d.order_date}</TD>
              <td className={`px-3 py-2 ${overdue ? "font-bold text-red-500" : "text-slate-400"}`} style={{ fontSize: 11 }}>{d.due_date}</td>
              <TD r>{fc(d.received_qty)}</TD>
              <td className="px-3 py-2"><PBar a={d.received_qty} b={d.qty} c={fp(d.received_qty, d.qty) >= 100 ? "green" : "indigo"} /></td>
              <td className="px-3 py-2"><Badge l={st.l} c={st.c} /></td>
              <td className="px-3 py-2">
                {NX_L[d.status] && (
                  <button onClick={() => adv(d.id)} className="rounded-lg bg-slate-100 px-2 py-0.5 font-medium text-slate-600 hover:bg-indigo-50 hover:text-[#5c6bc0] transition-colors" style={{ fontSize: 10 }}>
                    → {NX_L[d.status]}
                  </button>
                )}
              </td>
            </TR>
          );
        })}
      </Tbl>

      {modal && (
        <Modal title="구매발주 등록" onClose={() => setModal(false)} wide>
          <div className="grid grid-cols-2 gap-3">
            <Fld label="발주번호" req><Inp value={f.po_no} onChange={e => setF(p => ({ ...p, po_no: e.target.value }))} /></Fld>
            <Fld label="공급업체" req><Inp value={f.vendor} onChange={e => setF(p => ({ ...p, vendor: e.target.value }))} /></Fld>
            <Fld label="품목코드"><Inp value={f.item_code} onChange={e => setF(p => ({ ...p, item_code: e.target.value }))} /></Fld>
            <Fld label="품목명" req><Inp value={f.item_name} onChange={e => setF(p => ({ ...p, item_name: e.target.value }))} /></Fld>
            <Fld label="수량" req><Inp type="number" value={f.qty} onChange={e => setF(p => ({ ...p, qty: +e.target.value, total_amount: +e.target.value * p.unit_price }))} /></Fld>
            <Fld label="단위"><Sl v={f.unit} set={v => setF(p => ({ ...p, unit: v }))} opts={["EA","KG","M","SET"].map(x => ({ value: x, label: x }))} /></Fld>
            <Fld label="단가(원)"><Inp type="number" value={f.unit_price} onChange={e => setF(p => ({ ...p, unit_price: +e.target.value, total_amount: p.qty * +e.target.value }))} /></Fld>
            <Fld label="발주금액"><Inp value={fc(f.total_amount)} readOnly className="bg-slate-100 cursor-default" /></Fld>
            <Fld label="발주일"><Inp type="date" value={f.order_date} onChange={e => setF(p => ({ ...p, order_date: e.target.value }))} /></Fld>
            <Fld label="납기일" req><Inp type="date" value={f.due_date} onChange={e => setF(p => ({ ...p, due_date: e.target.value }))} /></Fld>
            <Fld label="연결 구매요청번호"><Inp value={f.linked_pr_no ?? ""} onChange={e => setF(p => ({ ...p, linked_pr_no: e.target.value }))} placeholder="PR-XXXX" /></Fld>
            <div className="col-span-2"><Fld label="비고"><Inp value={f.remark ?? ""} onChange={e => setF(p => ({ ...p, remark: e.target.value }))} /></Fld></div>
          </div>
          <SaveBar onSave={() => { setData(p => [{ ...f, id: uid() }, ...p]); setModal(false); }} onClose={() => setModal(false)} />
        </Modal>
      )}
    </div>
  );
}

// ── 자재수급계획 페이지 ────────────────────────────────────────────────────────
function SupplyPage({ data, setData }: { data: MaterialSupplyPlan[]; setData: React.Dispatch<React.SetStateAction<MaterialSupplyPlan[]>> }) {
  const [q, setQ] = useState("");
  const [belowOnly, setBelowOnly] = useState(false);
  const [modal, setModal] = useState(false);
  const [f, setF] = useState<MaterialSupplyPlan>({
    id: uid(), item_code: "", item_name: "", category: "BUSH", customer: "HKMC", unit: "EA",
    current_stock: 0, safety_stock: 0, monthly_requirement: 0,
    w1_req: 0, w2_req: 0, w3_req: 0, w4_req: 0, pending_order_qty: 0, gap: 0,
    plan_order_date: "", vendor: "", remarks: "",
  });

  const fil = useMemo(() => data.filter(d => {
    const below = !belowOnly || d.gap < 0;
    const s = q.toLowerCase();
    return below && (!s || d.item_code.toLowerCase().includes(s) || d.item_name.toLowerCase().includes(s));
  }), [data, q, belowOnly]);

  const shortage = data.filter(d => d.gap < 0);

  return (
    <div className="space-y-5">
      {shortage.length > 0 && (
        <AlertBanner msg={`자재 부족 ${shortage.length}종 — ${shortage.map(s => s.item_name).join(", ")} 즉시 발주 필요`} />
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatC label="관리 품목" value={data.length} unit="종" />
        <StatC label="자재 부족" value={shortage.length} unit="종" warn={shortage.length > 0} />
        <StatC label="발주 대기" value={data.filter(d => d.plan_order_date).length} unit="종" />
        <StatC label="재고 충분" value={data.filter(d => d.gap >= 0).length} unit="종" />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Srch v={q} set={setQ} ph="품목코드, 품목명 검색" />
          <label className="flex shrink-0 cursor-pointer items-center gap-1.5 font-medium text-slate-600" style={{ fontSize: 11 }}>
            <input type="checkbox" className="h-3.5 w-3.5 rounded accent-[#5c6bc0]" checked={belowOnly} onChange={e => setBelowOnly(e.target.checked)} />
            부족 품목만
          </label>
        </div>
        <Btn v="primary" icon={<Plus size={12} />} onClick={() => setModal(true)}>품목 추가</Btn>
      </div>

      <Tbl cols={["품목코드","품목명","제품군","고객","현재고↓","안전재고↓","월소요↓","1주↓","2주↓","3주↓","4주↓","발주잔량↓","부족↓","발주예정일","공급업체","비고"]}>
        {fil.length === 0 ? <NoRow n={16} /> : fil.map(d => {
          const isShort = d.gap < 0;
          return (
            <TR key={d.id}>
              <TD mono>{d.item_code}</TD>
              <TD bold>{d.item_name}</TD>
              <td className="px-3 py-2"><Badge l={d.category} c="blue" /></td>
              <TD muted>{d.customer}</TD>
              <td className={`px-3 py-2 text-right tabular-nums font-bold ${d.current_stock < d.safety_stock ? "text-red-500" : "text-[#1e2247]"}`} style={{ fontSize: 11 }}>{fc(d.current_stock)}</td>
              <TD r muted>{fc(d.safety_stock)}</TD>
              <TD r>{fc(d.monthly_requirement)}</TD>
              <TD r muted>{d.w1_req > 0 ? fc(d.w1_req) : "—"}</TD>
              <TD r muted>{d.w2_req > 0 ? fc(d.w2_req) : "—"}</TD>
              <TD r muted>{d.w3_req > 0 ? fc(d.w3_req) : "—"}</TD>
              <TD r muted>{d.w4_req > 0 ? fc(d.w4_req) : "—"}</TD>
              <TD r>{fc(d.pending_order_qty)}</TD>
              <td className={`px-3 py-2 text-right tabular-nums font-bold ${isShort ? "text-red-500" : "text-emerald-600"}`} style={{ fontSize: 11 }}>
                {isShort ? `-${fc(Math.abs(d.gap))}` : `+${fc(d.gap)}`}
              </td>
              <TD muted>{d.plan_order_date || "—"}</TD>
              <TD muted>{d.vendor || "—"}</TD>
              <TD muted cls="max-w-28 truncate">{d.remarks || "—"}</TD>
            </TR>
          );
        })}
      </Tbl>

      {modal && (
        <Modal title="자재수급 계획 품목 추가" onClose={() => setModal(false)} xl>
          <div className="grid grid-cols-3 gap-3">
            <Fld label="품목코드" req><Inp value={f.item_code} onChange={e => setF(p => ({ ...p, item_code: e.target.value }))} /></Fld>
            <div className="col-span-2"><Fld label="품목명" req><Inp value={f.item_name} onChange={e => setF(p => ({ ...p, item_name: e.target.value }))} /></Fld></div>
            <Fld label="제품군"><Sl v={f.category} set={v => setF(p => ({ ...p, category: v }))} opts={["BUSH","스트럿","방진","이너씰","고무류","기타"].map(x => ({ value: x, label: x }))} /></Fld>
            <Fld label="고객사"><Sl v={f.customer} set={v => setF(p => ({ ...p, customer: v }))} opts={["HKMC","평화산업","SECO AIA","익THK","화성업"].map(x => ({ value: x, label: x }))} /></Fld>
            <Fld label="단위"><Sl v={f.unit} set={v => setF(p => ({ ...p, unit: v }))} opts={["EA","KG","M"].map(x => ({ value: x, label: x }))} /></Fld>
            <Fld label="현재재고"><Inp type="number" value={f.current_stock} onChange={e => setF(p => ({ ...p, current_stock: +e.target.value }))} /></Fld>
            <Fld label="안전재고"><Inp type="number" value={f.safety_stock} onChange={e => setF(p => ({ ...p, safety_stock: +e.target.value }))} /></Fld>
            <Fld label="월 소요량"><Inp type="number" value={f.monthly_requirement} onChange={e => setF(p => ({ ...p, monthly_requirement: +e.target.value }))} /></Fld>
            {[1,2,3,4].map(n => (
              <Fld key={n} label={`${n}주 소요`}><Inp type="number" value={(f as unknown as Record<string,number>)[`w${n}_req`]} onChange={e => setF(p => ({ ...p, [`w${n}_req`]: +e.target.value }))} /></Fld>
            ))}
            <Fld label="발주 잔량"><Inp type="number" value={f.pending_order_qty} onChange={e => setF(p => ({ ...p, pending_order_qty: +e.target.value }))} /></Fld>
            <Fld label="발주 예정일"><Inp type="date" value={f.plan_order_date ?? ""} onChange={e => setF(p => ({ ...p, plan_order_date: e.target.value }))} /></Fld>
            <Fld label="공급업체"><Inp value={f.vendor ?? ""} onChange={e => setF(p => ({ ...p, vendor: e.target.value }))} /></Fld>
            <div className="col-span-3"><Fld label="비고"><Inp value={f.remarks ?? ""} onChange={e => setF(p => ({ ...p, remarks: e.target.value }))} /></Fld></div>
          </div>
          <SaveBar onSave={() => {
            const gap = (f.current_stock + f.pending_order_qty) - f.monthly_requirement;
            setData(p => [{ ...f, id: uid(), gap }, ...p]);
            setModal(false);
          }} onClose={() => setModal(false)} />
        </Modal>
      )}
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
type PPage = "po" | "supply" | null;

export default function PurchaseSection() {
  const [openPage, setOpenPage] = useState<PPage>(null);
  const [pos, setPos] = useState<PurchaseOrder[]>(INIT_PO);
  const [supply, setSupply] = useState<MaterialSupplyPlan[]>(INIT_SUPPLY);

  const shortage = supply.filter(s => s.gap < 0).length;
  const pendingPo = pos.filter(p => p.status === "발주" || p.status === "입고대기").length;

  const cards: LandingCardDef[] = [
    {
      key: "po",
      label: "구매 발주 현황",
      desc: "공급업체별 구매발주 등록, 입고 진행 상태를 추적하고 납기 지연을 모니터링합니다.",
      Icon: ShoppingCart,
      count: pos.length,
      alert: pendingPo,
      extra: `총 ${Math.round(pos.reduce((a,p)=>a+p.total_amount,0)/10000)}만원`,
      color: "#5c6bc0",
    },
    {
      key: "supply",
      label: "자재 수급 계획",
      desc: "품목별 현재재고·안전재고·월소요량을 관리하고 부족분 자동 산출 및 발주 예정일을 관리합니다.",
      Icon: PackageSearch,
      count: supply.length,
      alert: shortage,
      extra: `부족 ${shortage}종`,
      color: shortage > 0 ? "#dc2626" : "#059669",
    },
  ];

  const PAGE_TITLE: Record<string, string> = {
    po:     "구매 발주 현황",
    supply: "자재 수급 계획",
  };

  return (
    <div>
      <SectionLanding
        title="구매 / 자재 관리"
        sub="구매발주 현황 · 자재수급 계획 관리"
        cards={cards}
        onOpen={k => setOpenPage(k as PPage)}
      />

      {openPage && (() => {
        let exData: ExcelRow[] = [];
        let exHeaders: Record<string, string> = {};
        let exFilename = "구매관리";
        let tplHeaders: string[] = [];

        if (openPage === "po") {
          exData = pos as unknown as ExcelRow[];
          exHeaders = { "발주번호":"po_no","공급업체":"vendor","품목코드":"item_code","품목명":"item_name","수량":"qty","단위":"unit","단가":"unit_price","발주금액":"total_amount","발주일":"order_date","납기일":"due_date","입고수량":"received_qty","상태":"status","비고":"remark" };
          tplHeaders = ["발주번호","공급업체","품목코드","품목명","수량","단위","단가","발주일","납기일","비고"];
          exFilename = "구매발주현황";
        } else {
          exData = supply as unknown as ExcelRow[];
          exHeaders = { "품목코드":"item_code","품목명":"item_name","제품군":"category","고객사":"customer","단위":"unit","현재재고":"current_stock","안전재고":"safety_stock","월소요량":"monthly_requirement","1주소요":"w1_req","2주소요":"w2_req","3주소요":"w3_req","4주소요":"w4_req","발주잔량":"pending_order_qty","부족량":"gap","발주예정일":"plan_order_date","공급업체":"vendor","비고":"remarks" };
          tplHeaders = ["품목코드","품목명","제품군","고객사","단위","현재재고","안전재고","월소요량","1주소요","2주소요","3주소요","4주소요","발주잔량","발주예정일","공급업체","비고"];
          exFilename = "자재수급계획";
        }

        const handleImport = (rows: ExcelRow[]) => {
          if (openPage === "po") {
            const mapped = rows.map(r => ({
              id: uid(),
              po_no: String(r["발주번호"] ?? ""),
              vendor: String(r["공급업체"] ?? ""),
              item_code: String(r["품목코드"] ?? ""),
              item_name: String(r["품목명"] ?? ""),
              qty: Number(r["수량"] ?? 0),
              unit: String(r["단위"] ?? "EA"),
              unit_price: Number(r["단가"] ?? 0),
              total_amount: Number(r["수량"] ?? 0) * Number(r["단가"] ?? 0),
              order_date: String(r["발주일"] ?? new Date().toISOString().slice(0, 10)),
              due_date: String(r["납기일"] ?? ""),
              received_qty: 0,
              status: "발주" as PurchaseOrder["status"],
              remark: String(r["비고"] ?? ""),
            }));
            setPos(p => [...mapped, ...p]);
          }
        };

        return (
          <PageModal
            title={PAGE_TITLE[openPage]}
            section="구매 관리"
            onClose={() => setOpenPage(null)}
            actions={
              <div className="flex items-center gap-1.5">
                <ExcelImportBtn onImport={handleImport} templateHeaders={tplHeaders} templateFilename={`${exFilename}_양식`} />
                <ExcelExportBtn data={exData} options={{ filename: exFilename, sheetName: PAGE_TITLE[openPage], headers: exHeaders }} />
                <PrintBtn title={PAGE_TITLE[openPage]} printId="purchase-content" />
              </div>
            }
          >
            <div id="purchase-content">
              {openPage === "po"     && <PoPage     data={pos}    setData={setPos} />}
              {openPage === "supply" && <SupplyPage data={supply} setData={setSupply} />}
            </div>
          </PageModal>
        );
      })()}
    </div>
  );
}
