"use client";
// ─── 영업/수주 섹션 (코딩계획서 v1.0) ──────────────────────────────────────────
// 고객사별 4카드: 평화산업, SECO AIA, 삼익 THK, 자동차

import { useState, useMemo } from "react";
import { Plus, Printer, TrendingUp, BarChart2, Users2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import {
  Badge, Btn, Fld, Inp, Sl, Modal, Srch,
  Tbl, TR, TD, NoRow, StatC, AlertBanner, SaveBar, uid,
  fc, fp, PageModal, SectionLanding, ExcelExportBtn, PrintBtn,
  type LandingCardDef, type ExcelRow,
} from "./shared";
import type { MonthlySalesCategory, HkmcProgress, CustomerTarget } from "./types";
import { CUSTOMER_SALES } from "@/lib/fact-plan-data";

const CUST_S: Record<string, { l: string; c: string }> = {
  달성: { l: "달성", c: "green" },
  미달: { l: "미달", c: "red"   },
  초과: { l: "초과", c: "blue"  },
};
const HKMC_S: Record<string, { l: string; c: string }> = {
  정상: { l: "정상", c: "green" },
  지연: { l: "지연", c: "red"   },
  완료: { l: "완료", c: "blue"  },
};

const INIT_MONTHLY: MonthlySalesCategory[] = [
  { id:"m1", year:2026, month:3, category:"DASTMRPWER",   sub_category:"스트럿폼패드", year_target:335000000, month_target_rate:55, month_plan:181500000, month_actual:176491425, ytd_actual:336000000, purchase_target_rate:46, purchase_plan:0, purchase_actual:0, w1_sales:70332033, w2_sales:56427583, w3_sales:42816365, w4_sales:0, w5_sales:0, notes:"7056% 달성 · 매주 매출 입금 조회" },
  { id:"m2", year:2026, month:3, category:"PHLORTNE",      sub_category:"폼패드(수입)",  year_target:180000000, month_target_rate:64, month_plan:115200000, month_actual:113472991, ytd_actual:192000000, purchase_target_rate:0,  purchase_plan:0, purchase_actual:0, w1_sales:57336096, w2_sales:32270120, w3_sales:23017280, w4_sales:0, w5_sales:0, notes:"/주문 입금 → 7 75% 반영 예정" },
  { id:"m3", year:2026, month:3, category:"이이SP",         sub_category:"스플라이너",    year_target:182000000, month_target_rate:65, month_plan:117000000, month_actual:78591256,  ytd_actual:132500000, purchase_target_rate:0,  purchase_plan:0, purchase_actual:0, w1_sales:30126000, w2_sales:41261264, w3_sales:24829035, w4_sales:0, w5_sales:0, notes:"/3 63,10,050075% 매출 반영" },
  { id:"m4", year:2026, month:3, category:"방진AS",         sub_category:"방진A/S",       year_target:180000000, month_target_rate:65, month_plan:117000000, month_actual:44843870,  ytd_actual:300506993, purchase_target_rate:0,  purchase_plan:0, purchase_actual:0, w1_sales:34823899, w2_sales:39228521, w3_sales:22243527, w4_sales:0, w5_sales:0, notes:"A/S 평균 - 1억.7백만원 주 10% 달성" },
  { id:"m5", year:2026, month:3, category:"이너씰",          sub_category:"이너씰",        year_target:490000000, month_target_rate:0,  month_plan:49000000,  month_actual:42450140,  ytd_actual:26854932,  purchase_target_rate:0,  purchase_plan:0, purchase_actual:0, w1_sales:12196976, w2_sales:10185065, w3_sales:3362201,  w4_sales:0, w5_sales:0, notes:"원재료특성 100% 반영" },
  { id:"m6", year:2026, month:3, category:"BUSH",            sub_category:"BUSH",          year_target:800000000, month_target_rate:66, month_plan:528000000, month_actual:341815317, ytd_actual:782798376, purchase_target_rate:0,  purchase_plan:0, purchase_actual:0, w1_sales:102327540,w2_sales:183701738,w3_sales:131734781,w4_sales:0, w5_sales:0, notes:"CNN 7 BUSH 75% 달성" },
  { id:"m7", year:2026, month:3, category:"전동드라이브",     sub_category:"기타",          year_target:20000000,  month_target_rate:0,  month_plan:0,         month_actual:0,         ytd_actual:15029958,  purchase_target_rate:0,  purchase_plan:0, purchase_actual:0, w1_sales:0, w2_sales:0, w3_sales:0, w4_sales:0, w5_sales:0, notes:"원재료특성 100% 반영" },
];

const INIT_HKMC: HkmcProgress[] = [
  { id:"h1", year:2026, month:3, item_code:"2421750",      item_name:"BUSH 2421750",          customer:"HKMC", monthly_plan:18000, w1_plan:4000, w2_plan:4000, w3_plan:4000, w4_plan:6000, w5_plan:0, w1_actual:3200, w2_actual:0, w3_actual:0, w4_actual:0, w5_actual:0, mtd_actual:3200,  achievement_rate:18, status:"지연", remarks:"이슈: 금형 이상" },
  { id:"h2", year:2026, month:3, item_code:"56170-AA000",  item_name:"스트럿폼패드 AA000",     customer:"HKMC", monthly_plan:80000, w1_plan:18000,w2_plan:18000,w3_plan:20000,w4_plan:24000,w5_plan:0, w1_actual:27365,w2_actual:12161,w3_actual:4909,w4_actual:0, w5_actual:0, mtd_actual:44435, achievement_rate:56, status:"정상", remarks:"" },
  { id:"h3", year:2026, month:3, item_code:"21832-A9001-B",item_name:"방진AS A9001-B",         customer:"HKMC", monthly_plan:15000, w1_plan:3500, w2_plan:3500, w3_plan:3500, w4_plan:4500, w5_plan:0, w1_actual:3672, w2_actual:0, w3_actual:0, w4_actual:0, w5_actual:0, mtd_actual:3672,  achievement_rate:24, status:"정상", remarks:"" },
  { id:"h4", year:2026, month:3, item_code:"SRG45",        item_name:"이너씰 SRG45",           customer:"HKMC", monthly_plan:28000, w1_plan:6000, w2_plan:6000, w3_plan:7000, w4_plan:9000, w5_plan:0, w1_actual:4795, w2_actual:0, w3_actual:0, w4_actual:0, w5_actual:0, mtd_actual:4795,  achievement_rate:17, status:"지연", remarks:"SRG45L 고불량 영향" },
];

const INIT_CUSTOMER: CustomerTarget[] = [
  { id:"ct1", year:2026, month:3, customer:"영동",     division:"BUSH/스트럿",    target_amount:335000000, actual_amount:300090000, gap:-34910000, achievement_rate:90, status:"미달",  action_items:["차기 발주 확보 요청","니코 바이그로멧 재고 부족 → 긴급 조달","SR 번호 드라이 및 30HX 이너씰 백오더 확인"] },
  { id:"ct2", year:2026, month:3, customer:"익THK",    division:"이너씰/베어링",  target_amount:150000000, actual_amount:223530000, gap:73530000,  achievement_rate:149,status:"초과",  action_items:["AV 진행 추급 및 예정 확인","삼성테크노(수) 공장 특정 번호 집중 발주 SR15/30X"] },
  { id:"ct3", year:2026, month:3, customer:"화성업",   division:"방진/스플라이너",target_amount:613150000, actual_amount:568060000, gap:-45090000, achievement_rate:93, status:"미달",  action_items:["HKMC OEM 실적 저조로 인한 발주 감소","PHA 출고(070/073) 5,000만원 수주 요청","코모스 생산 공장 3월 조립 계획 접수"] },
  { id:"ct4", year:2026, month:3, customer:"SECO AIA", division:"방진AS/BUSH",   target_amount:731450000, actual_amount:659960000, gap:-71490000, achievement_rate:90, status:"미달",  action_items:["내수 납품 완료 → KD 출고 진행 완료(2/27)","STR 스트 퍼 수발주 → 일조립 계획 감소","평화산업 CN7 BUSH 및 SECO 이너씰 혼레트"] },
];

// ── 월별 매출 현황 페이지 ─────────────────────────────────────────────────────
function MonthlySalesPage({ data, setData }: { data: MonthlySalesCategory[]; setData: React.Dispatch<React.SetStateAction<MonthlySalesCategory[]>> }) {
  const [modal, setModal] = useState(false);
  const [f, setF] = useState<MonthlySalesCategory>({
    id: uid(), year: 2026, month: 3, category: "", sub_category: "",
    year_target: 0, month_target_rate: 0, month_plan: 0, month_actual: 0, ytd_actual: 0,
    purchase_target_rate: 0, purchase_plan: 0, purchase_actual: 0,
    w1_sales: 0, w2_sales: 0, w3_sales: 0, w4_sales: 0, w5_sales: 0, notes: "",
  });

  const totals = useMemo(() => ({
    yearTarget: data.reduce((a, d) => a + d.year_target, 0),
    monthPlan:  data.reduce((a, d) => a + d.month_plan, 0),
    monthAct:   data.reduce((a, d) => a + d.month_actual, 0),
    ytd:        data.reduce((a, d) => a + d.ytd_actual, 0),
  }), [data]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatC label="연간 목표" value={`${Math.round(totals.yearTarget / 100000000)}억`} unit="원" />
        <StatC label="월 계획" value={`${Math.round(totals.monthPlan / 10000)}만`} unit="원" />
        <StatC label="월 실적" value={`${Math.round(totals.monthAct / 10000)}만`} unit="원" />
        <StatC label="누계 실적" value={`${Math.round(totals.ytd / 100000000)}억`} unit="원" />
      </div>

      <div className="flex justify-end">
        <Btn v="primary" icon={<Plus size={12} />} onClick={() => setModal(true)}>항목 추가</Btn>
      </div>

      <Tbl cols={["제품군", "연간목표↓", "월계획율", "월계획↓", "월실적↓", "달성율", "1주↓", "2주↓", "3주↓", "4주↓", "비고"]}>
        {data.map(d => {
          const rate = fp(d.month_actual, d.month_plan);
          return (
            <TR key={d.id}>
              <TD bold>{d.category}<br /><span className="font-normal text-slate-400" style={{ fontSize: 9 }}>{d.sub_category}</span></TD>
              <td className="px-3 py-2 text-right tabular-nums text-slate-500" style={{ fontSize: 11 }}>{Math.round(d.year_target / 100000000)}억</td>
              <TD r>{d.month_target_rate}%</TD>
              <td className="px-3 py-2 text-right tabular-nums text-[#1e2247] font-semibold" style={{ fontSize: 11 }}>{Math.round(d.month_plan / 10000)}만</td>
              <td className="px-3 py-2 text-right tabular-nums text-[#1e2247] font-bold" style={{ fontSize: 11 }}>{Math.round(d.month_actual / 10000)}만</td>
              <td className="px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-14 overflow-hidden rounded-full bg-[#eef1f8]">
                    <div className={`h-full rounded-full ${rate >= 100 ? "bg-emerald-500" : rate >= 80 ? "bg-[#5c6bc0]" : "bg-amber-400"}`} style={{ width: `${Math.min(100, rate)}%` }} />
                  </div>
                  <span className={`tabular-nums font-bold ${rate >= 100 ? "text-emerald-600" : rate >= 80 ? "text-[#5c6bc0]" : "text-amber-500"}`} style={{ fontSize: 10 }}>{rate}%</span>
                </div>
              </td>
              {[d.w1_sales, d.w2_sales, d.w3_sales, d.w4_sales].map((w, i) => (
                <td key={i} className="px-3 py-2 text-right tabular-nums text-slate-500" style={{ fontSize: 10 }}>
                  {w > 0 ? Math.round(w / 10000) + "만" : "—"}
                </td>
              ))}
              <TD muted cls="max-w-36 truncate">{d.notes}</TD>
            </TR>
          );
        })}
        <tr className="bg-[#f0f2fa] border-t border-[#e8eaf0]">
          <td className="px-3 py-2 font-bold text-[#1e2247]" style={{ fontSize: 11 }}>합 계</td>
          <td className="px-3 py-2 text-right tabular-nums font-bold text-[#1e2247]" style={{ fontSize: 11 }}>{Math.round(totals.yearTarget / 100000000)}억</td>
          <td className="px-3 py-2 text-right text-slate-400" style={{ fontSize: 10 }}>—</td>
          <td className="px-3 py-2 text-right tabular-nums font-bold text-[#1e2247]" style={{ fontSize: 11 }}>{Math.round(totals.monthPlan / 10000)}만</td>
          <td className="px-3 py-2 text-right tabular-nums font-bold text-[#5c6bc0]" style={{ fontSize: 11 }}>{Math.round(totals.monthAct / 10000)}만</td>
          <td className="px-3 py-2">
            <span className={`font-bold tabular-nums ${fp(totals.monthAct, totals.monthPlan) >= 100 ? "text-emerald-600" : "text-[#5c6bc0]"}`} style={{ fontSize: 12 }}>
              {fp(totals.monthAct, totals.monthPlan)}%
            </span>
          </td>
          <td colSpan={5} />
        </tr>
      </Tbl>

      {modal && (
        <Modal title="월별 매출 항목 추가" onClose={() => setModal(false)} wide>
          <div className="grid grid-cols-2 gap-3">
            <Fld label="연도"><Inp type="number" value={f.year} onChange={e => setF(p => ({ ...p, year: +e.target.value }))} /></Fld>
            <Fld label="월"><Inp type="number" value={f.month} onChange={e => setF(p => ({ ...p, month: +e.target.value }))} /></Fld>
            <Fld label="제품군명" req><Inp value={f.category} onChange={e => setF(p => ({ ...p, category: e.target.value }))} /></Fld>
            <Fld label="세부분류"><Inp value={f.sub_category ?? ""} onChange={e => setF(p => ({ ...p, sub_category: e.target.value }))} /></Fld>
            <Fld label="연간 목표(원)"><Inp type="number" value={f.year_target} onChange={e => setF(p => ({ ...p, year_target: +e.target.value }))} /></Fld>
            <Fld label="월 계획율(%)"><Inp type="number" value={f.month_target_rate} onChange={e => setF(p => ({ ...p, month_target_rate: +e.target.value }))} /></Fld>
            <Fld label="월 계획(원)"><Inp type="number" value={f.month_plan} onChange={e => setF(p => ({ ...p, month_plan: +e.target.value }))} /></Fld>
            <Fld label="월 실적(원)"><Inp type="number" value={f.month_actual} onChange={e => setF(p => ({ ...p, month_actual: +e.target.value }))} /></Fld>
            {[1,2,3,4].map(n => (
              <Fld key={n} label={`${n}주 실적(원)`}>
                <Inp type="number" value={(f as unknown as Record<string,number>)[`w${n}_sales`]} onChange={e => setF(p => ({ ...p, [`w${n}_sales`]: +e.target.value }))} />
              </Fld>
            ))}
            <div className="col-span-2"><Fld label="비고"><Inp value={f.notes} onChange={e => setF(p => ({ ...p, notes: e.target.value }))} /></Fld></div>
          </div>
          <SaveBar onSave={() => { setData(p => [{ ...f, id: uid() }, ...p]); setModal(false); }} onClose={() => setModal(false)} />
        </Modal>
      )}
    </div>
  );
}

// ── HKMC OEM 생산진도 페이지 ─────────────────────────────────────────────────
function HkmcPage({ data, setData }: { data: HkmcProgress[]; setData: React.Dispatch<React.SetStateAction<HkmcProgress[]>> }) {
  const [modal, setModal] = useState(false);
  const [f, setF] = useState<HkmcProgress>({
    id: uid(), year: 2026, month: 3, item_code: "", item_name: "", customer: "HKMC",
    monthly_plan: 0, w1_plan:0, w2_plan:0, w3_plan:0, w4_plan:0, w5_plan:0,
    w1_actual:0, w2_actual:0, w3_actual:0, w4_actual:0, w5_actual:0,
    mtd_actual: 0, achievement_rate: 0, status: "정상", remarks: "",
  });

  const WEEKS = ["1주","2주","3주","4주","5주"];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <StatC label="전체 품목" value={data.length} unit="종" />
        <StatC label="지연" value={data.filter(d => d.status === "지연").length} unit="종" warn={data.some(d => d.status === "지연")} />
        <StatC label="평균 달성률" value={data.length ? Math.round(data.reduce((a, d) => a + d.achievement_rate, 0) / data.length) : 0} unit="%" />
      </div>

      <div className="flex justify-end">
        <Btn v="primary" icon={<Plus size={12} />} onClick={() => setModal(true)}>항목 추가</Btn>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#e8eaf0] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#f7f8fc] border-b border-[#eef1f8]">
                <th className="px-3 py-2 text-left" style={{ fontSize: 9 }} rowSpan={2}>품목코드</th>
                <th className="px-3 py-2 text-left" style={{ fontSize: 9 }} rowSpan={2}>품목명</th>
                <th className="px-3 py-2 text-right font-semibold uppercase text-slate-400" style={{ fontSize: 9 }} rowSpan={2}>월 계획</th>
                {WEEKS.map(w => (
                  <th key={w} colSpan={2} className="px-3 py-1.5 text-center font-semibold uppercase text-slate-400 border-l border-[#eef1f8]" style={{ fontSize: 9 }}>{w}</th>
                ))}
                <th className="px-3 py-2 text-right font-semibold uppercase text-slate-400 border-l border-[#eef1f8]" style={{ fontSize: 9 }} rowSpan={2}>MTD</th>
                <th className="px-3 py-2 text-right font-semibold uppercase text-slate-400" style={{ fontSize: 9 }} rowSpan={2}>달성률</th>
                <th className="px-3 py-2 text-left" style={{ fontSize: 9 }} rowSpan={2}>상태</th>
              </tr>
              <tr className="bg-[#f7f8fc] border-b border-[#eef1f8]">
                {WEEKS.map(w => (
                  <>
                    <th key={`${w}p`} className="px-2 py-1 text-right font-semibold text-indigo-400 border-l border-[#eef1f8]" style={{ fontSize: 8 }}>계획</th>
                    <th key={`${w}a`} className="px-2 py-1 text-right font-semibold text-emerald-500" style={{ fontSize: 8 }}>실적</th>
                  </>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f3f4f9] text-[11px]">
              {data.map(d => {
                const st = HKMC_S[d.status] ?? { l: d.status, c: "gray" };
                return (
                  <tr key={d.id} className="hover:bg-[#f7f8fc]/60 transition-colors">
                    <TD mono>{d.item_code}</TD>
                    <TD bold>{d.item_name}</TD>
                    <TD r>{fc(d.monthly_plan)}</TD>
                    {[1,2,3,4,5].map(n => {
                      const plan   = (d as unknown as Record<string,number>)[`w${n}_plan`];
                      const actual = (d as unknown as Record<string,number>)[`w${n}_actual`];
                      return (
                        <>
                          <td key={`${n}p`} className="px-2 py-2 text-right tabular-nums text-[#5c6bc0] border-l border-[#f3f4f9]" style={{ fontSize: 10 }}>{plan > 0 ? fc(plan) : "—"}</td>
                          <td key={`${n}a`} className={`px-2 py-2 text-right tabular-nums font-semibold ${actual > plan && plan > 0 ? "text-emerald-600" : actual < plan && plan > 0 && actual > 0 ? "text-amber-500" : "text-[#1e2247]"}`} style={{ fontSize: 10 }}>{actual > 0 ? fc(actual) : "—"}</td>
                        </>
                      );
                    })}
                    <td className="border-l border-[#f3f4f9] px-3 py-2 text-right tabular-nums font-bold text-[#1e2247]" style={{ fontSize: 11 }}>{fc(d.mtd_actual)}</td>
                    <td className={`px-3 py-2 text-right tabular-nums font-bold ${d.achievement_rate >= 90 ? "text-emerald-600" : d.achievement_rate >= 60 ? "text-amber-500" : "text-red-500"}`} style={{ fontSize: 12 }}>
                      {d.achievement_rate}%
                    </td>
                    <td className="px-3 py-2"><Badge l={st.l} c={st.c} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <Modal title="HKMC OEM 진도 항목 추가" onClose={() => setModal(false)} xl>
          <div className="grid grid-cols-3 gap-3">
            <Fld label="품목코드" req><Inp value={f.item_code} onChange={e => setF(p => ({ ...p, item_code: e.target.value }))} /></Fld>
            <div className="col-span-2"><Fld label="품목명" req><Inp value={f.item_name} onChange={e => setF(p => ({ ...p, item_name: e.target.value }))} /></Fld></div>
            <Fld label="고객사"><Sl v={f.customer} set={v => setF(p => ({ ...p, customer: v }))} opts={["HKMC","평화산업","SECO AIA"].map(x => ({ value: x, label: x }))} /></Fld>
            <Fld label="월 계획수량"><Inp type="number" value={f.monthly_plan} onChange={e => setF(p => ({ ...p, monthly_plan: +e.target.value }))} /></Fld>
            <Fld label="상태"><Sl v={f.status} set={v => setF(p => ({ ...p, status: v as HkmcProgress["status"] }))} opts={["정상","지연","완료"].map(x => ({ value: x, label: x }))} /></Fld>
            {[1,2,3,4,5].map(n => (
              <>
                <Fld key={`${n}p`} label={`${n}주 계획`}><Inp type="number" value={(f as unknown as Record<string,number>)[`w${n}_plan`]} onChange={e => setF(p => ({ ...p, [`w${n}_plan`]: +e.target.value }))} /></Fld>
                <Fld key={`${n}a`} label={`${n}주 실적`}><Inp type="number" value={(f as unknown as Record<string,number>)[`w${n}_actual`]} onChange={e => setF(p => ({ ...p, [`w${n}_actual`]: +e.target.value }))} /></Fld>
              </>
            ))}
            <div className="col-span-3"><Fld label="비고"><Inp value={f.remarks ?? ""} onChange={e => setF(p => ({ ...p, remarks: e.target.value }))} /></Fld></div>
          </div>
          <SaveBar onSave={() => {
            const mtd = [1,2,3,4,5].reduce((a, n) => a + ((f as unknown as Record<string,number>)[`w${n}_actual`] ?? 0), 0);
            setData(p => [{ ...f, id: uid(), mtd_actual: mtd, achievement_rate: fp(mtd, f.monthly_plan) }, ...p]);
            setModal(false);
          }} onClose={() => setModal(false)} />
        </Modal>
      )}
    </div>
  );
}

// ── 고객사별 목표/실적 페이지 ─────────────────────────────────────────────────
function CustomerPage({ data, setData }: { data: CustomerTarget[]; setData: React.Dispatch<React.SetStateAction<CustomerTarget[]>> }) {
  const [modal, setModal] = useState(false);
  const [f, setF] = useState<CustomerTarget>({
    id: uid(), year: 2026, month: 3, customer: "", division: "",
    target_amount: 0, actual_amount: 0, gap: 0, achievement_rate: 0,
    action_items: [""], status: "미달",
  });
  const [newAction, setNewAction] = useState("");

  const totals = useMemo(() => ({
    target: data.reduce((a, d) => a + d.target_amount, 0),
    actual: data.reduce((a, d) => a + d.actual_amount, 0),
    gap:    data.reduce((a, d) => a + d.gap, 0),
  }), [data]);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <StatC label="목표 합계" value={`${Math.round(totals.target / 10000)}만`} unit="원" />
        <StatC label="실적 합계" value={`${Math.round(totals.actual / 10000)}만`} unit="원" />
        <StatC label="차이" value={`${totals.gap >= 0 ? "+" : ""}${Math.round(totals.gap / 10000)}만`} unit="원" warn={totals.gap < 0} />
      </div>

      <div className="flex justify-end">
        <Btn v="primary" icon={<Plus size={12} />} onClick={() => setModal(true)}>고객사 추가</Btn>
      </div>

      <div className="space-y-4">
        {data.map(d => {
          const st = CUST_S[d.status] ?? { l: d.status, c: "gray" };
          const rate = fp(d.actual_amount, d.target_amount);
          return (
            <div key={d.id} className="rounded-2xl border border-[#e8eaf0] bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#1e2247]" style={{ fontSize: 15 }}>{d.customer}</span>
                    <Badge l={st.l} c={st.c} />
                    <span className="text-slate-400" style={{ fontSize: 11 }}>{d.division}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-end gap-6">
                    {[
                      { label: "목표", value: Math.round(d.target_amount / 10000), color: "text-[#1e2247]" },
                      { label: "실적", value: Math.round(d.actual_amount / 10000), color: rate >= 100 ? "text-emerald-600" : "text-[#5c6bc0]" },
                    ].map(k => (
                      <div key={k.label}>
                        <p className="text-slate-400" style={{ fontSize: 9 }}>{k.label}</p>
                        <p className={`font-bold tabular-nums ${k.color}`} style={{ fontSize: 20 }}>
                          {k.value}<span className="ml-0.5 font-normal text-slate-400" style={{ fontSize: 11 }}>만원</span>
                        </p>
                      </div>
                    ))}
                    <div>
                      <p className="text-slate-400" style={{ fontSize: 9 }}>달성률</p>
                      <p className={`font-bold tabular-nums ${rate >= 100 ? "text-emerald-600" : rate >= 85 ? "text-[#5c6bc0]" : "text-red-500"}`} style={{ fontSize: 20 }}>
                        {rate}<span className="ml-0.5 font-normal text-slate-400" style={{ fontSize: 11 }}>%</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-400" style={{ fontSize: 9 }}>차이</p>
                      <p className={`flex items-center font-bold tabular-nums ${d.gap >= 0 ? "text-emerald-600" : "text-red-500"}`} style={{ fontSize: 14 }}>
                        {d.gap >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                        {Math.abs(Math.round(d.gap / 10000))}만원
                      </p>
                    </div>
                  </div>
                </div>
                <div className="min-w-[140px] pt-1">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-[#eef1f8]">
                    <div className={`h-full rounded-full ${rate >= 100 ? "bg-emerald-500" : rate >= 85 ? "bg-[#5c6bc0]" : "bg-red-400"}`} style={{ width: `${Math.min(100, rate)}%` }} />
                  </div>
                  <p className="mt-1.5 text-right tabular-nums text-slate-400" style={{ fontSize: 10 }}>{rate}% 달성</p>
                </div>
              </div>
              {d.action_items.filter(Boolean).length > 0 && (
                <div className="mt-4 border-t border-[#eef1f8] pt-4">
                  <p className="mb-2 font-semibold text-slate-500" style={{ fontSize: 10 }}>개선/조치 사항</p>
                  <ul className="space-y-1.5">
                    {d.action_items.filter(Boolean).map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-600" style={{ fontSize: 11 }}>
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#5c6bc0]" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 종합 합계 */}
      <div className="rounded-2xl border border-[#5c6bc0]/20 bg-[#f0f2fa] p-5">
        <div className="flex items-center justify-between">
          <span className="font-bold text-[#1e2247]" style={{ fontSize: 13 }}>전체 합계</span>
          <div className="flex items-center gap-8">
            {[
              { l: "목표", v: Math.round(totals.target / 10000) + "만", c: "text-[#1e2247]" },
              { l: "실적", v: Math.round(totals.actual / 10000) + "만", c: "text-[#5c6bc0]" },
              { l: "달성률", v: fp(totals.actual, totals.target) + "%", c: fp(totals.actual, totals.target) >= 100 ? "text-emerald-600" : "text-red-500" },
            ].map(k => (
              <div key={k.l} className="text-right">
                <p className="text-slate-400" style={{ fontSize: 9 }}>{k.l}</p>
                <p className={`font-bold tabular-nums ${k.c}`} style={{ fontSize: 18 }}>{k.v}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {modal && (
        <Modal title="고객사 현황 추가" onClose={() => setModal(false)} wide>
          <div className="grid grid-cols-2 gap-3">
            <Fld label="고객사명" req><Inp value={f.customer} onChange={e => setF(p => ({ ...p, customer: e.target.value }))} /></Fld>
            <Fld label="사업 부문"><Inp value={f.division} onChange={e => setF(p => ({ ...p, division: e.target.value }))} /></Fld>
            <Fld label="목표금액(원)" req><Inp type="number" value={f.target_amount} onChange={e => setF(p => ({ ...p, target_amount: +e.target.value }))} /></Fld>
            <Fld label="실적금액(원)" req><Inp type="number" value={f.actual_amount} onChange={e => setF(p => ({ ...p, actual_amount: +e.target.value }))} /></Fld>
            <Fld label="상태"><Sl v={f.status} set={v => setF(p => ({ ...p, status: v as CustomerTarget["status"] }))} opts={["달성","미달","초과"].map(x => ({ value: x, label: x }))} /></Fld>
          </div>
          <div className="mt-3">
            <p className="mb-2 font-semibold text-slate-500" style={{ fontSize: 10 }}>개선/조치 사항</p>
            {f.action_items.filter(Boolean).map((item, i) => (
              <div key={i} className="mb-1.5 flex items-center gap-1.5">
                <span className="flex-1 rounded-lg border border-[#e8eaf0] bg-slate-50 px-2.5 py-1.5 text-[11px] text-slate-700">{item}</span>
                <button onClick={() => setF(p => ({ ...p, action_items: p.action_items.filter((_, j) => j !== i) }))} className="text-red-400 hover:text-red-600" style={{ fontSize: 12 }}>✕</button>
              </div>
            ))}
            <div className="flex gap-1.5">
              <input className="h-8 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-[11px] outline-none focus:border-[#5c6bc0]"
                placeholder="조치 사항 입력 후 Enter" value={newAction} onChange={e => setNewAction(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter" && newAction.trim()) { setF(p => ({ ...p, action_items: [...p.action_items, newAction] })); setNewAction(""); } }} />
              <Btn v="secondary" onClick={() => { if (newAction.trim()) { setF(p => ({ ...p, action_items: [...p.action_items, newAction] })); setNewAction(""); } }}>추가</Btn>
            </div>
          </div>
          <SaveBar onSave={() => {
            const gap = f.actual_amount - f.target_amount;
            setData(p => [{ ...f, id: uid(), gap, achievement_rate: fp(f.actual_amount, f.target_amount) }, ...p]);
            setModal(false);
          }} onClose={() => setModal(false)} />
        </Modal>
      )}
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────────────────
type SPage = "monthly" | "hkmc" | "customer" | null;

export default function SalesSection() {
  const [openPage, setOpenPage] = useState<SPage>(null);
  const [monthly, setMonthly] = useState<MonthlySalesCategory[]>(INIT_MONTHLY);
  const [hkmc, setHkmc] = useState<HkmcProgress[]>(INIT_HKMC);
  const [customers, setCustomers] = useState<CustomerTarget[]>(INIT_CUSTOMER);

  const totalTarget = customers.reduce((a, c) => a + c.target_amount, 0);
  const totalActual = customers.reduce((a, c) => a + c.actual_amount, 0);
  const underPerf   = customers.filter(c => c.status === "미달").length;

  const cards: LandingCardDef[] = [
    {
      key: "monthly",
      label: "월별 매출 현황",
      desc: "제품군별 연간 목표 대비 월 계획·실적과 주차별 매출 흐름을 추적합니다.",
      Icon: TrendingUp,
      count: monthly.length,
      extra: `월 달성률 ${fp(monthly.reduce((a,d)=>a+d.month_actual,0), monthly.reduce((a,d)=>a+d.month_plan,0))}%`,
      color: "#5c6bc0",
    },
    {
      key: "hkmc",
      label: "HKMC OEM 생산진도",
      desc: "HKMC 납품 품목별 주차 계획 대비 실적, MTD 달성률을 관리합니다.",
      Icon: BarChart2,
      count: hkmc.length,
      alert: hkmc.filter(h => h.status === "지연").length,
      color: "#0891b2",
    },
    {
      key: "customer",
      label: "고객사별 목표·실적",
      desc: "고객사별 매출 목표 달성 현황, 차이 분석, 조치사항을 관리합니다.",
      Icon: Users2,
      count: customers.length,
      alert: underPerf,
      extra: `종합 달성률 ${fp(totalActual, totalTarget)}%`,
      color: "#7c3aed",
    },
  ];

  const PAGE_TITLE: Record<string, string> = {
    monthly:  "월별 매출 현황",
    hkmc:     "HKMC OEM 생산진도",
    customer: "고객사별 목표·실적",
  };

  return (
    <div>
      <div className="mb-6">
        <p className="mb-3 font-bold text-[#0a2535]" style={{ fontSize: 14 }}>고객사별 매출 현황 (2026-02)</p>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {CUSTOMER_SALES.map((c) => (
            <div
              key={c.customer}
              className="rounded-2xl border border-[#e8eaf0] bg-white p-4 shadow-sm transition hover:shadow-md cursor-pointer"
              onClick={() => setOpenPage("customer")}
            >
              <p className="font-bold text-[#0d1117]" style={{ fontSize: 13 }}>{c.customer}</p>
              <div className="mt-2 flex items-baseline gap-1">
                <span className={`font-black ${c.rate >= 95 ? "text-emerald-600" : c.rate >= 90 ? "text-amber-600" : "text-red-500"}`} style={{ fontSize: 22 }}>{c.rate.toFixed(1)}%</span>
                <span className="text-slate-500" style={{ fontSize: 10 }}>달성</span>
              </div>
              <p className="mt-1 text-slate-500" style={{ fontSize: 10 }}>목표 {(c.target/1000).toFixed(0)}천 / 실적 {(c.actual/1000).toFixed(0)}천</p>
              {c.cause && <p className="mt-1 truncate text-amber-600" style={{ fontSize: 9 }}>원인: {c.cause}</p>}
              {c.action && <p className="mt-0.5 truncate text-slate-500" style={{ fontSize: 9 }}>대책: {c.action}</p>}
            </div>
          ))}
        </div>
      </div>
      <SectionLanding
        title="영업 개발 / 수주 관리"
        sub="월별 매출현황 · HKMC OEM 진도 · 고객사별 목표 실적"
        cards={cards}
        onOpen={k => setOpenPage(k as SPage)}
      />

      {openPage && (() => {
        let exData: ExcelRow[] = [];
        let exHeaders: Record<string, string> = {};
        let exFilename = "영업관리";

        if (openPage === "monthly") {
          exData = monthly as unknown as ExcelRow[];
          exHeaders = { "연도":"year","월":"month","제품군":"category","세부분류":"sub_category","연간목표":"year_target","월계획율":"month_target_rate","월계획":"month_plan","월실적":"month_actual","누계실적":"ytd_actual","1주":"w1_sales","2주":"w2_sales","3주":"w3_sales","4주":"w4_sales","비고":"notes" };
          exFilename = "월별매출현황";
        } else if (openPage === "hkmc") {
          exData = hkmc as unknown as ExcelRow[];
          exHeaders = { "품목코드":"item_code","품목명":"item_name","고객사":"customer","월계획":"monthly_plan","1주계획":"w1_plan","1주실적":"w1_actual","2주계획":"w2_plan","2주실적":"w2_actual","3주계획":"w3_plan","3주실적":"w3_actual","MTD":"mtd_actual","달성률":"achievement_rate","상태":"status" };
          exFilename = "HKMC_OEM_진도";
        } else if (openPage === "customer") {
          exData = customers as unknown as ExcelRow[];
          exHeaders = { "고객사":"customer","사업부문":"division","목표금액":"target_amount","실적금액":"actual_amount","차이":"gap","달성률":"achievement_rate","상태":"status" };
          exFilename = "고객사별목표실적";
        }

        return (
          <PageModal
            title={PAGE_TITLE[openPage]}
            section="영업 관리"
            onClose={() => setOpenPage(null)}
            actions={
              <div className="flex items-center gap-1.5">
                <ExcelExportBtn data={exData} options={{ filename: exFilename, sheetName: PAGE_TITLE[openPage], headers: exHeaders }} />
                <PrintBtn title={PAGE_TITLE[openPage]} printId="sales-content" />
              </div>
            }
          >
            <div id="sales-content">
              {openPage === "monthly"  && <MonthlySalesPage data={monthly}   setData={setMonthly} />}
              {openPage === "hkmc"     && <HkmcPage         data={hkmc}      setData={setHkmc} />}
              {openPage === "customer" && <CustomerPage     data={customers} setData={setCustomers} />}
            </div>
          </PageModal>
        );
      })()}
    </div>
  );
}
