"use client";
/**
 * F.A.C.T Manufacturing ERP — Design System v4
 * Reference: CRM Dashboard (Atul Dhone)
 *
 * Palette
 *   sidebar   #1e2247  (deep indigo-navy)
 *   topbar    #252b5e
 *   primary   #5c6bc0  (indigo)
 *   page-bg   #eef1f8
 *   card      #ffffff
 *   txt-1     #1e2247
 *   txt-2     #9498b2
 *   success   #44b884
 *   warning   #ffb800
 *   danger    #f44336
 *
 * Font scale (compact — matches reference image)
 *   hero     28-32px
 *   h1       16px
 *   h2       13px
 *   body     11px
 *   small    10px
 *   micro    9px
 */

import { useState, useEffect, useCallback, useMemo } from "react";
import {
  LayoutDashboard, Factory, ClipboardCheck,
  ShoppingBag, Truck, FileBarChart2, Bell, Search, Plus,
  RefreshCw, Download, Save, X, Printer, AlertTriangle,
  CheckCircle2, ArrowUpRight, ArrowDownRight, Settings,
  ChevronRight, MoreHorizontal, LogOut, Shield, User,
  Cpu, FileSignature,
} from "lucide-react";
import LoginPage, { type AuthUser } from "./LoginPage";
import {
  listQualityNCRs, createQualityNCR, updateQualityNCRStatus,
  listInventoryLedger, listInventoryTransactions, createInventoryTransaction,
  getProductionInquiries, createProductionInquiry, updateProductionInquiry,
  type QualityNCR, type QualityNCRUpsertPayload,
  type InventoryLedger, type InventoryTransaction,
  type InventoryTransactionCreatePayload,
  type ProductionInquiry, type ProductionInquiryUpsertPayload,
} from "@/lib/api";
import ProductionSection from "./sections/ProductionSection";
import QualitySection    from "./sections/QualitySection";
import SalesSection      from "./sections/SalesSection";
import PurchaseSection   from "./sections/PurchaseSection";
import AislvinaSection   from "./sections/AislvinaSection";
import ReportSection     from "./sections/ReportSection";
import ApprovalSection   from "./sections/ApprovalSection";
import FileImportButton, { type ParsedRow } from "./FileImportButton";
import { DASHBOARD_KPIS, CUSTOMER_SALES } from "@/lib/fact-plan-data";

// ─── types & mock data ────────────────────────────────────────────────────────

type NavKey = "dashboard"|"production"|"quality"|"sales"|"purchase"|"aislvina"|"reports"|"approvals";

interface SalesOrder { id:string;order_no:string;customer:string;product_name:string;order_qty:number;shipped_qty:number;order_date:string;due_date:string;status:string;amount:number;is_delayed:boolean; }
interface PurchReq    { id:string;pr_no:string;material_name:string;qty:number;unit:string;required_date:string;status:string;requester:string;reason:string;vendor?:string; }

const SALES: SalesOrder[] = [
  {id:"s1",order_no:"SO-2026-031201",customer:"평화산업",  product_name:"스트럿 폼패드 좌품", order_qty:5000,shipped_qty:3200,order_date:"2026-03-01",due_date:"2026-03-20",status:"in_production",amount:15000000,is_delayed:false},
  {id:"s2",order_no:"SO-2026-031202",customer:"HKMC",      product_name:"부스가공품 MX5-070",  order_qty:2000,shipped_qty:2000,order_date:"2026-02-20",due_date:"2026-03-10",status:"shipped",       amount:8400000, is_delayed:true },
  {id:"s3",order_no:"SO-2026-031203",customer:"SECO AIA",  product_name:"BUSH 조립품",        order_qty:1200,shipped_qty:0,   order_date:"2026-03-05",due_date:"2026-03-25",status:"received",      amount:4800000, is_delayed:false},
  {id:"s4",order_no:"SO-2026-031204",customer:"현대모비스",product_name:"HORN 조립반제품",    order_qty:3000,shipped_qty:1500,order_date:"2026-03-08",due_date:"2026-03-28",status:"in_production",amount:12000000,is_delayed:false},
  {id:"s5",order_no:"SO-2026-031205",customer:"평화산업",  product_name:"INNER SEAL A",       order_qty:800, shipped_qty:800, order_date:"2026-02-15",due_date:"2026-03-05",status:"completed",     amount:2400000, is_delayed:false},
];
const PRS: PurchReq[] = [
  {id:"p1",pr_no:"PR-2026-031201",material_name:"스트럿 폼패드 원자재", qty:2000,unit:"EA",required_date:"2026-03-18",status:"approved", requester:"생산팀",reason:"재고 부족",         vendor:"㈜한국폼"},
  {id:"p2",pr_no:"PR-2026-031202",material_name:"BUSH 760 TYPE 소재",  qty:500, unit:"EA",required_date:"2026-03-20",status:"ordered",  requester:"생산팀",reason:"생산계획 반영",     vendor:"금속부품㈜"},
  {id:"p3",pr_no:"PR-2026-031203",material_name:"INNER SEAL A TYPE-A", qty:300, unit:"EA",required_date:"2026-03-22",status:"requested",requester:"품질팀",reason:"NCR 불량품 폐기분 보충"},
  {id:"p4",pr_no:"PR-2026-031204",material_name:"MX5-070 가공 소재",   qty:1000,unit:"EA",required_date:"2026-03-15",status:"received", requester:"생산팀",reason:"긴급 수주 대응",    vendor:"정밀기계㈜"},
];

const PROD_TR   = [72,78,82,80,85,87,83,89,87,91,88,87];
const DEFECT_TR = [3.2,3.0,2.8,2.5,2.3,2.1,1.9,1.8,1.6,1.9,1.7,1.8];
const SALES_TR  = [310,335,380,350,400,426];
const MO6       = ["10월","11월","12월","1월","2월","3월"];

// ─── 백엔드 오프라인 시 대시보드용 목(mock) 데이터 ────────────────────────────
// NEXT_PUBLIC_API_ENABLED=false 환경에서 fetch 없이 대시보드를 채웁니다.
const MOCK_NCRS: QualityNCR[] = [
  { id:"n1", ncr_no:"NCR-2026-031201", detected_at:"2026-03-04", department_code:"QC", item_code:"SRG45",   item_name:"이너씰 SRG45",  defect_type:"치수불량", defect_qty:2028, total_qty:9228, defect_rate:22.0, severity:"critical", status:"open",          detected_by:"품질팀", root_cause:"금형 마모",   action_taken:"금형 교체 진행",    resolved_at:null,         customer_name:"HKMC",  remark:null },
  { id:"n2", ncr_no:"NCR-2026-031202", detected_at:"2026-03-03", department_code:"QC", item_code:"RB09Z1",  item_name:"고무류 RB09Z1", defect_type:"성형불량", defect_qty:3146, total_qty:10146,defect_rate:31.0, severity:"major",    status:"investigating", detected_by:"생산팀", root_cause:"금형 불량",  action_taken:"원인 분석 중",      resolved_at:null,         customer_name:"HKMC",  remark:null },
  { id:"n3", ncr_no:"NCR-2026-031203", detected_at:"2026-03-02", department_code:"QC", item_code:"2421760", item_name:"BUSH 2421760",  defect_type:"기포불량", defect_qty:185,  total_qty:16758,defect_rate:1.1,  severity:"major",    status:"resolved",      detected_by:"품질팀", root_cause:"배합 불균일",action_taken:"배합 조건 변경 완료",resolved_at:"2026-03-07",customer_name:"화성업",remark:null },
];
const MOCK_LEDG: InventoryLedger[] = [
  { id:"l1", item_code:"SRG45-MAT",  item_name:"이너씰 SRG45 소재",  spec:null, unit:"EA", warehouse:"원자재창고", stock_qty:500,  safety_stock:2000, is_below_safety:true,  last_updated:"2026-03-07" },
  { id:"l2", item_code:"SR15-MAT",   item_name:"SR15 이너씰 원자재", spec:null, unit:"EA", warehouse:"원자재창고", stock_qty:0,    safety_stock:1000, is_below_safety:true,  last_updated:"2026-03-07" },
  { id:"l3", item_code:"56170-MAT",  item_name:"스트럿폼패드 원자재",spec:null, unit:"EA", warehouse:"원자재창고", stock_qty:8000, safety_stock:5000, is_below_safety:false, last_updated:"2026-03-07" },
];
const MOCK_INQS: ProductionInquiry[] = [
  { id:"i1", inquiry_no:"INQ-2026-031201", production_date:"2026-03-10", workorder_no:"WO-2026-03-001", item_code:"2421750",     item_name:"BUSH 2421750",    spec:null, unit:"EA", planned_qty:5000,  receipt_qty:0,    warehouse:"완제품창고", status:"입고예정", remark:"정기 입고" },
  { id:"i2", inquiry_no:"INQ-2026-031202", production_date:"2026-03-11", workorder_no:"WO-2026-03-004", item_code:"SRG45",       item_name:"이너씰 SRG45",    spec:null, unit:"EA", planned_qty:10000, receipt_qty:4795, warehouse:"완제품창고", status:"입고중",  remark:"고불량 긴급 보충" },
  { id:"i3", inquiry_no:"INQ-2026-031203", production_date:"2026-03-14", workorder_no:"WO-2026-03-002", item_code:"56170-AA000", item_name:"스트럿폼패드",    spec:null, unit:"EA", planned_qty:20000, receipt_qty:0,    warehouse:"완제품창고", status:"입고예정", remark:"" },
];

// ─── status maps ─────────────────────────────────────────────────────────────

const INQ_S:Record<string,{l:string;c:string}> = {입고예정:{l:"입고예정",c:"gray"},입고중:{l:"입고중",c:"blue"},입고완료:{l:"입고완료",c:"green"},보류:{l:"보류",c:"amber"},반품:{l:"반품",c:"red"}};
const NCR_S:Record<string,{l:string;c:string}> = {open:{l:"미처리",c:"red"},investigating:{l:"조사중",c:"amber"},resolved:{l:"처리완료",c:"green"},closed:{l:"종결",c:"gray"}};
const NCR_V:Record<string,{l:string;c:string}> = {critical:{l:"치명적",c:"red"},major:{l:"주요",c:"amber"},minor:{l:"경미",c:"blue"}};
const SO_S:Record<string,{l:string;c:string}>  = {received:{l:"수주접수",c:"gray"},in_production:{l:"생산중",c:"blue"},ready:{l:"출하대기",c:"sky"},shipped:{l:"출하완료",c:"sky"},completed:{l:"납품완료",c:"green"}};
const PR_S:Record<string,{l:string;c:string}>  = {requested:{l:"요청",c:"gray"},approved:{l:"승인",c:"blue"},ordered:{l:"발주",c:"sky"},received:{l:"입고완료",c:"green"}};
const TX_S:Record<string,{l:string;c:string}>  = {receipt:{l:"입고",c:"green"},issue:{l:"출고",c:"red"},adjust:{l:"조정",c:"amber"},return:{l:"반납",c:"blue"}};

// badge classes (CRM indigo palette)
const BC:Record<string,string> = {
  blue:  "bg-indigo-50  text-indigo-600",
  green: "bg-emerald-50 text-emerald-600",
  amber: "bg-amber-50   text-amber-600",
  red:   "bg-red-50     text-red-500",
  gray:  "bg-slate-100  text-slate-500",
  sky:   "bg-sky-50     text-sky-600",
};

// ─── utils ────────────────────────────────────────────────────────────────────

const fd  = (s:string) => String(s).slice(0,10);
const fa  = (n:number) => `₩${(n/10000).toLocaleString("ko-KR")}만`;
const pct = (a:number,b:number) => b?Math.min(100,Math.round(a/b*100)):0;
const uid = () => Math.random().toString(36).slice(2,10);

// ─── SVG primitives ───────────────────────────────────────────────────────────

/** Donut/ring progress chart (CRM Sale card style) */
function Ring({v,max,sz=72,sw=7,color="#5c6bc0"}:{v:number;max:number;sz?:number;sw?:number;color?:string}) {
  const r=(sz-sw)/2, circ=2*Math.PI*r, dash=max?(v/max)*circ:0;
  return (
    <svg width={sz} height={sz} style={{transform:"rotate(-90deg)"}}>
      <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke="#eef1f8" strokeWidth={sw}/>
      <circle cx={sz/2} cy={sz/2} r={r} fill="none" stroke={color}   strokeWidth={sw}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"/>
    </svg>
  );
}

/** Micro sparkline */
function Spark({data,up=true}:{data:number[];up?:boolean}) {
  const W=60,H=22,mx=Math.max(...data),mn=Math.min(...data),rng=mx-mn||1;
  const pts=data.map((v,i)=>`${(i/(data.length-1))*W},${H-2-((v-mn)/rng)*(H-6)}`).join(" ");
  const stroke=up?"#44b884":"#f44336";
  return (
    <svg width={W} height={H} className="shrink-0 overflow-visible">
      <polygon points={`${pts} ${W},${H} 0,${H}`} fill={stroke} fillOpacity={0.12}/>
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  );
}

/** Area chart for trend cards */
function AreaCh({data,labels,color="#5c6bc0",h=80}:{data:number[];labels:string[];color:string;h:number}) {
  const W=400,mx=Math.max(...data),mn=Math.min(...data)*0.88;
  const y=(v:number)=>h-6-((v-mn)/(mx-mn||1))*(h-16);
  const pts=data.map((v,i)=>[Math.round(i/(data.length-1)*W),Math.round(y(v))] as [number,number]);
  const line=pts.map((p,i)=>`${i===0?"M":"L"}${p[0]},${p[1]}`).join(" ");
  const gid=`g${color.replace(/\W/g,"")}`;
  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${h}`} className="w-full" preserveAspectRatio="none" style={{height:h}}>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.18"/>
            <stop offset="100%" stopColor={color} stopOpacity="0"/>
          </linearGradient>
        </defs>
        <path d={`${line} L${W},${h} L0,${h} Z`} fill={`url(#${gid})`}/>
        <path d={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
        {pts.map(([x,v],i)=><circle key={i} cx={x} cy={v} r="2" fill={color}/>)}
      </svg>
      <div className="mt-1.5 flex justify-between">
        {labels.map(l=><span key={l} style={{fontSize:8}} className="text-slate-400">{l}</span>)}
      </div>
    </div>
  );
}

/** Mini vertical bar chart (CRM Payments card) */
function BarMini({data,color="#5c6bc0"}:{data:number[];color?:string}) {
  const mx=Math.max(...data)||1;
  return (
    <div className="flex h-12 items-end gap-0.5">
      {data.map((v,i)=>(
        <div key={i} className="flex-1 rounded-sm" style={{height:`${Math.max(10,(v/mx)*100)}%`,backgroundColor:color,opacity:i===data.length-1?1:0.45}}/>
      ))}
    </div>
  );
}

// ─── design system ───────────────────────────────────────────────────────────

/** Compact pill badge */
function Badge({l,c}:{l:string;c:string}) {
  return (
    <span className={`inline-flex h-[18px] items-center rounded-full px-2 font-medium ${BC[c]??BC.gray}`} style={{fontSize:9}}>
      {l}
    </span>
  );
}

/** Modal overlay */
function Modal({title,onClose,children,wide=false}:{title:string;onClose:()=>void;children:React.ReactNode;wide?:boolean}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1e2247]/50 p-4 backdrop-blur-sm">
      <div className={`flex flex-col w-full rounded-2xl bg-white shadow-2xl ${wide?"max-w-2xl":"max-w-lg"}`}>
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <span className="text-[13px] font-semibold text-[#1e2247]">{title}</span>
          <button onClick={onClose} className="flex h-6 w-6 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"><X size={13}/></button>
        </div>
        <div className="overflow-y-auto px-5 py-4" style={{maxHeight:"80vh"}}>{children}</div>
      </div>
    </div>
  );
}

function Fld({label,req,children}:{label:string;req?:boolean;children:React.ReactNode}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-semibold text-slate-500" style={{fontSize:10}}>{label}{req&&<span className="ml-0.5 text-red-500">*</span>}</span>
      {children}
    </label>
  );
}

function Inp(p:React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...p} className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-[11px] text-[#1e2247] outline-none transition placeholder:text-slate-400 focus:border-[#5c6bc0] focus:bg-white focus:ring-2 focus:ring-[#5c6bc0]/15"/>;
}

function Sl({v,set,opts}:{v:string;set:(x:string)=>void;opts:{value:string;label:string}[]}) {
  return (
    <select value={v} onChange={e=>set(e.target.value)}
      className="h-8 w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 text-[11px] text-[#1e2247] outline-none transition focus:border-[#5c6bc0] focus:bg-white">
      {opts.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function Btn({onClick,v="primary",disabled,children,icon,xs}:{onClick?:()=>void;v?:"primary"|"secondary"|"ghost"|"danger";disabled?:boolean;children:React.ReactNode;icon?:React.ReactNode;xs?:boolean}) {
  const cls={
    primary:"bg-[#5c6bc0] text-white hover:bg-[#4a5ab5] shadow-sm",
    secondary:"bg-white text-[#1e2247] border border-slate-200 hover:bg-slate-50 shadow-sm",
    ghost:"text-slate-500 hover:bg-slate-100",
    danger:"bg-red-500 text-white hover:bg-red-600 shadow-sm",
  }[v];
  return (
    <button onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-lg font-medium transition-all disabled:opacity-50 ${cls} ${xs?"h-6 px-2":"h-7 px-2.5"}`}
      style={{fontSize:xs?9:11}}>
      {icon}{children}
    </button>
  );
}

/** Page title + action bar */
function PgHdr({title,sub,actions}:{title:string;sub?:string;actions?:React.ReactNode}) {
  return (
    <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="font-semibold text-[#1e2247]" style={{fontSize:15}}>{title}</h1>
        {sub&&<p className="mt-0.5 text-slate-400" style={{fontSize:10}}>{sub}</p>}
      </div>
      {actions&&<div className="flex items-center gap-1.5">{actions}</div>}
    </div>
  );
}

/** Data table */
function Tbl({cols,children}:{cols:string[];children:React.ReactNode}) {
  return (
    <div className="overflow-hidden rounded-xl border border-[#e8eaf0] bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#eef1f8] bg-[#f7f8fc]">
              {cols.map(c=>(
                <th key={c} className={`whitespace-nowrap px-3 py-2 text-left font-semibold uppercase tracking-widest text-slate-400 ${c.includes("↓")?"text-right":""}`} style={{fontSize:9}}>
                  {c.replace("↓","")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f3f4f9]">{children}</tbody>
        </table>
      </div>
    </div>
  );
}

function TR({children,onClick}:{children:React.ReactNode;onClick?:()=>void}) {
  return <tr onClick={onClick} className={`transition-colors text-[11px] ${onClick?"cursor-pointer hover:bg-indigo-50/30":"hover:bg-[#f7f8fc]/60"}`}>{children}</tr>;
}
function TD({children,r,muted,mono,bold,warn,cls=""}:{children:React.ReactNode;r?:boolean;muted?:boolean;mono?:boolean;bold?:boolean;warn?:boolean;cls?:string}) {
  return (
    <td className={`px-3 py-2 ${r?"text-right":""} ${muted?"text-slate-400":""} ${mono?"font-mono text-[10px]":""} ${bold?"font-semibold text-[#1e2247]":""} ${warn?"font-bold text-red-500":""} ${cls}`}>
      {children}
    </td>
  );
}

/** Pill filter tabs */
function Tabs({tabs,active,set}:{tabs:{key:string;label:string;n?:number}[];active:string;set:(k:string)=>void}) {
  return (
    <div className="mb-3 flex flex-wrap gap-1">
      {tabs.map(t=>(
        <button key={t.key} onClick={()=>set(t.key)}
          className={`flex h-6 items-center gap-1 rounded-full px-2.5 font-medium transition-all ${
            active===t.key?"bg-[#5c6bc0] text-white shadow-sm":"bg-white text-slate-500 border border-[#e8eaf0] hover:text-[#1e2247]"
          }`} style={{fontSize:10}}>
          {t.label}
          {t.n!==undefined&&<span className={`rounded-full px-1 ${active===t.key?"text-indigo-200":"text-slate-400"}`} style={{fontSize:9}}>{t.n}</span>}
        </button>
      ))}
    </div>
  );
}

function Srch({v,set,ph}:{v:string;set:(s:string)=>void;ph:string}) {
  return (
    <div className="mb-3 flex h-8 items-center gap-2 rounded-lg border border-[#e8eaf0] bg-white px-3 shadow-sm transition focus-within:border-[#5c6bc0] focus-within:ring-2 focus-within:ring-[#5c6bc0]/15">
      <Search size={12} className="shrink-0 text-slate-400"/>
      <input className="flex-1 bg-transparent text-[11px] text-[#1e2247] outline-none placeholder:text-slate-400"
        placeholder={ph} value={v} onChange={e=>set(e.target.value)}/>
    </div>
  );
}

function PBar({a,b,c="indigo"}:{a:number;b:number;c?:string}) {
  const r=pct(a,b);
  const fill={indigo:"bg-[#5c6bc0]",green:"bg-emerald-500",amber:"bg-amber-400",red:"bg-red-400"}[c]??"bg-[#5c6bc0]";
  return (
    <div className="flex items-center gap-2">
      <div className="h-1 w-14 overflow-hidden rounded-full bg-[#eef1f8]">
        <div className={`h-full rounded-full ${fill}`} style={{width:`${r}%`}}/>
      </div>
      <span className="w-7 text-right tabular-nums text-slate-400" style={{fontSize:10}}>{r}%</span>
    </div>
  );
}

function NoRow({n,msg="데이터가 없습니다"}:{n:number;msg?:string}) {
  return <tr><td colSpan={n} className="py-10 text-center text-slate-400" style={{fontSize:11}}>{msg}</td></tr>;
}

/** Module stat card (top of each section) — 중앙 정렬 */
function StatC({label,value,unit,warn}:{label:string;value:string|number;unit?:string;warn?:boolean}) {
  return (
    <div className="rounded-xl border border-[#e0e6ea] bg-white p-3.5 text-center shadow-sm">
      <p className="text-slate-400" style={{fontSize:9}}>{label}</p>
      <p className={`mt-1.5 font-bold leading-none tabular-nums ${warn?"text-amber-500":"text-[#0a2535]"}`} style={{fontSize:26}}>
        {value}<span className="ml-0.5 font-normal text-slate-300" style={{fontSize:11}}>{unit}</span>
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────

/** CRM-style summary card (Sale / Payments / Activities) */
function SumCard({title,period,children,action}:{title:string;period?:string;children:React.ReactNode;action?:()=>void}) {
  return (
    <div className="flex flex-col rounded-xl border border-[#e8eaf0] bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-bold text-[#1e2247]" style={{fontSize:12}}>{title}</span>
        <div className="flex items-center gap-2">
          {period&&<span className="text-slate-400" style={{fontSize:9}}>{period}</span>}
          <button onClick={action} className="text-slate-300 hover:text-slate-500"><MoreHorizontal size={13}/></button>
        </div>
      </div>
      {children}
    </div>
  );
}

/** KPI row for the KPI panel */
function KRow({label,value,change,up,good,trend}:{label:string;value:string;change:string;up:boolean;good:boolean;trend:number[]}) {
  const pos=good?!up:up;
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 hover:bg-[#f7f8fc]/60 transition-colors">
      <div className="flex-1 min-w-0">
        <p className="text-slate-400" style={{fontSize:9}}>{label}</p>
        <p className="mt-0.5 font-bold tabular-nums text-[#1e2247]" style={{fontSize:16}}>{value}</p>
      </div>
      <Spark data={trend} up={pos}/>
      <span className={`flex items-center gap-0.5 font-semibold w-14 justify-end ${pos?"text-emerald-500":"text-red-400"}`} style={{fontSize:10}}>
        {pos?<ArrowUpRight size={10}/>:<ArrowDownRight size={10}/>}{change}
      </span>
    </div>
  );
}

// ─── 대시보드 모듈 퀵 액세스 카드 데이터 (코딩계획서 v1.0) ─────────────────────
const DB_MODULES: {key:NavKey;label:string;sub:string;Icon:React.ElementType;color:string;accent:string;kpi:string;kpiLabel:string}[] = [
  {key:"production",label:"생산관리",sub:"주차별실적·인력·도포실",Icon:Factory,      color:"#0d7f8a",accent:"rgba(13,127,138,0.1)",  kpi:"99.3%", kpiLabel:"달성률"},
  {key:"quality",   label:"품질관리",sub:"종합·BUSH·이너씰·리워크",Icon:ClipboardCheck,color:"#e53935",accent:"rgba(229,57,53,0.1)",   kpi:"16,281",kpiLabel:"PPM"},
  {key:"sales",     label:"영업관리",sub:"매출·고객사별·계획vs실적",Icon:ShoppingBag,   color:"#f57c00",accent:"rgba(245,124,0,0.1)",   kpi:"96.5%",kpiLabel:"매출달성"},
  {key:"purchase",  label:"구매/자재",sub:"발주·매입비율 경보",     Icon:Truck,         color:"#6a1b9a",accent:"rgba(106,27,154,0.1)",  kpi:"75/110",kpiLabel:"비율"},
  {key:"aislvina",  label:"AISLVINA",sub:"설비가동률·비가동원인",  Icon:Cpu,           color:"#0891b2",accent:"rgba(8,145,178,0.1)",   kpi:"설비", kpiLabel:"가동률"},
  {key:"reports",   label:"보고서",  sub:"PDF·PPT·결재",          Icon:FileBarChart2, color:"#0277bd",accent:"rgba(2,119,189,0.1)",   kpi:"월간", kpiLabel:"리포트"},
  {key:"approvals", label:"승인",    sub:"4M·주간회의 결재",       Icon:FileSignature, color:"#059669",accent:"rgba(5,150,105,0.1)",   kpi:"결재", kpiLabel:"대기"},
];

// ── 애니메이션 스파크라인 (sparkline with draw animation) ──────────────────
function AnimSpark({data, up}: {data: number[], up: boolean}) {
  const W=64, H=28, mx=Math.max(...data), mn=Math.min(...data), rng=mx-mn||1;
  const pts = data.map((v,i)=>`${(i/(data.length-1))*W},${H-4-((v-mn)/rng)*(H-10)}`).join(" ");
  const stroke = up ? "#22c55e" : "#ef4444";
  return (
    <svg width={W} height={H} style={{overflow:"visible",display:"block"}}>
      <defs>
        <linearGradient id={`asg-${up?1:0}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={stroke} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <polygon
        points={`${pts} ${W},${H} 0,${H}`}
        fill={`url(#asg-${up?1:0})`}
        style={{animation:"spark-fill 0.7s ease both"}}
      />
      <polyline
        points={pts}
        fill="none"
        stroke={stroke}
        strokeWidth={1.8}
        strokeLinejoin="round"
        strokeLinecap="round"
        strokeDasharray={600}
        strokeDashoffset={600}
        style={{animation:"spark-draw 1.4s cubic-bezier(.4,0,.2,1) both"}}
      />
    </svg>
  );
}

// ── 미니 바 차트 (KPI 카드 내부용) ──────────────────────────────────────────
function MiniBarChart({data, accent, animKey}:{data:number[], accent:string, animKey?:string}) {
  const max = Math.max(...data, 1);
  return (
    <div
      key={animKey}
      style={{
        display:"flex",
        alignItems:"flex-end",
        gap:2,
        width:"100%",
        height:36,
        marginTop:8,
        marginBottom:2,
      }}
    >
      {data.map((v,i)=>{
        const pct = Math.max(12, Math.round((v/max)*100));
        const isLast = i === data.length-1;
        return (
          <div
            key={i}
            style={{
              flex:1,
              height:`${pct}%`,
              background: isLast ? accent : `${accent}60`,
              borderRadius:"3px 3px 0 0",
              transformOrigin:"bottom",
              animation:`bar-grow 0.55s cubic-bezier(.34,1.4,.64,1) ${i*45}ms both`,
            }}
          />
        );
      })}
    </div>
  );
}

// ── KPI 카드 컴포넌트 (애니메이션 포함) ────────────────────────────────────
interface KpiCardProps {
  label: string;
  value: string;
  unit: string;
  change: string;
  up: boolean;
  good: boolean;
  color: string;
  darkColor: string;
  bg: string;
  trend: number[];
  live: boolean;
  flash: number; // 1=improved, -1=degraded, 0=stable
  animDelay: number;
}
function KpiCard({label,value,unit,change,up,good,color,bg,trend,live,flash,animDelay}:KpiCardProps) {
  const pos = good ? !up : up;
  const [prevVal, setPrevVal] = useState(value);
  const [pulse, setPulse] = useState(false);
  const [flashColor, setFlashColor] = useState<string|null>(null);

  useEffect(() => {
    if (value !== prevVal) {
      setPulse(true);
      setFlashColor(flash > 0 ? "rgba(34,197,94,0.18)" : flash < 0 ? "rgba(239,68,68,0.18)" : null);
      const t1 = setTimeout(() => { setPulse(false); }, 500);
      const t2 = setTimeout(() => { setFlashColor(null); setPrevVal(value); }, 800);
      return () => { clearTimeout(t1); clearTimeout(t2); };
    }
  }, [value, prevVal, flash]);

  return (
    <div
      className="relative overflow-hidden rounded-2xl p-5 text-white"
      style={{
        background: bg,
        boxShadow: "0 4px 20px rgba(0,0,0,0.18)",
        animation: `card-in 0.5s cubic-bezier(.22,.68,0,1.2) ${animDelay}ms both`,
        transition: "box-shadow 0.3s",
        margin: 8,
      }}
    >
      {/* 배경 데코 원 */}
      <div style={{position:"absolute",right:-20,top:-20,width:90,height:90,borderRadius:"50%",background:"rgba(255,255,255,0.07)",pointerEvents:"none"}}/>
      <div style={{position:"absolute",right:10,bottom:-30,width:70,height:70,borderRadius:"50%",background:"rgba(255,255,255,0.05)",pointerEvents:"none"}}/>

      {/* 플래시 오버레이 */}
      {flashColor && (
        <div style={{position:"absolute",inset:0,background:flashColor,borderRadius:"inherit",transition:"opacity 0.4s",pointerEvents:"none"}}/>
      )}

      {/* 헤더: 라벨 + 라이브 도트 */}
      <div className="flex items-center justify-between">
        <p className="font-semibold text-white/75" style={{fontSize:12}}>{label}</p>
        {live && (
          <span className="flex items-center gap-1" style={{fontSize:9,color:"rgba(255,255,255,0.6)"}}>
            <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-white/80"/>
            LIVE
          </span>
        )}
      </div>

      {/* 수치 */}
      <div
        className="flex items-end gap-1"
        style={{
          marginTop: 6,
          animation: pulse ? "kpi-pulse 0.4s ease-out" : undefined,
        }}
      >
        <span className="font-black leading-none text-white tabular-nums" style={{fontSize:34,letterSpacing:"-0.03em"}}>{value}</span>
        <span className="mb-1 font-semibold text-white/60" style={{fontSize:14}}>{unit}</span>
      </div>

      {/* 미니 바 차트 */}
      <MiniBarChart
        data={trend}
        accent={pos ? "#86efac" : "#fca5a5"}
        animKey={trend.join(",")}
      />

      {/* 하단: 스파크라인 + 변화율 */}
      <div className="flex items-end justify-between" style={{marginTop:4}}>
        <AnimSpark data={trend} up={pos} key={trend.join(",")+"-sp"}/>
        <span
          className="flex items-center gap-0.5 rounded-full px-2.5 py-1 font-bold"
          style={{
            fontSize:10,
            background: pos ? "rgba(34,197,94,0.22)" : "rgba(239,68,68,0.22)",
            color: pos ? "#86efac" : "#fca5a5",
          }}
        >
          {up ? <ArrowUpRight size={9}/> : <ArrowDownRight size={9}/>}{change}
        </span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  DASHBOARD (실시간 애니메이션)
// ─────────────────────────────────────────────────────────────────────────────

function Dashboard({inqs,ncrs,ledg,nav}:{inqs:ProductionInquiry[];ncrs:QualityNCR[];ledg:InventoryLedger[];nav:(k:NavKey)=>void}) {
  const done   = inqs.filter(i=>i.status==="입고완료");
  const rate   = pct(done.length, inqs.length||1);
  const dQ     = ncrs.reduce((a,n)=>a+n.defect_qty,0);
  const tQ     = ncrs.reduce((a,n)=>a+n.total_qty,0);
  const defR   = tQ?(dQ/tQ*100).toFixed(1):"1.8";
  const open   = ncrs.filter(n=>n.status==="open"||n.status==="investigating");
  const below  = ledg.filter(l=>l.is_below_safety);
  const totalS = SALES.reduce((a,s)=>a+s.amount,0);
  const delayed= SALES.filter(s=>s.is_delayed);

  // ── 실시간 라이브 KPI 상태 ───────────────────────────────────────────────
  const [live, setLive] = useState({
    prod:   rate   || 87,
    defect: parseFloat(defR) || 1.8,
    ncr:    open.length,
    due:    92,
  });
  const [flash, setFlash] = useState({prod:0, defect:0, ncr:0, due:0});
  const [liveHistory, setLiveHistory] = useState({
    prod:   [...PROD_TR],
    defect: [...DEFECT_TR],
    due:    [85,87,89,90,91,92],
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setLive(prev => {
        const newProd   = parseFloat(Math.min(100, Math.max(78, prev.prod   + (Math.random()-0.38)*1.2)).toFixed(1));
        const newDefect = parseFloat(Math.min(4.5, Math.max(0.4, prev.defect + (Math.random()-0.52)*0.12)).toFixed(2));
        const newDue    = parseFloat(Math.min(100, Math.max(84, prev.due    + (Math.random()-0.42)*0.9)).toFixed(1));
        setFlash({
          prod:   newProd   > prev.prod   ? 1 : -1,
          defect: newDefect < prev.defect ? 1 : -1,
          ncr:    0,
          due:    newDue    > prev.due    ? 1 : -1,
        });
        setLiveHistory(h => ({
          prod:   [...h.prod.slice(-11),   newProd],
          defect: [...h.defect.slice(-11), newDefect],
          due:    [...h.due.slice(-5),     newDue],
        }));
        return { prod:newProd, defect:newDefect, ncr:prev.ncr, due:newDue };
      });
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  const alerts=[
    ...open.map(n=>`NCR ${n.ncr_no} — ${NCR_S[n.status]?.l??n.status}`),
    ...below.map(l=>`재고 미달: ${l.item_name}`),
    ...delayed.map(s=>`납기 지연: ${s.order_no}`),
  ];

  // ── KPI 타일 7개 (코딩계획서 v1.0) ────────────────────────────────────────
  const k = DASHBOARD_KPIS;
  const KPI_TILES: KpiCardProps[] = [
    { label:"이번달 매출", value:(k.sales_amount/1000).toFixed(0), unit:"천원",
      change:"영업", up:true, good:true, color:"#f59e0b", darkColor:"#b45309",
      bg:"linear-gradient(135deg, #fbbf24 0%, #f59e0b 50%, #d97706 100%)",
      trend:SALES_TR, live:false, flash:0, animDelay:0 },
    { label:"매출 달성률", value:k.sales_rate.toFixed(1), unit:"%",
      change: k.sales_rate>=95 ? "목표달성" : "미달",
      up:k.sales_rate>=95, good:true, color: k.sales_rate>=95 ? "#22c55e" : "#ef4444", darkColor:"#15803d",
      bg: k.sales_rate>=95 ? "linear-gradient(135deg, #4ade80 0%, #22c55e 50%, #16a34a 100%)" : "linear-gradient(135deg, #f87171 0%, #ef4444 50%, #dc2626 100%)",
      trend:SALES_TR, live:false, flash:0, animDelay:80 },
    { label:"평균 PPM", value:k.avg_ppm.toLocaleString(), unit:"PPM",
      change:"품질", up:false, good:true, color:"#7c3aed", darkColor:"#5b21b6",
      bg:"linear-gradient(135deg, #a78bfa 0%, #7c3aed 50%, #6d28d9 100%)",
      trend: [18,17,16,16,17,16,16,16], live:false, flash:0, animDelay:160 },
    { label:"불량금액", value:(k.defect_amount/10000).toFixed(0), unit:"만원",
      change:"품질", up:false, good:true, color:"#ef4444", darkColor:"#b91c1c",
      bg:"linear-gradient(135deg, #f87171 0%, #ef4444 50%, #dc2626 100%)",
      trend: [12,11,10,10,11,10,10,10], live:false, flash:0, animDelay:200 },
    { label:"생산 달성률", value:k.production_rate.toFixed(1), unit:"%",
      change:"생산", up:true, good:true, color:"#22c55e", darkColor:"#15803d",
      bg:"linear-gradient(135deg, #4ade80 0%, #22c55e 50%, #16a34a 100%)",
      trend: liveHistory.prod.slice(-8), live:true, flash:flash.prod, animDelay:240 },
    { label:"인력 가동률", value:`${k.labor_count.current}/${k.labor_count.total}`, unit:"명",
      change:"생산", up:true, good:true, color:"#3b82f6", darkColor:"#1d4ed8",
      bg:"linear-gradient(135deg, #60a5fa 0%, #3b82f6 50%, #2563eb 100%)",
      trend:[45,46,48,49,50,50,k.labor_count.current], live:false, flash:0, animDelay:280 },
    { label:"설비 가동률", value: k.equipment_rate!=null ? `${k.equipment_rate.toFixed(1)}%` : "—", unit:"",
      change:"AISLVINA", up:true, good:true, color:"#06b6d4", darkColor:"#0891b2",
      bg:"linear-gradient(135deg, #22d3ee 0%, #06b6d4 50%, #0891b2 100%)",
      trend:[90,91,92,93,93,94], live:false, flash:0, animDelay:320 },
  ];

  return (
    <div className="space-y-5">

      {/* ── 경고 배너 ────────────────────────────────────────────────────── */}
      {alerts.length>0&&(
        <div
          className="flex items-center gap-3 rounded-2xl px-4 py-3.5"
          style={{
            background:"linear-gradient(135deg,#fffbeb,#fef9ee)",
            border:"1.5px solid #fde68a",
            animation:"card-in 0.4s ease both",
          }}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl" style={{background:"#fef3c7",border:"1.5px solid #fde68a"}}>
            <AlertTriangle size={15} className="text-amber-500"/>
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-bold text-amber-800" style={{fontSize:14}}>조치 필요 {alerts.length}건</p>
            <p className="truncate text-amber-600" style={{fontSize:11}}>{alerts.slice(0,4).join(" · ")}{alerts.length>4&&` 외 ${alerts.length-4}건`}</p>
          </div>
          <button className="shrink-0 rounded-xl px-3 py-1.5 font-semibold text-amber-700 hover:bg-amber-100 transition-colors" style={{fontSize:11,background:"rgba(255,255,255,0.7)"}}>
            전체 보기 →
          </button>
        </div>
      )}

      {/* ── KPI 타일 7개 (코딩계획서 v1.0) ───────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7">
        {KPI_TILES.map((t,i) => <KpiCard key={t.label} {...t} animDelay={i*60}/>)}
      </div>

      {/* ── 고객사별 매출 현황 (코딩계획서 v1.0) ───────────────────────────── */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="font-black text-[#0d1117]" style={{fontSize:16,letterSpacing:"-0.02em"}}>고객사별 매출 현황</p>
          <button onClick={()=>nav("sales")} className="text-[11px] font-semibold text-[#5c6bc0] hover:underline">영업관리 →</button>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {CUSTOMER_SALES.map((c)=>(
            <div key={c.customer} className="rounded-2xl border border-[#e4e8ee] bg-white p-4 shadow-sm transition hover:shadow-md">
              <p className="font-bold text-[#0d1117]" style={{fontSize:13}}>{c.customer}</p>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="font-black text-[#0d7f8a]" style={{fontSize:22}}>{c.rate.toFixed(1)}%</span>
                <span className="text-slate-500" style={{fontSize:10}}>달성</span>
              </div>
              <p className="mt-1 text-slate-500" style={{fontSize:10}}>목표 {(c.target/1000).toFixed(0)}천 / 실적 {(c.actual/1000).toFixed(0)}천</p>
              {c.cause&&<p className="mt-1 truncate text-amber-600" style={{fontSize:9}}>원인: {c.cause}</p>}
            </div>
          ))}
        </div>
      </div>

      {/* ── 모듈 퀵 액세스 카드 ─────────────────────────────────────────── */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="font-black text-[#0d1117]" style={{fontSize:16,letterSpacing:"-0.02em"}}>모듈 바로가기</p>
          <span style={{fontSize:11,color:"#9aa3b2"}}>클릭하여 이동</span>
        </div>
        <div className="grid grid-cols-3 gap-3 xl:grid-cols-6">
          {DB_MODULES.map((m,i)=>{
            const Icon=m.Icon;
            return (
              <button
                key={m.key}
                onClick={()=>nav(m.key)}
                className="group flex flex-col items-center gap-2.5 rounded-2xl border p-4 text-center transition-all hover:-translate-y-1 hover:shadow-xl"
                style={{
                  background:"white",
                  borderColor:"#e4e8ee",
                  animation:`card-in 0.45s cubic-bezier(.22,.68,0,1.2) ${i*60}ms both`,
                }}
              >
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                  style={{background:m.accent}}
                >
                  <Icon size={20} style={{color:m.color}}/>
                </div>
                <div>
                  <p className="font-bold text-[#0d1117]" style={{fontSize:13}}>{m.label}</p>
                  <p className="mt-0.5" style={{fontSize:10,color:"#9aa3b2"}}>{m.sub}</p>
                </div>
                <div className="w-full border-t pt-2.5" style={{borderColor:"#f0f3f5"}}>
                  <p className="font-black" style={{color:m.color,fontSize:18}}>{m.kpi}</p>
                  <p style={{fontSize:9,color:"#9aa3b2"}}>{m.kpiLabel}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 차트 + KPI 패널 ─────────────────────────────────────────────── */}
      <div className="grid gap-4 xl:grid-cols-3">

        {/* 생산 달성률 추이 */}
        <div
          className="rounded-2xl border bg-white p-5 xl:col-span-2"
          style={{borderColor:"#e4e8ee",boxShadow:"0 1px 8px rgba(0,0,0,0.06)",animation:"card-in 0.45s ease 0.2s both"}}
        >
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="font-black text-[#0d1117]" style={{fontSize:15,letterSpacing:"-0.02em"}}>생산 달성률 추이</p>
              <p style={{fontSize:11,color:"#9aa3b2",marginTop:3}}>월별 · 단위 %</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{background:"rgba(13,127,138,0.08)",fontSize:10}}>
                <span className="live-dot inline-block h-1.5 w-1.5 rounded-full" style={{background:"#0d7f8a"}}/>
                <span className="font-semibold" style={{color:"#0d7f8a"}}>실시간</span>
              </span>
            </div>
          </div>
          <AreaCh data={liveHistory.prod.slice(-12)} labels={["10","11","12","1","2","3","4","5","6","7","8","9"]} color="#0d7f8a" h={120}/>
        </div>

        {/* 핵심 KPI 패널 */}
        <div
          className="rounded-2xl border bg-white"
          style={{borderColor:"#e4e8ee",boxShadow:"0 1px 8px rgba(0,0,0,0.06)",animation:"card-in 0.45s ease 0.28s both"}}
        >
          <div className="border-b px-5 py-4" style={{borderColor:"#f0f3f6"}}>
            <p className="font-black text-[#0d1117]" style={{fontSize:15,letterSpacing:"-0.02em"}}>핵심 KPI</p>
            <p style={{fontSize:11,color:"#9aa3b2",marginTop:2}}>전월 대비 변화율</p>
          </div>
          <div className="divide-y" style={{borderColor:"#f5f6f8"}}>
            <KRow label="매출 달성률" value={`${DASHBOARD_KPIS.sales_rate}%`} change="영업" up good={DASHBOARD_KPIS.sales_rate>=95} trend={SALES_TR}/>
            <KRow label="생산 달성률" value={`${DASHBOARD_KPIS.production_rate}%`} change="생산" up good={true} trend={liveHistory.prod.slice(-6)}/>
            <KRow label="평균 PPM" value={DASHBOARD_KPIS.avg_ppm.toLocaleString()} change="품질" up={false} good={true} trend={[18,17,16,16,17,16]}/>
            <KRow label="미결 NCR" value={`${live.ncr}건`} change={live.ncr<=2?"정상":"조치필요"} up={live.ncr<3} good={true} trend={[4,3,3,2,2,3,2,live.ncr]}/>
            <KRow label="이번달 매출" value={`${(DASHBOARD_KPIS.sales_amount/1000).toFixed(0)}천`} change="영업" up good={false} trend={SALES_TR}/>
          </div>
        </div>
      </div>

      {/* ── 품질 + 생산 입고 ─────────────────────────────────────────────── */}
      <div className="grid gap-4 xl:grid-cols-5">

        {/* 품질 불량률 추이 */}
        <div
          className="rounded-2xl border bg-white p-5 xl:col-span-2"
          style={{borderColor:"#e4e8ee",boxShadow:"0 1px 8px rgba(0,0,0,0.06)",animation:"card-in 0.45s ease 0.3s both"}}
        >
          <div className="mb-4 flex items-start justify-between">
            <div>
              <p className="font-black text-[#0d1117]" style={{fontSize:15,letterSpacing:"-0.02em"}}>품질 불량률 추이</p>
              <p style={{fontSize:11,color:"#9aa3b2",marginTop:3}}>낮을수록 양호</p>
            </div>
            <span className="flex items-center gap-1.5 rounded-full px-2.5 py-1" style={{background:"rgba(229,57,53,0.08)",fontSize:10}}>
              <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-red-400"/>
              <span className="font-semibold text-red-500">불량률 %</span>
            </span>
          </div>
          <AreaCh data={liveHistory.defect.slice(-8)} labels={MO6} color="#ef5350" h={90}/>
          {open.length>0&&(
            <div className="mt-3 space-y-2 border-t pt-3" style={{borderColor:"#f5f6f8"}}>
              {open.slice(0,2).map(n=>(
                <div key={n.id} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{background:n.severity==="critical"?"#ef4444":"#f97316"}}/>
                  <span className="flex-1 truncate" style={{fontSize:11,color:"#5a6478"}}>{n.item_name??n.ncr_no}</span>
                  <Badge l={NCR_S[n.status]?.l??n.status} c={NCR_S[n.status]?.c??"gray"}/>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 최근 생산 입고 */}
        <div
          className="flex flex-col overflow-hidden rounded-2xl border bg-white xl:col-span-3"
          style={{borderColor:"#e4e8ee",boxShadow:"0 1px 8px rgba(0,0,0,0.06)",animation:"card-in 0.45s ease 0.35s both"}}
        >
          <div className="flex items-center justify-between border-b px-5 py-4" style={{borderColor:"#f0f3f6"}}>
            <div>
              <p className="font-black text-[#0d1117]" style={{fontSize:15,letterSpacing:"-0.02em"}}>최근 생산 입고</p>
              <p style={{fontSize:11,color:"#9aa3b2",marginTop:2}}>실시간 생산 현황</p>
            </div>
            <button
              onClick={()=>nav("production")}
              className="flex items-center gap-1 rounded-xl px-3 py-1.5 font-semibold transition hover:bg-[#f5f7fa]"
              style={{fontSize:11,color:"#0d7f8a"}}
            >
              전체보기 <ChevronRight size={11}/>
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b" style={{background:"#f8f9fb",borderColor:"#f0f3f6"}}>
                  {["품목명","작업지시","계획","입고","달성률","상태"].map(h=>(
                    <th key={h} className={`whitespace-nowrap px-4 py-3 font-bold uppercase tracking-widest text-[#9aa3b2] ${h==="계획"||h==="입고"?"text-right":"text-left"}`} style={{fontSize:10}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y" style={{borderColor:"#f5f6f8",fontSize:12}}>
                {inqs.length===0
                  ? <tr><td colSpan={6} className="py-12 text-center" style={{color:"#9aa3b2",fontSize:11}}>
                      <div className="flex flex-col items-center gap-2">
                        <Factory size={22} style={{color:"#d0d5dd"}}/>
                        <span>생산 데이터가 없습니다</span>
                      </div>
                    </td></tr>
                  : inqs.slice(0,6).map(r=>{
                      const s=INQ_S[r.status]??{l:r.status,c:"gray"};
                      const r_pct=pct(r.receipt_qty??0,r.planned_qty??1);
                      return (
                        <tr key={r.id} className="transition-colors hover:bg-[#f8f9fb]">
                          <td className="px-4 py-3 font-semibold" style={{color:"#0d1117"}}>{r.item_name||"-"}</td>
                          <td className="px-4 py-3 font-mono" style={{fontSize:10,color:"#9aa3b2"}}>{r.workorder_no||"-"}</td>
                          <td className="px-4 py-3 text-right tabular-nums" style={{color:"#5a6478"}}>{(r.planned_qty??0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right tabular-nums font-bold" style={{color:"#0d1117"}}>{(r.receipt_qty??0).toLocaleString()}</td>
                          <td className="px-4 py-3"><PBar a={r.receipt_qty??0} b={r.planned_qty??1} c={r_pct>=100?"green":"indigo"}/></td>
                          <td className="px-4 py-3"><Badge l={s.l} c={s.c}/></td>
                        </tr>
                      );
                    })}
              </tbody>
            </table>
          </div>
          <div className="mt-auto border-t px-5 py-3.5" style={{borderColor:"#f0f3f6"}}>
            <div className="flex items-center justify-between">
              <p className="font-semibold" style={{fontSize:11,color:"#9aa3b2"}}>최근 수주 현황 (총 {fa(totalS)})</p>
              <button onClick={()=>nav("sales")} className="font-semibold hover:underline" style={{fontSize:11,color:"#0d7f8a"}}>영업 관리로 이동</button>
            </div>
            <div className="mt-2.5 flex gap-2.5">
              {SALES.slice(0,4).map(s=>{
                const st=SO_S[s.status]??{l:s.status,c:"gray"};
                return (
                  <div key={s.id} className="flex flex-1 flex-col rounded-xl border p-2.5" style={{borderColor:"#eef1f6"}}>
                    <span className="truncate" style={{fontSize:9,color:"#9aa3b2"}}>{s.customer}</span>
                    <span className="mt-1 font-bold" style={{fontSize:11,color:"#0d1117"}}>{fa(s.amount)}</span>
                    <Badge l={st.l} c={st.c}/>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  MODULE SECTIONS (Production / Quality / Inventory / Sales / Purchase / Reports)
// ─────────────────────────────────────────────────────────────────────────────

function ProdSec() {
  const [rows,set]   = useState<ProductionInquiry[]>([]);
  const [load,setL]  = useState(true);
  const [tab,setTab] = useState("전체");
  const [q,setQ]     = useState("");
  const [modal,setM] = useState(false);
  const [edit,setE]  = useState<ProductionInquiry|null>(null);
  const [sv,setSv]   = useState(false);
  const blank=():ProductionInquiryUpsertPayload=>({inquiry_no:"",production_date:new Date().toISOString().slice(0,10),workorder_no:"",status:"입고예정",item_code:"",item_name:"",spec:"",unit:"EA",planned_qty:0,receipt_qty:0,warehouse:"완제품창고",remark:""});
  const [fm,setFm]=useState<ProductionInquiryUpsertPayload>(blank());

  const _API=process.env.NEXT_PUBLIC_API_ENABLED!=="false";
  const fetch_=useCallback(async()=>{if(!_API){setL(false);return;}setL(true);try{set(await getProductionInquiries());}catch{set([]);}finally{setL(false);};},[_API]); 
  useEffect(()=>{fetch_();},[fetch_]);

  const tabs=useMemo(()=>[{key:"전체",label:"전체",n:rows.length},{key:"입고예정",label:"입고예정",n:rows.filter(r=>r.status==="입고예정").length},{key:"입고중",label:"입고중",n:rows.filter(r=>r.status==="입고중").length},{key:"입고완료",label:"입고완료",n:rows.filter(r=>r.status==="입고완료").length},{key:"보류",label:"보류",n:rows.filter(r=>r.status==="보류").length}],[rows]);
  const fil=useMemo(()=>rows.filter(r=>{const t=tab==="전체"||r.status===tab;const s=q.toLowerCase();return t&&(!s||(r.item_name??"").toLowerCase().includes(s)||r.inquiry_no.toLowerCase().includes(s));}),[rows,tab,q]);

  const openN=()=>{setE(null);setFm({...blank(),inquiry_no:`INQ-${new Date().toISOString().slice(0,10)}-${String(rows.length+1).padStart(3,"0")}`,workorder_no:`WO-${Date.now().toString().slice(-6)}`});setM(true);};
  const openE=(r:ProductionInquiry)=>{setE(r);setFm({inquiry_no:r.inquiry_no,production_date:String(r.production_date),workorder_no:r.workorder_no,status:r.status,item_code:r.item_code??"",item_name:r.item_name??"",spec:r.spec??"",unit:r.unit,planned_qty:r.planned_qty,receipt_qty:r.receipt_qty,warehouse:r.warehouse??"",remark:r.remark??""});setM(true);};
  const save=async()=>{if(!fm.inquiry_no||!fm.item_name)return;if(!_API)return;setSv(true);try{if(edit){const u=await updateProductionInquiry(edit.id,fm);set(p=>p.map(r=>r.id===u.id?u:r));}else{const c=await createProductionInquiry(fm);set(p=>[c,...p]);}setM(false);}catch{}finally{setSv(false);};}

  const importInq=(results:{rows:ParsedRow[]}[])=>{
    const mapped:ProductionInquiry[]=results.flatMap(r=>r.rows.map((row,i)=>({
      id:`imp-${Date.now()}-${i}`,
      inquiry_no:String(row["조회번호"]??row["inquiry_no"]??`IMP-${i+1}`),
      production_date:String(row["생산일"]??row["production_date"]??new Date().toISOString().slice(0,10)),
      workorder_no:String(row["작업지시번호"]??row["workorder_no"]??`WO-IMP-${i+1}`),
      status:String(row["상태"]??row["status"]??"입고예정") as ProductionInquiry["status"],
      item_code:String(row["품목코드"]??row["item_code"]??""),
      item_name:String(row["품목명"]??row["item_name"]??""),
      spec:String(row["규격"]??row["spec"]??""),
      unit:String(row["단위"]??row["unit"]??"EA"),
      planned_qty:Number(row["계획수량"]??row["planned_qty"]??0),
      receipt_qty:Number(row["입고수량"]??row["receipt_qty"]??0),
      warehouse:String(row["창고"]??row["warehouse"]??"완제품창고"),
      remark:String(row["비고"]??row["remark"]??""),
    })));
    set(prev=>[...mapped,...prev]);
  };

  return (
    <div>
      <PgHdr title="생산 입고 관리" sub="작업지시별 생산 입고 실적 등록 및 현황 관리" actions={
        <><Btn v="secondary" icon={<RefreshCw size={12}/>} onClick={fetch_}>새로고침</Btn>
          <FileImportButton variant="excel" accept="both" label="엑셀/PDF 불러오기" onImport={importInq}/>
          <Btn v="primary" icon={<Plus size={12}/>} onClick={openN}>신규 등록</Btn></>
      }/>
      <div className="mb-5 grid grid-cols-4 gap-3">
        <StatC label="전체" value={rows.length} unit="건"/>
        <StatC label="입고완료" value={rows.filter(r=>r.status==="입고완료").length} unit="건"/>
        <StatC label="진행중" value={rows.filter(r=>r.status==="입고중").length} unit="건"/>
        <StatC label="보류·반품" value={rows.filter(r=>r.status==="보류"||r.status==="반품").length} unit="건" warn/>
      </div>
      <Tabs tabs={tabs} active={tab} set={setTab}/>
      <Srch v={q} set={setQ} ph="품목명, 지시번호 검색"/>
      {load?<p className="py-12 text-center text-slate-400" style={{fontSize:12}}>불러오는 중…</p>:(
        <Tbl cols={["지시번호","생산일","작업지시","품목명","규격","계획수량↓","입고수량↓","달성률","창고","상태",""]}>
          {fil.length===0?<NoRow n={11}/>:fil.map(r=>{const s=INQ_S[r.status]??{l:r.status,c:"gray"};return(
            <TR key={r.id}>
              <TD mono>{r.inquiry_no}</TD><TD muted>{fd(String(r.production_date))}</TD><TD muted>{r.workorder_no}</TD>
              <TD bold>{r.item_name||"-"}</TD><TD muted>{r.spec||"-"}</TD>
              <TD r>{r.planned_qty.toLocaleString()}</TD><TD r bold>{r.receipt_qty.toLocaleString()}</TD>
              <td className="px-3 py-2"><PBar a={r.receipt_qty} b={r.planned_qty} c={pct(r.receipt_qty,r.planned_qty)>=100?"green":"indigo"}/></td>
              <TD muted>{r.warehouse||"-"}</TD>
              <td className="px-3 py-2"><Badge l={s.l} c={s.c}/></td>
              <td className="px-3 py-2"><button onClick={()=>openE(r)} className="text-[#5c6bc0] hover:underline" style={{fontSize:10}}>수정</button></td>
            </TR>
          );})}
        </Tbl>
      )}
      {modal&&<Modal title={edit?"입고 수정":"신규 입고 등록"} onClose={()=>setM(false)} wide>
        <div className="grid grid-cols-2 gap-3">
          <Fld label="입고지시번호" req><Inp value={fm.inquiry_no} onChange={e=>setFm(f=>({...f,inquiry_no:e.target.value}))}/></Fld>
          <Fld label="작업지시번호"><Inp value={fm.workorder_no} onChange={e=>setFm(f=>({...f,workorder_no:e.target.value}))}/></Fld>
          <Fld label="생산일"><Inp type="date" value={fm.production_date} onChange={e=>setFm(f=>({...f,production_date:e.target.value}))}/></Fld>
          <Fld label="상태"><Sl v={fm.status} set={v=>setFm(f=>({...f,status:v}))} opts={[{value:"입고예정",label:"입고예정"},{value:"입고중",label:"입고중"},{value:"입고완료",label:"입고완료"},{value:"보류",label:"보류"},{value:"반품",label:"반품"}]}/></Fld>
          <Fld label="품목코드"><Inp value={fm.item_code??""} onChange={e=>setFm(f=>({...f,item_code:e.target.value}))} placeholder="예: AX01"/></Fld>
          <Fld label="품목명" req><Inp value={fm.item_name??""} onChange={e=>setFm(f=>({...f,item_name:e.target.value}))}/></Fld>
          <Fld label="규격"><Inp value={fm.spec??""} onChange={e=>setFm(f=>({...f,spec:e.target.value}))}/></Fld>
          <Fld label="단위"><Sl v={fm.unit} set={v=>setFm(f=>({...f,unit:v}))} opts={[{value:"EA",label:"EA"},{value:"SET",label:"SET"},{value:"KG",label:"KG"}]}/></Fld>
          <Fld label="계획수량"><Inp type="number" value={fm.planned_qty} onChange={e=>setFm(f=>({...f,planned_qty:+e.target.value}))}/></Fld>
          <Fld label="입고수량"><Inp type="number" value={fm.receipt_qty} onChange={e=>setFm(f=>({...f,receipt_qty:+e.target.value}))}/></Fld>
          <Fld label="입고창고"><Inp value={fm.warehouse??""} onChange={e=>setFm(f=>({...f,warehouse:e.target.value}))}/></Fld>
          <Fld label="비고"><Inp value={fm.remark??""} onChange={e=>setFm(f=>({...f,remark:e.target.value}))}/></Fld>
        </div>
        <div className="mt-5 flex justify-end gap-1.5"><Btn v="secondary" onClick={()=>setM(false)}>취소</Btn><Btn v="primary" onClick={save} disabled={sv} icon={<Save size={12}/>}>{sv?"저장중…":"저장"}</Btn></div>
      </Modal>}
    </div>
  );
}

function QualSec() {
  const [rows,set]=useState<QualityNCR[]>([]);const [load,setL]=useState(true);const [tab,setTab]=useState("전체");const [q,setQ]=useState("");const [modal,setM]=useState(false);const [sv,setSv]=useState(false);const [chg,setChg]=useState<string|null>(null);
  const blank=():QualityNCRUpsertPayload=>({ncr_no:"",detected_at:new Date().toISOString().slice(0,10),department_code:"QUAL",item_code:"",item_name:"",defect_type:"",defect_qty:0,total_qty:0,status:"open",severity:"major",detected_by:"",root_cause:"",action_taken:"",customer_name:"",remark:""});
  const [fm,setFm]=useState<QualityNCRUpsertPayload>(blank());
  const _API=process.env.NEXT_PUBLIC_API_ENABLED!=="false";
  const fetch_=useCallback(async()=>{if(!_API){setL(false);return;}setL(true);try{set(await listQualityNCRs());}catch{set([]);}finally{setL(false);};},[_API]); useEffect(()=>{fetch_();},[fetch_]);
  const tabs=useMemo(()=>[{key:"전체",label:"전체",n:rows.length},{key:"open",label:"미처리",n:rows.filter(r=>r.status==="open").length},{key:"investigating",label:"조사중",n:rows.filter(r=>r.status==="investigating").length},{key:"resolved",label:"처리완료",n:rows.filter(r=>r.status==="resolved").length},{key:"closed",label:"종결",n:rows.filter(r=>r.status==="closed").length}],[rows]);
  const fil=useMemo(()=>rows.filter(r=>{const t=tab==="전체"||r.status===tab;const s=q.toLowerCase();return t&&(!s||r.ncr_no.toLowerCase().includes(s)||(r.item_name??"").toLowerCase().includes(s)||r.defect_type.toLowerCase().includes(s));}),[rows,tab,q]);
  const openN=()=>{setFm({...blank(),ncr_no:`NCR-${new Date().toISOString().slice(0,10)}-${String(rows.length+1).padStart(3,"0")}`});setM(true);};
  const save=async()=>{if(!fm.ncr_no||!fm.defect_type||!fm.detected_by)return;if(!_API)return;setSv(true);try{const c=await createQualityNCR(fm);set(p=>[c,...p]);setM(false);}catch{}finally{setSv(false);};}
  const NX:{[k:string]:{s:string;l:string}}={open:{s:"investigating",l:"조사 시작"},investigating:{s:"resolved",l:"처리 완료"},resolved:{s:"closed",l:"종결"}};
  const adv=async(id:string,s:string)=>{if(!_API)return;setChg(id);try{const u=await updateQualityNCRStatus(id,{status:s});set(p=>p.map(r=>r.id===u.id?u:r));}catch{}finally{setChg(null);}}
  const openC=rows.filter(r=>r.status==="open").length;const crit=rows.filter(r=>r.severity==="critical"&&r.status!=="closed").length;
  const importNcr=(results:{rows:ParsedRow[]}[])=>{
    const mapped:QualityNCR[]=results.flatMap(r=>r.rows.map((row,i)=>({
      id:`imp-${Date.now()}-${i}`,
      ncr_no:String(row["NCR번호"]??row["ncr_no"]??`NCR-IMP-${i+1}`),
      detected_at:String(row["발견일"]??row["detected_at"]??new Date().toISOString().slice(0,10)),
      department_code:String(row["부서코드"]??row["department_code"]??"QUAL"),
      item_code:String(row["품목코드"]??row["item_code"]??""),
      item_name:String(row["품목명"]??row["item_name"]??null),
      defect_type:String(row["불량유형"]??row["defect_type"]??"미분류"),
      defect_qty:Number(row["불량수량"]??row["defect_qty"]??0),
      total_qty:Number(row["전체수량"]??row["total_qty"]??0),
      defect_rate:Number(row["불량률"]??row["defect_rate"]??0),
      status:String(row["상태"]??row["status"]??"open") as QualityNCR["status"],
      severity:String(row["심각도"]??row["severity"]??"major") as QualityNCR["severity"],
      detected_by:String(row["발견자"]??row["detected_by"]??""),
      root_cause:String(row["근본원인"]??row["root_cause"]??null),
      action_taken:String(row["조치사항"]??row["action_taken"]??null),
      resolved_at:(row["해결일"]!=null||row["resolved_at"]!=null)?String(row["해결일"]??row["resolved_at"]):null,
      customer_name:String(row["고객사"]??row["customer_name"]??null),
      remark:String(row["비고"]??row["remark"]??null),
    })));
    set(prev=>[...mapped,...prev]);
  };
  return (
    <div>
      <PgHdr title="품질 부적합 관리 (NCR)" sub="부적합 보고서 등록 · 원인 조사 · 처리 이력" actions={<><Btn v="secondary" icon={<RefreshCw size={12}/>} onClick={fetch_}>새로고침</Btn><FileImportButton variant="excel" accept="both" label="엑셀/PDF 불러오기" onImport={importNcr}/><Btn v="primary" icon={<Plus size={12}/>} onClick={openN}>NCR 등록</Btn></>}/>
      <div className="mb-5 grid grid-cols-4 gap-3"><StatC label="전체 NCR" value={rows.length} unit="건"/><StatC label="미처리" value={openC} unit="건" warn={openC>0}/><StatC label="조사중" value={rows.filter(r=>r.status==="investigating").length} unit="건"/><StatC label="치명적 미결" value={crit} unit="건" warn={crit>0}/></div>
      {crit>0&&<div className="mb-4 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5"><AlertTriangle size={13} className="shrink-0 text-red-500"/><p className="font-semibold text-red-700" style={{fontSize:11}}>치명적(Critical) NCR <strong>{crit}건</strong> — 즉시 조치 필요</p></div>}
      <Tabs tabs={tabs} active={tab} set={setTab}/>
      <Srch v={q} set={setQ} ph="NCR번호, 품목명, 불량유형 검색"/>
      <Tbl cols={["NCR 번호","발생일","고객사","품목명","불량유형","불량수↓","전체수↓","불량률↓","심각도","상태","조치"]}>
        {load?<tr><td colSpan={11} className="py-10 text-center text-slate-400" style={{fontSize:11}}>불러오는 중…</td></tr>:fil.length===0?<NoRow n={11} msg="조회된 NCR이 없습니다"/>:fil.map(r=>{const st=NCR_S[r.status]??{l:r.status,c:"gray"};const sv2=NCR_V[r.severity]??{l:r.severity,c:"gray"};const nx=NX[r.status];return(
          <TR key={r.id}><TD mono>{r.ncr_no}</TD><TD muted>{fd(r.detected_at)}</TD><TD muted>{r.customer_name||"-"}</TD><TD bold>{r.item_name||"-"}</TD><td className="px-3 py-2 text-slate-600" style={{fontSize:11}}>{r.defect_type}</td><td className="px-3 py-2 text-right tabular-nums font-bold text-red-500" style={{fontSize:11}}>{r.defect_qty.toLocaleString()}</td><TD r>{r.total_qty.toLocaleString()}</TD><td className="px-3 py-2 text-right tabular-nums font-semibold text-[#1e2247]" style={{fontSize:11}}>{r.defect_rate}%</td><td className="px-3 py-2"><Badge l={sv2.l} c={sv2.c}/></td><td className="px-3 py-2"><Badge l={st.l} c={st.c}/></td><td className="px-3 py-2">{nx&&<button onClick={()=>adv(r.id,nx.s)} disabled={chg===r.id} className="rounded-lg bg-slate-100 px-2 py-0.5 font-medium text-slate-600 hover:bg-indigo-50 hover:text-[#5c6bc0] disabled:opacity-50 transition-colors" style={{fontSize:10}}>{chg===r.id?"처리중…":nx.l}</button>}</td>
          </TR>
        );})}
      </Tbl>
      {modal&&<Modal title="NCR 신규 등록" onClose={()=>setM(false)} wide>
        <div className="grid grid-cols-2 gap-3">
          <Fld label="NCR 번호" req><Inp value={fm.ncr_no} onChange={e=>setFm(f=>({...f,ncr_no:e.target.value}))}/></Fld>
          <Fld label="발생일"><Inp type="date" value={fm.detected_at} onChange={e=>setFm(f=>({...f,detected_at:e.target.value}))}/></Fld>
          <Fld label="고객사"><Inp value={fm.customer_name??""} onChange={e=>setFm(f=>({...f,customer_name:e.target.value}))}/></Fld>
          <Fld label="품목명"><Inp value={fm.item_name??""} onChange={e=>setFm(f=>({...f,item_name:e.target.value}))}/></Fld>
          <Fld label="불량 유형" req><Inp value={fm.defect_type} onChange={e=>setFm(f=>({...f,defect_type:e.target.value}))} placeholder="예: 조립불량"/></Fld>
          <Fld label="심각도"><Sl v={fm.severity} set={v=>setFm(f=>({...f,severity:v}))} opts={[{value:"critical",label:"치명적"},{value:"major",label:"주요"},{value:"minor",label:"경미"}]}/></Fld>
          <Fld label="전체 수량"><Inp type="number" value={fm.total_qty} onChange={e=>setFm(f=>({...f,total_qty:+e.target.value}))}/></Fld>
          <Fld label="불량 수량"><Inp type="number" value={fm.defect_qty} onChange={e=>setFm(f=>({...f,defect_qty:+e.target.value}))}/></Fld>
          <Fld label="발견자" req><Inp value={fm.detected_by} onChange={e=>setFm(f=>({...f,detected_by:e.target.value}))}/></Fld>
          <Fld label="담당부서"><Inp value={fm.department_code} onChange={e=>setFm(f=>({...f,department_code:e.target.value}))}/></Fld>
          <div className="col-span-2"><Fld label="원인 분석"><Inp value={fm.root_cause??""} onChange={e=>setFm(f=>({...f,root_cause:e.target.value}))}/></Fld></div>
        </div>
        <div className="mt-5 flex justify-end gap-1.5"><Btn v="secondary" onClick={()=>setM(false)}>취소</Btn><Btn v="primary" onClick={save} disabled={sv} icon={<Save size={12}/>}>{sv?"등록중…":"등록"}</Btn></div>
      </Modal>}
    </div>
  );
}

function InvSec() {
  const [ldg,setLdg]=useState<InventoryLedger[]>([]);const [txs,setTxs]=useState<InventoryTransaction[]>([]);const [lL,setLL]=useState(true);const [tL,setTL]=useState(false);const [sel,setSel]=useState<InventoryLedger|null>(null);const [bo,setBo]=useState(false);const [modal,setM]=useState(false);const [sv,setSv]=useState(false);const [err,setErr]=useState<string|null>(null);
  const [fm,setFm]=useState<InventoryTransactionCreatePayload>({item_code:"",tx_type:"receipt",qty:0,warehouse:"",reference_no:"",note:""});
  const API_ON = process.env.NEXT_PUBLIC_API_ENABLED !== "false";
  const fL=useCallback(async()=>{if(!API_ON){setLL(false);return;}setLL(true);try{setLdg(await listInventoryLedger({below_safety_only:bo}));}catch{setLdg([]);}finally{setLL(false);};},[bo,API_ON]);
  const fT=useCallback(async(c?:string)=>{if(!API_ON){setTL(false);return;}setTL(true);try{setTxs(await listInventoryTransactions(c?{item_code:c}:{}));}catch{setTxs([]);}finally{setTL(false);};},[API_ON]);
  useEffect(()=>{fL();},[fL]);
  const pick=(it:InventoryLedger)=>{setSel(it);fT(it.item_code);setFm({item_code:it.item_code,tx_type:"receipt",qty:0,warehouse:it.warehouse,reference_no:"",note:""});};
  const doTx=async()=>{if(!fm.item_code||!fm.qty){setErr("품목과 수량을 입력해주세요.");return;}if(!API_ON){setErr("API가 비활성화 상태입니다.");return;}setSv(true);setErr(null);try{await createInventoryTransaction(fm);await fL();if(fm.item_code)await fT(fm.item_code);setM(false);}catch(e:unknown){setErr(e instanceof Error?e.message:"처리 오류");}finally{setSv(false);};};
  const bc=ldg.filter(l=>l.is_below_safety).length;
  const importLdg=(results:{rows:ParsedRow[]}[])=>{
    const mapped:InventoryLedger[]=results.flatMap(r=>r.rows.map((row,i)=>({
      id:`imp-${Date.now()}-${i}`,
      item_code:String(row["품목코드"]??row["item_code"]??`IMP-${i+1}`),
      item_name:String(row["품목명"]??row["item_name"]??""),
      spec:String(row["규격"]??row["spec"]??"")||null,
      unit:String(row["단위"]??row["unit"]??"EA"),
      warehouse:String(row["창고"]??row["warehouse"]??""),
      stock_qty:Number(row["현재재고"]??row["stock_qty"]??0),
      safety_stock:Number(row["안전재고"]??row["safety_stock"]??0),
      is_below_safety:Boolean(row["안전재고미달"]??row["is_below_safety"]??false),
      last_updated:String(row["최종수정일"]??row["last_updated"]??new Date().toISOString()),
    })));
    setLdg(prev=>[...mapped,...prev]);
  };
  return (
    <div>
      <PgHdr title="재고 현황 관리" sub="품목별 재고 원장 조회 및 입출고 처리" actions={<><Btn v="secondary" icon={<RefreshCw size={12}/>} onClick={fL}>새로고침</Btn><FileImportButton variant="excel" accept="both" label="엑셀/PDF 불러오기" onImport={importLdg}/><Btn v="primary" icon={<Plus size={12}/>} onClick={()=>{setErr(null);setM(true);}}>입출고 처리</Btn></>}/>
      <div className="mb-5 grid grid-cols-4 gap-3"><StatC label="등록 품목" value={ldg.length} unit="종"/><StatC label="안전재고 미달" value={bc} unit="종" warn={bc>0}/><StatC label="정상 재고" value={ldg.length-bc} unit="종"/><StatC label="입출고 이력" value={txs.length} unit="건"/></div>
      {bc>0&&<div className="mb-4 flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5"><div className="flex items-center gap-2.5"><AlertTriangle size={13} className="shrink-0 text-amber-500"/><p className="font-semibold text-amber-700" style={{fontSize:11}}>안전재고 미달 <strong>{bc}종</strong> — 구매요청 검토</p></div><label className="flex cursor-pointer items-center gap-1.5 font-semibold text-amber-700" style={{fontSize:10}}><input type="checkbox" checked={bo} onChange={e=>setBo(e.target.checked)}/>미달만 보기</label></div>}
      <div className="grid gap-4 xl:grid-cols-2">
        <div><p className="mb-2 font-semibold text-slate-500" style={{fontSize:11}}>재고 원장</p>
          {lL?<p className="py-10 text-center text-slate-400" style={{fontSize:11}}>불러오는 중…</p>:(
            <Tbl cols={["품목코드","품목명","창고","현재 재고↓","안전재고↓","상태"]}>
              {ldg.length===0?<NoRow n={6}/>:ldg.map(it=>(
                <TR key={it.id} onClick={()=>pick(it)}>
                  <TD mono>{it.item_code}</TD>
                  <td className={`px-3 py-2 font-medium ${sel?.id===it.id?"text-[#5c6bc0]":"text-[#1e2247]"}`} style={{fontSize:11}}>{it.item_name}</td>
                  <TD muted>{it.warehouse}</TD>
                  <td className={`px-3 py-2 text-right tabular-nums font-bold ${it.is_below_safety?"text-red-500":"text-[#1e2247]"}`} style={{fontSize:11}}>{it.stock_qty.toLocaleString()} <span className="font-normal text-slate-400">{it.unit}</span></td>
                  <TD r>{it.safety_stock.toLocaleString()}</TD>
                  <td className="px-3 py-2"><Badge l={it.is_below_safety?"미달":"정상"} c={it.is_below_safety?"red":"green"}/></td>
                </TR>
              ))}
            </Tbl>
          )}
        </div>
        <div><p className="mb-2 font-semibold text-slate-500" style={{fontSize:11}}>입출고 이력{sel&&` — ${sel.item_name}`}{tL&&<span className="ml-2 font-normal text-slate-400">로딩…</span>}</p>
          {!sel?<div className="flex items-center justify-center rounded-xl border border-dashed border-[#e8eaf0] bg-white py-14 text-slate-400" style={{fontSize:11}}>품목을 클릭하면 이력이 표시됩니다</div>
          :txs.length===0?<div className="rounded-xl border border-[#e8eaf0] bg-white py-10 text-center text-slate-400" style={{fontSize:11}}>입출고 이력이 없습니다</div>:(
            <Tbl cols={["일시","유형","수량","잔고↓","참조번호","담당자"]}>
              {txs.map(tx=>{const t=TX_S[tx.tx_type]??{l:tx.tx_type,c:"gray"};return(
                <TR key={tx.id}><TD muted>{new Date(tx.tx_at).toLocaleDateString("ko-KR")}</TD><td className="px-3 py-2"><Badge l={t.l} c={t.c}/></td><td className={`px-3 py-2 text-right tabular-nums font-bold ${tx.tx_type==="issue"?"text-red-500":"text-emerald-500"}`} style={{fontSize:11}}>{tx.tx_type==="issue"?"-":"+"}{Math.abs(tx.qty).toLocaleString()}</td><TD r bold>{tx.balance_after.toLocaleString()}</TD><TD muted>{tx.reference_no||"-"}</TD><td className="px-3 py-2 text-[#1e2247]" style={{fontSize:11}}>{tx.actor_name}</td></TR>
              );})}
            </Tbl>
          )}
        </div>
      </div>
      {modal&&<Modal title="입출고 처리" onClose={()=>setM(false)}><div className="space-y-3">
        <Fld label="품목" req><Sl v={fm.item_code} set={v=>{const it=ldg.find(l=>l.item_code===v);setFm(f=>({...f,item_code:v,warehouse:it?.warehouse??""}));}} opts={[{value:"",label:"품목 선택"},...ldg.map(l=>({value:l.item_code,label:`${l.item_code} — ${l.item_name} (재고 ${l.stock_qty})`}))]}/></Fld>
        <Fld label="처리 유형" req><Sl v={fm.tx_type} set={v=>setFm(f=>({...f,tx_type:v}))} opts={[{value:"receipt",label:"입고"},{value:"issue",label:"출고"},{value:"adjust",label:"재고 조정"},{value:"return",label:"반납 입고"}]}/></Fld>
        <Fld label="수량" req><Inp type="number" value={fm.qty} onChange={e=>setFm(f=>({...f,qty:+e.target.value}))}/></Fld>
        <Fld label="창고"><Inp value={fm.warehouse} onChange={e=>setFm(f=>({...f,warehouse:e.target.value}))}/></Fld>
        <Fld label="참조번호"><Inp value={fm.reference_no} onChange={e=>setFm(f=>({...f,reference_no:e.target.value}))} placeholder="WO번호, SO번호 등"/></Fld>
        {err&&<div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-red-600" style={{fontSize:11}}><AlertTriangle size={11}/>{err}</div>}
      </div><div className="mt-5 flex justify-end gap-1.5"><Btn v="secondary" onClick={()=>setM(false)}>취소</Btn><Btn v="primary" onClick={doTx} disabled={sv} icon={<Save size={12}/>}>{sv?"처리중…":"처리 확정"}</Btn></div></Modal>}
    </div>
  );
}

function SalesSec() {
  const [tab,setTab]=useState("전체");const [q,setQ]=useState("");
  const tabs=useMemo(()=>[{key:"전체",label:"전체",n:SALES.length},{key:"received",label:"수주접수",n:SALES.filter(o=>o.status==="received").length},{key:"in_production",label:"생산중",n:SALES.filter(o=>o.status==="in_production").length},{key:"shipped",label:"출하완료",n:SALES.filter(o=>o.status==="shipped").length},{key:"completed",label:"납품완료",n:SALES.filter(o=>o.status==="completed").length}],[]);
  const fil=useMemo(()=>SALES.filter(o=>{const t=tab==="전체"||o.status===tab;const s=q.toLowerCase();return t&&(!s||o.order_no.toLowerCase().includes(s)||o.customer.toLowerCase().includes(s)||o.product_name.toLowerCase().includes(s));}),[tab,q]);
  const total=SALES.reduce((a,o)=>a+o.amount,0);const del=SALES.filter(o=>o.is_delayed).length;
  return (
    <div>
      <PgHdr title="수주 / 영업 관리" sub="고객사 수주 현황 및 납기 진행 상황 관리" actions={<><Btn v="secondary" icon={<Download size={12}/>}>엑셀</Btn><Btn v="secondary" icon={<Printer size={12}/>}>출력</Btn></>}/>
      <div className="mb-5 grid grid-cols-4 gap-3"><StatC label="총 수주" value={`${SALES.length}건`}/><StatC label="이달 수주액" value={fa(total)}/><StatC label="납품완료" value={fa(SALES.filter(o=>o.status==="completed").reduce((a,o)=>a+o.amount,0))}/><StatC label="납기 지연" value={del} unit="건" warn={del>0}/></div>
      {del>0&&<div className="mb-4 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5"><AlertTriangle size={13} className="shrink-0 text-red-500"/><p className="font-semibold text-red-700" style={{fontSize:11}}>납기 지연 <strong>{del}건</strong> — 고객사 납기 조율 및 생산 우선순위 조정 필요</p></div>}
      <Tabs tabs={tabs} active={tab} set={setTab}/>
      <Srch v={q} set={setQ} ph="수주번호, 고객사, 품목명 검색"/>
      <Tbl cols={["수주번호","고객사","품목명","수주수량↓","출하수량↓","달성률","수주일","납기일","수주금액↓","상태"]}>
        {fil.length===0?<NoRow n={10}/>:fil.map(o=>{const s=SO_S[o.status]??{l:o.status,c:"gray"};return(
          <TR key={o.id}><TD mono>{o.order_no}</TD><TD bold>{o.customer}</TD><td className="px-3 py-2 text-[#1e2247]" style={{fontSize:11}}>{o.product_name}</td><TD r>{o.order_qty.toLocaleString()}</TD><TD r bold>{o.shipped_qty.toLocaleString()}</TD><td className="px-3 py-2"><PBar a={o.shipped_qty} b={o.order_qty} c={pct(o.shipped_qty,o.order_qty)>=100?"green":"indigo"}/></td><TD muted>{o.order_date}</TD><td className={`px-3 py-2 ${o.is_delayed?"font-bold text-red-500":"text-slate-400"}`} style={{fontSize:11}}>{o.due_date}{o.is_delayed&&" ⚠"}</td><TD r bold>{fa(o.amount)}</TD><td className="px-3 py-2"><Badge l={s.l} c={s.c}/></td></TR>
        );})}
      </Tbl>
    </div>
  );
}

function PurchSec() {
  const [rows,set]=useState<PurchReq[]>(PRS);const [tab,setTab]=useState("전체");const [q,setQ]=useState("");const [modal,setM]=useState(false);
  const blank=()=>({pr_no:"",material_name:"",qty:0,unit:"EA",required_date:new Date().toISOString().slice(0,10),requester:"생산팀",reason:"",vendor:""});
  const [fm,setFm]=useState(blank());
  const tabs=useMemo(()=>[{key:"전체",label:"전체",n:rows.length},{key:"requested",label:"요청",n:rows.filter(r=>r.status==="requested").length},{key:"approved",label:"승인",n:rows.filter(r=>r.status==="approved").length},{key:"ordered",label:"발주완료",n:rows.filter(r=>r.status==="ordered").length},{key:"received",label:"입고완료",n:rows.filter(r=>r.status==="received").length}],[rows]);
  const fil=useMemo(()=>rows.filter(r=>{const t=tab==="전체"||r.status===tab;const s=q.toLowerCase();return t&&(!s||r.pr_no.toLowerCase().includes(s)||r.material_name.toLowerCase().includes(s));}),[rows,tab,q]);
  const openN=()=>{setFm({...blank(),pr_no:`PR-${new Date().toISOString().slice(0,10)}-${String(rows.length+1).padStart(3,"0")}`});setM(true);};
  const save=()=>{if(!fm.material_name||!fm.qty)return;set(p=>[{id:uid(),pr_no:fm.pr_no,material_name:fm.material_name,qty:fm.qty,unit:fm.unit,required_date:fm.required_date,status:"requested",requester:fm.requester,reason:fm.reason,vendor:fm.vendor||undefined},...p]);setM(false);};
  const adv=(id:string)=>{const nx:{[k:string]:string}={requested:"approved",approved:"ordered",ordered:"received"};set(p=>p.map(r=>r.id===id?{...r,status:nx[r.status]??r.status}:r));};
  const NXL:{[k:string]:string}={requested:"승인",approved:"발주",ordered:"입고확인"};
  return (
    <div>
      <PgHdr title="구매 / 자재 관리" sub="자재 구매요청 및 발주 현황 관리" actions={<><Btn v="secondary" icon={<Download size={12}/>}>엑셀</Btn><Btn v="primary" icon={<Plus size={12}/>} onClick={openN}>구매요청</Btn></>}/>
      <div className="mb-5 grid grid-cols-4 gap-3">{tabs.slice(1,5).map(t=><StatC key={t.key} label={t.label} value={t.n} unit="건"/>)}</div>
      <Tabs tabs={tabs} active={tab} set={setTab}/>
      <Srch v={q} set={setQ} ph="요청번호, 자재명 검색"/>
      <Tbl cols={["요청번호","자재명","수량↓","단위","필요일","요청부서","사유","공급업체","상태","처리"]}>
        {fil.length===0?<NoRow n={10}/>:fil.map(r=>{const s=PR_S[r.status]??{l:r.status,c:"gray"};return(
          <TR key={r.id}><TD mono>{r.pr_no}</TD><TD bold>{r.material_name}</TD><TD r bold>{r.qty.toLocaleString()}</TD><TD muted>{r.unit}</TD><TD muted>{r.required_date}</TD><td className="px-3 py-2 text-slate-600" style={{fontSize:11}}>{r.requester}</td><td className="max-w-32 truncate px-3 py-2 text-slate-400" style={{fontSize:10}}>{r.reason}</td><TD muted>{r.vendor||"-"}</TD><td className="px-3 py-2"><Badge l={s.l} c={s.c}/></td><td className="px-3 py-2">{r.status!=="received"&&<button onClick={()=>adv(r.id)} className="rounded-lg bg-slate-100 px-2 py-0.5 font-medium text-slate-600 hover:bg-indigo-50 hover:text-[#5c6bc0] transition-colors" style={{fontSize:10}}>{NXL[r.status]}</button>}</td></TR>
        );})}
      </Tbl>
      {modal&&<Modal title="구매요청 등록" onClose={()=>setM(false)} wide>
        <div className="grid grid-cols-2 gap-3">
          <Fld label="요청번호" req><Inp value={fm.pr_no} onChange={e=>setFm(f=>({...f,pr_no:e.target.value}))}/></Fld>
          <Fld label="요청부서"><Inp value={fm.requester} onChange={e=>setFm(f=>({...f,requester:e.target.value}))}/></Fld>
          <Fld label="자재명" req><Inp value={fm.material_name} onChange={e=>setFm(f=>({...f,material_name:e.target.value}))}/></Fld>
          <Fld label="단위"><Sl v={fm.unit} set={v=>setFm(f=>({...f,unit:v}))} opts={[{value:"EA",label:"EA"},{value:"KG",label:"KG"},{value:"M",label:"M"}]}/></Fld>
          <Fld label="수량" req><Inp type="number" value={fm.qty} onChange={e=>setFm(f=>({...f,qty:+e.target.value}))}/></Fld>
          <Fld label="필요일"><Inp type="date" value={fm.required_date} onChange={e=>setFm(f=>({...f,required_date:e.target.value}))}/></Fld>
          <Fld label="공급업체"><Inp value={fm.vendor} onChange={e=>setFm(f=>({...f,vendor:e.target.value}))}/></Fld>
          <div className="col-span-2"><Fld label="요청 사유" req><Inp value={fm.reason} onChange={e=>setFm(f=>({...f,reason:e.target.value}))} placeholder="예: 재고 부족, 긴급 수주 대응"/></Fld></div>
        </div>
        <div className="mt-5 flex justify-end gap-1.5"><Btn v="secondary" onClick={()=>setM(false)}>취소</Btn><Btn v="primary" onClick={save} icon={<Save size={12}/>}>등록</Btn></div>
      </Modal>}
    </div>
  );
}

function ReportSec({inqs,ncrs,ledg}:{inqs:ProductionInquiry[];ncrs:QualityNCR[];ledg:InventoryLedger[]}) {
  const wk=(()=>{const d=new Date(),m=new Date(d),f2=new Date(d);m.setDate(d.getDate()-d.getDay()+1);f2.setDate(m.getDate()+4);return`${m.toLocaleDateString("ko-KR")} ~ ${f2.toLocaleDateString("ko-KR")}`;})();
  const done=inqs.filter(i=>i.status==="입고완료");const pr=pct(done.length,inqs.length||1);
  const dQ=ncrs.reduce((a,n)=>a+n.defect_qty,0),tQ=ncrs.reduce((a,n)=>a+n.total_qty,0);const dr=tQ?(dQ/tQ*100).toFixed(2):"0.00";
  const on=ncrs.filter(n=>n.status==="open"||n.status==="investigating");const bel=ledg.filter(l=>l.is_below_safety);

  // 실시간 히스토리 시뮬레이션 (12포인트)
  const seed = (base:number,spread:number)=>Array.from({length:12},(_,i)=>Math.max(0,Math.min(100,base+Math.sin(i*0.7)*spread+(Math.random()-0.5)*spread*0.6)));
  const [rptHist, setRptHist] = useState({
    pr:  seed(pr, 8),
    dr:  seed(+dr, 1.2),
    ncr: seed(on.length||0, 1),
    bel: seed(bel.length||0, 1),
  });
  const [rptTick, setRptTick] = useState(0);
  useEffect(()=>{
    const t=setInterval(()=>{
      setRptHist(h=>({
        pr:  [...h.pr.slice(1),  Math.max(0,Math.min(100, h.pr[h.pr.length-1]  +(Math.random()-0.45)*5))],
        dr:  [...h.dr.slice(1),  Math.max(0, h.dr[h.dr.length-1]  +(Math.random()-0.5)*0.4)],
        ncr: [...h.ncr.slice(1), Math.max(0, h.ncr[h.ncr.length-1]+(Math.random()-0.5)*0.8)],
        bel: [...h.bel.slice(1), Math.max(0, h.bel[h.bel.length-1]+(Math.random()-0.5)*0.8)],
      }));
      setRptTick(x=>x+1);
    },2800);
    return ()=>clearInterval(t);
  },[]);

  // KPI 박스 정의
  const rptKpis = [
    {
      l:"생산 달성률", v:`${pr}%`, g:pr>=80,
      hist: rptHist.pr,
      s:`${done.length}/${inqs.length}건`,
      bg: pr>=80
        ? "linear-gradient(135deg,#065f46 0%,#047857 100%)"
        : "linear-gradient(135deg,#92400e 0%,#b45309 100%)",
      accent: pr>=80 ? "#6ee7b7" : "#fde68a",
    },
    {
      l:"품질 불량률", v:`${dr}%`, g:+dr<=2,
      hist: rptHist.dr,
      s:`불량 ${dQ} / 전체 ${tQ}`,
      bg: +dr<=2
        ? "linear-gradient(135deg,#164e63 0%,#0e7490 100%)"
        : "linear-gradient(135deg,#7f1d1d 0%,#b91c1c 100%)",
      accent: +dr<=2 ? "#67e8f9" : "#fca5a5",
    },
    {
      l:"미결 NCR", v:`${on.length}건`, g:on.length===0,
      hist: rptHist.ncr,
      s:`처리완료 ${ncrs.filter(n=>n.status==="resolved").length}건`,
      bg: on.length===0
        ? "linear-gradient(135deg,#1e3a5f 0%,#1d4ed8 100%)"
        : "linear-gradient(135deg,#7c2d12 0%,#c2410c 100%)",
      accent: on.length===0 ? "#93c5fd" : "#fdba74",
    },
    {
      l:"재고 미달", v:`${bel.length}종`, g:bel.length===0,
      hist: rptHist.bel,
      s:"구매요청 검토",
      bg: bel.length===0
        ? "linear-gradient(135deg,#3b0764 0%,#7e22ce 100%)"
        : "linear-gradient(135deg,#831843 0%,#be185d 100%)",
      accent: bel.length===0 ? "#d8b4fe" : "#fbcfe8",
    },
  ];

  return (
    <div>
      <PgHdr title="주간 보고서" sub={wk} actions={<><Btn v="secondary" icon={<Download size={12}/>}>PDF</Btn><Btn v="secondary" icon={<Printer size={12}/>}>인쇄</Btn></>}/>
      <div className="overflow-hidden rounded-xl border border-[#e8eaf0] bg-white shadow-sm">
        <div className="flex items-start justify-between px-7 py-6" style={{background:"linear-gradient(120deg,#1e2247 0%,#2e3b7a 100%)"}}>
          <div>
            <p className="font-bold uppercase tracking-[0.2em] text-[#5c6bc0]" style={{fontSize:9}}>F.A.C.T Manufacturing ERP</p>
            <h2 className="mt-2 font-bold tracking-tight text-white" style={{fontSize:20}}>주간 생산 · 품질 · 재고 보고서</h2>
            <p className="mt-1 text-[#9498b2]" style={{fontSize:11}}>{wk}</p>
          </div>
          <div className="text-right text-[#9498b2]" style={{fontSize:10}}>
            <p>작성일 {new Date().toLocaleDateString("ko-KR")}</p>
            <p className="mt-0.5">심현보 · 생산관리팀</p>
          </div>
        </div>
        <div className="space-y-6 px-7 py-6">
          {/* KPI 카드 4종 — 미니 바 차트 포함 */}
          <div className="grid grid-cols-4 gap-3">
            {rptKpis.map((k,ci)=>(
              <div
                key={k.l}
                className="relative overflow-hidden rounded-2xl p-4 text-white"
                style={{
                  background: k.bg,
                  boxShadow:"0 4px 18px rgba(0,0,0,0.22)",
                  animation:`card-in 0.5s cubic-bezier(.22,.68,0,1.2) ${ci*80}ms both`,
                }}
              >
                {/* 데코 원 */}
                <div style={{position:"absolute",right:-16,top:-16,width:64,height:64,borderRadius:"50%",background:"rgba(255,255,255,0.07)",pointerEvents:"none"}}/>
                {/* 라이브 표시 */}
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-white/75" style={{fontSize:11}}>{k.l}</p>
                  <span className="flex items-center gap-1" style={{fontSize:9,color:"rgba(255,255,255,0.55)"}}>
                    <span className="live-dot inline-block h-1.5 w-1.5 rounded-full bg-white/80"/>LIVE
                  </span>
                </div>
                {/* 수치 */}
                <p
                  className="font-black leading-none tabular-nums text-white"
                  style={{fontSize:30,letterSpacing:"-0.03em",marginTop:4}}
                  key={rptTick}
                >
                  {k.v}
                </p>
                {/* 미니 바 차트 */}
                <MiniBarChart data={k.hist} accent={k.accent} animKey={`${ci}-${rptTick}`}/>
                {/* 서브 텍스트 */}
                <p style={{fontSize:9,color:"rgba(255,255,255,0.55)",marginTop:4}}>{k.s}</p>
              </div>
            ))}
          </div>
          {[{title:"1. 생산 입고 실적",cols:["품목명","작업지시번호","계획↓","입고↓","달성률↓","상태"],rows:inqs.slice(0,8).map(i=>{const s=INQ_S[i.status]??{l:i.status,c:"gray"};return(<TR key={i.id}><TD bold>{i.item_name||"-"}</TD><TD mono>{i.workorder_no}</TD><TD r>{i.planned_qty.toLocaleString()}</TD><TD r bold>{i.receipt_qty.toLocaleString()}</TD><td className="px-3 py-2 text-right tabular-nums font-semibold text-[#1e2247]" style={{fontSize:11}}>{pct(i.receipt_qty,i.planned_qty)}%</td><td className="px-3 py-2"><Badge l={s.l} c={s.c}/></td></TR>);})}].map(sec=>(
            <section key={sec.title}><h3 className="mb-2.5 font-semibold text-[#1e2247]" style={{fontSize:12}}>{sec.title}</h3><Tbl cols={sec.cols}><>{sec.rows.length===0?<NoRow n={sec.cols.length}/>:sec.rows}</></Tbl></section>
          ))}
          <section><h3 className="mb-2.5 font-semibold text-[#1e2247]" style={{fontSize:12}}>2. 품질 부적합 현황</h3><Tbl cols={["NCR번호","고객사","품목","불량유형","불량/전체↓","불량률↓","심각도","상태"]}>{ncrs.length===0?<NoRow n={8} msg="NCR 없음"/>:ncrs.map(n=>{const st=NCR_S[n.status]??{l:n.status,c:"gray"};const sv2=NCR_V[n.severity]??{l:n.severity,c:"gray"};return(<TR key={n.id}><TD mono>{n.ncr_no}</TD><TD muted>{n.customer_name||"-"}</TD><TD bold>{n.item_name||"-"}</TD><td className="px-3 py-2 text-slate-600" style={{fontSize:11}}>{n.defect_type}</td><td className="px-3 py-2 text-right tabular-nums" style={{fontSize:11}}>{n.defect_qty}/{n.total_qty}</td><td className="px-3 py-2 text-right tabular-nums font-semibold" style={{fontSize:11}}>{n.defect_rate}%</td><td className="px-3 py-2"><Badge l={sv2.l} c={sv2.c}/></td><td className="px-3 py-2"><Badge l={st.l} c={st.c}/></td></TR>);})}</Tbl></section>
          <section><h3 className="mb-2.5 font-semibold text-[#1e2247]" style={{fontSize:12}}>3. 재고 현황</h3><Tbl cols={["품목코드","품목명","창고","현재재고↓","안전재고↓","상태"]}>{ledg.map(l=>(<TR key={l.id}><TD mono>{l.item_code}</TD><TD bold>{l.item_name}</TD><TD muted>{l.warehouse}</TD><td className={`px-3 py-2 text-right tabular-nums font-bold ${l.is_below_safety?"text-red-500":"text-[#1e2247]"}`} style={{fontSize:11}}>{l.stock_qty.toLocaleString()} {l.unit}</td><TD r>{l.safety_stock.toLocaleString()}</TD><td className="px-3 py-2"><Badge l={l.is_below_safety?"미달":"정상"} c={l.is_below_safety?"amber":"green"}/></td></TR>))}</Tbl></section>
          <div className="grid grid-cols-4 gap-4 border-t border-[#eef1f8] pt-5">{["작 성","검 토","팀 장","대 표"].map(r=>(<div key={r} className="text-center"><p className="mb-10 text-slate-400" style={{fontSize:10}}>{r}</p><div className="mx-4 border-b border-slate-300"/><p className="mt-1.5 text-slate-300" style={{fontSize:9}}>(서명)</p></div>))}</div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
//  APP SHELL
// ─────────────────────────────────────────────────────────────────────────────

const NAV:[NavKey,string,React.ElementType][] = [
  ["dashboard","대시보드",LayoutDashboard],
  ["production","생산관리",Factory],
  ["quality","품질관리",ClipboardCheck],
  ["sales","영업관리",ShoppingBag],
  ["purchase","구매/자재",Truck],
  ["aislvina","AISLVINA",Cpu],
  ["reports","보고서",FileBarChart2],
  ["approvals","승인",FileSignature],
];

export default function AppShell() {
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [nav,setNav]   = useState<NavKey>("dashboard");
  const [inqs,setInqs] = useState<ProductionInquiry[]>([]);
  const [ncrs,setNcrs] = useState<QualityNCR[]>([]);
  const [ledg,setLedg] = useState<InventoryLedger[]>([]);
  const [notif,setNotif]= useState(false);

  // ── 모든 훅은 조건문/이른반환 이전에 선언해야 합니다 ────────────
  useEffect(()=>{
    if (!authUser) return;

    // NEXT_PUBLIC_API_ENABLED=false 이면 fetch 요청 자체를 하지 않음
    // → ERR_CONNECTION_REFUSED 브라우저 오류 원천 차단
    const apiEnabled = process.env.NEXT_PUBLIC_API_ENABLED !== "false";
    if (!apiEnabled) {
      // 백엔드 미사용 시 목(mock) 데이터로 대시보드 채우기
      setNcrs(MOCK_NCRS);
      setLedg(MOCK_LEDG);
      setInqs(MOCK_INQS);
      return;
    }

    Promise.all([
      getProductionInquiries().catch(()=>[] as ProductionInquiry[]),
      listQualityNCRs().catch(()=>[] as QualityNCR[]),
      listInventoryLedger().catch(()=>[] as InventoryLedger[]),
    ]).then(([a,b,c])=>{ setInqs(a); setNcrs(b); setLedg(c); });
  },[authUser]);

  // ── 로그인 전 화면 (훅 선언 이후에 이른 반환) ────────────────────
  if (!authUser) {
    return <LoginPage onLogin={u => setAuthUser(u)} />;
  }

  const isAdmin = authUser.role === "관리자";

  const alerts=[
    ...ncrs.filter(n=>n.status==="open"||n.status==="investigating").map(n=>`[NCR] ${n.ncr_no}`),
    ...ledg.filter(l=>l.is_below_safety).map(l=>`[재고] ${l.item_name}`),
    ...SALES.filter(s=>s.is_delayed).map(s=>`[수주] ${s.order_no}`),
  ];

  const cur=NAV.find(n=>n[0]===nav);

  const render=()=>{
    switch(nav){
      case"dashboard": return<Dashboard inqs={inqs} ncrs={ncrs} ledg={ledg} nav={setNav}/>;
      case"production":return<ProductionSection/>;
      case"quality":   return<QualitySection/>;
      case"sales":     return<SalesSection/>;
      case"purchase":  return<PurchaseSection/>;
      case"aislvina":  return<AislvinaSection/>;
      case"reports":   return<ReportSection/>;
      case"approvals": return<ApprovalSection/>;
    }
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{background:"#edf1f3"}}>

        {/* ══ SIDEBAR ════════════════════════════════════════════════ */}
      <aside className="flex w-[210px] shrink-0 flex-col" style={{background:"linear-gradient(180deg,#0a1628 0%,#0e1f38 100%)"}}>

        {/* ── 로고 영역 */}
        <div
          style={{
            height: 88,
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            borderBottom: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <div style={{background:"#ffffff",borderRadius:8,padding:"5px 12px",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <img src="/yd-logo.png" alt="영동테크" style={{height:28,objectFit:"contain",display:"block"}}/>
          </div>
          <p style={{fontSize:10,fontWeight:700,color:"rgba(255,255,255,0.35)",letterSpacing:"0.18em",margin:0}}>
            F.A.C.T  ERP
          </p>
        </div>

        {/* nav group label */}
        <p className="px-4 pb-1.5 pt-4 font-bold uppercase tracking-[0.2em]" style={{fontSize:9,color:"rgba(255,255,255,0.18)"}}>메 뉴</p>

        {/* nav items */}
        <nav className="flex-1 space-y-0.5 overflow-y-auto px-2.5 pb-2">
          {NAV.map(([key,label,Icon])=>{
            const active=nav===key;
            return (
              <button key={key} onClick={()=>setNav(key)}
                className="group flex w-full items-center gap-2.5 rounded-xl px-3 py-3 transition-all"
                style={{
                  background:active?"rgba(13,127,138,0.92)":"transparent",
                  color:active?"#ffffff":"rgba(255,255,255,0.45)",
                  boxShadow:active?"0 2px 12px rgba(13,127,138,0.35)":"none",
                }}>
                <Icon size={active?18:16} style={{color:active?"#ffffff":"rgba(255,255,255,0.32)"}}/>
                <span className="flex-1 text-left font-semibold" style={{fontSize:active?18:15}}>{label}</span>
                {active&&<span className="h-1.5 w-1.5 rounded-full bg-white/60"/>}
              </button>
            );
          })}
        </nav>

        {/* divider */}
        <div className="mx-3.5 border-t" style={{borderColor:"rgba(255,255,255,0.07)"}}/>

        {/* 사용자 + 로그아웃 */}
        <div className="p-3">
          <div className="flex items-center gap-2.5 rounded-xl px-2.5 py-2.5" style={{background:"rgba(255,255,255,0.05)"}}>
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-black text-white" style={{background:isAdmin?"#0d7f8a":"#059669",fontSize:12}}>
              {authUser.initial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1">
                <p className="font-bold text-white" style={{fontSize:13}}>{authUser.name}</p>
                {isAdmin&&<span className="rounded-sm px-1 py-0.5 font-bold" style={{background:"rgba(255,184,0,0.22)",color:"#ffb800",fontSize:8}}>관리자</span>}
              </div>
              <p style={{fontSize:9,color:"rgba(255,255,255,0.3)"}}>{authUser.dept}</p>
            </div>
            <button onClick={()=>setAuthUser(null)} title="로그아웃"
              className="flex h-6 w-6 items-center justify-center rounded-lg transition-all hover:bg-red-500/20"
              style={{color:"rgba(255,255,255,0.28)"}}>
              <LogOut size={13}/>
            </button>
          </div>
        </div>
      </aside>

      {/* ══ MAIN ══════════════════════════════════════════════════ */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

        {/* topbar */}
        <header className="flex h-[66px] shrink-0 items-center justify-between border-b bg-white px-5" style={{borderColor:"#e4e8ee"}}>
          {/* 왼쪽: 섹션 아이콘 + 이름 */}
          <div className="flex items-center gap-2.5">
            {cur&&(()=>{const Icon=cur[2];return(
              <div
                className="flex shrink-0 items-center justify-center"
                style={{
                  width:28,height:28,borderRadius:8,
                  background:"linear-gradient(135deg,#0d7f8a 0%,#0a6470 100%)",
                  boxShadow:"0 2px 8px rgba(13,127,138,0.35)",
                }}
              >
                <Icon size={14} color="#ffffff" strokeWidth={2.2}/>
              </div>
            );})()}
            <div className="flex items-baseline gap-2">
              <p className="font-black" style={{fontSize:24,color:"#0d1117",letterSpacing:"-0.02em"}}>{cur?.[1]}</p>
              <span className="hidden sm:inline" style={{fontSize:10,color:"#c0c8d4"}}>|</span>
              <p className="hidden sm:block" style={{fontSize:10,color:"#b0b8c4"}}>
                {new Date().toLocaleDateString("ko-KR",{year:"numeric",month:"long",day:"numeric",weekday:"short"})}
              </p>
            </div>
          </div>

          {/* 오른쪽 */}
          <div className="flex items-center gap-2">
            {/* 검색 */}
            <div className="hidden items-center gap-2 rounded-xl border bg-[#f8f9fb] px-3 py-2 sm:flex" style={{borderColor:"#e4e8ee"}}>
              <Search size={13} style={{color:"#9aa3b2"}}/>
              <span style={{fontSize:11,color:"#9aa3b2",width:110}}>메뉴 · 품목 검색…</span>
            </div>

            {/* 알림 */}
            <div className="relative">
              <button onClick={()=>setNotif(o=>!o)}
                className="relative flex h-8 w-8 items-center justify-center rounded-xl border bg-white transition-colors hover:bg-[#f8f9fb]"
                style={{borderColor:"#e4e8ee",color:"#9aa3b2"}}>
                <Bell size={14}/>
                {alerts.length>0&&<span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 font-black text-white" style={{fontSize:8}}>{alerts.length}</span>}
              </button>
              {notif&&alerts.length>0&&(
                <div className="absolute right-0 top-10 z-50 w-72 overflow-hidden rounded-2xl border bg-white shadow-2xl" style={{borderColor:"#e4e8ee"}}>
                  <div className="flex items-center justify-between border-b px-4 py-3" style={{borderColor:"#f0f3f6"}}>
                    <p className="font-bold" style={{fontSize:13,color:"#0d1117"}}>조치 필요 {alerts.length}건</p>
                    <button onClick={()=>setNotif(false)} className="transition-colors hover:text-red-400" style={{color:"#9aa3b2"}}><X size={13}/></button>
                  </div>
                  <div className="max-h-52 divide-y overflow-y-auto" style={{borderColor:"#f5f6f8"}}>
                    {alerts.map((t,i)=>(
                      <div key={i} className="flex items-start gap-3 px-4 py-2.5">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-red-400"/>
                        <p style={{fontSize:12,color:"#0d1117"}}>{t}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="h-5 w-px" style={{background:"#e4e8ee"}}/>

            {/* 사용자 */}
            <div className="flex h-8 items-center gap-2 rounded-xl border bg-[#f8f9fb] px-2.5" style={{borderColor:"#e4e8ee"}}>
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full font-black text-white" style={{background:isAdmin?"#0d7f8a":"#059669",fontSize:10}}>{authUser.initial}</div>
              <div className="hidden sm:block">
                <p className="font-bold" style={{fontSize:12,lineHeight:1.2,color:"#0d1117"}}>{authUser.name}</p>
                {isAdmin&&<p style={{fontSize:9,color:"#d97706"}}>관리자</p>}
              </div>
            </div>

            {/* 로그아웃 */}
            <button
              onClick={()=>setAuthUser(null)}
              className="flex h-8 items-center gap-1.5 rounded-xl border px-3 font-semibold transition-all hover:bg-red-50 hover:border-red-200 hover:text-red-500"
              style={{borderColor:"#e4e8ee",color:"#9aa3b2",fontSize:12}}
              title="로그아웃">
              <LogOut size={13}/>
              <span className="hidden sm:inline">로그아웃</span>
            </button>
          </div>
        </header>

        {/* scrollable content */}
        <main className="flex-1 overflow-y-auto" style={{background:"#f2f4f7", marginLeft: 10}}>
          <div className="mx-auto max-w-[1440px] p-5">
            {/* 대시보드 전용 환영 헤더 */}
            {nav==="dashboard"&&(
              <div
                className="mb-5 flex items-center justify-between overflow-hidden rounded-2xl px-7 py-5"
                style={{
                  background:"linear-gradient(135deg,#0a1628 0%,#0e2242 50%,#0a1f3a 100%)",
                  boxShadow:"0 4px 24px rgba(10,22,40,0.3)",
                  animation:"card-in 0.4s ease both",
                }}
              >
                <div>
                  <p className="font-medium" style={{fontSize:12,color:"rgba(255,255,255,0.45)"}}>
                    {new Date().toLocaleDateString("ko-KR",{year:"numeric",month:"long",day:"numeric",weekday:"long"})}
                  </p>
                  <h2 className="mt-1 font-black" style={{fontSize:24,letterSpacing:"-0.03em",color:"#ffffff"}}>
                    안녕하세요, {authUser.name}님
                  </h2>
                  <p style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginTop:4}}>{authUser.dept} · F.A.C.T ERP 제조통합관리 플랫폼</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="font-semibold" style={{fontSize:12,color:"rgba(255,255,255,0.5)"}}>시스템 정상 가동 중</p>
                    <p style={{fontSize:11,color:"rgba(255,255,255,0.28)",marginTop:2}}>F.A.C.T ERP v2.0</p>
                  </div>
                </div>
              </div>
            )}
            {render()}
          </div>
        </main>
      </div>
    </div>
  );
}
