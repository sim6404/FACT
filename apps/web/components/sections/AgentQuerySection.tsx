"use client";

import { useState, useRef, useEffect } from "react";
import {
  Send, Sparkles, ChevronDown, ChevronUp, Code, FileText,
  BookOpen, Loader2, ThumbsUp, ThumbsDown, Copy, RefreshCw,
  AlertCircle, Database, Search, Zap, Download,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
interface Source { type: "snowflake"|"document"|"tool"; ref: string; desc: string; score?: number; }
interface ChatMessage {
  id: string; role: "user"|"assistant"; content: string;
  route_type?: "structured"|"document"|"mixed"|"report"|"action";
  sql?: string; sources?: Source[]; timestamp: string;
  status?: "loading"|"done"|"error";
}

// ── Presets ────────────────────────────────────────────────────────────────
const PRESETS = [
  { label: "안전재고 미달 품목 + 발주 추천", dept: "구매/자재" },
  { label: "이번 주 OEE 및 비가동 원인 분析", dept: "생산" },
  { label: "4주간 반복 불량 패턴 및 원인 후보", dept: "품질" },
  { label: "경영보고서 초안 생성 (이번 주)", dept: "경영지원" },
  { label: "공급사 납기 준수율 6개월 추이", dept: "구매" },
  { label: "예산 집행률 vs 목표 비교 (분기)", dept: "경영지원" },
];

const ROUTE_META: Record<string, { label: string; color: string }> = {
  structured: { label: "정형 분析", color: "#4a87ff" },
  document:   { label: "문서 검색", color: "#a855f7" },
  mixed:      { label: "혼합 질의", color: "#06b6d4" },
  report:     { label: "보고서",   color: "#10b981" },
  action:     { label: "실행 요청",color: "#f59e0b" },
};

// ── HTML Report Generator ──────────────────────────────────────────────────
function mdToHtmlBody(md: string): string {
  const lines = md.split("\n");
  let out = "";
  let tableBuffer: string[] = [];
  function flushTable() {
    if (!tableBuffer.length) return;
    let tHtml = '<table>\n'; let headerDone = false;
    tableBuffer.forEach(row => {
      const trimmed = row.trim();
      if (/^\|[-:| ]+\|$/.test(trimmed)) return;
      const cells = trimmed.split("|").slice(1,-1).map(c=>c.trim());
      const tag = !headerDone ? "th" : "td"; if (!headerDone) headerDone = true;
      tHtml += `  <tr>${cells.map(c=>`<${tag}>${c}</${tag}>`).join("")}</tr>\n`;
    });
    tHtml += "</table>\n"; out += tHtml; tableBuffer = [];
  }
  for (const line of lines) {
    if (/^\|.+\|$/.test(line.trim())) { tableBuffer.push(line); continue; }
    if (tableBuffer.length) flushTable();
    if (!line.trim()) { out += "<br>\n"; continue; }
    const safe = line.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
    let l = safe
      .replace(/^### (.+)$/,"<h3>$1</h3>").replace(/^## (.+)$/,"<h2>$1</h2>").replace(/^# (.+)$/,"<h1>$1</h1>")
      .replace(/^&gt; (.+)$/,"<blockquote>$1</blockquote>")
      .replace(/^[\-\*] (.+)$/,"<li>$1</li>").replace(/^\d+\. (.+)$/,"<li>$1</li>")
      .replace(/\*\*(.+?)\*\*/g,"<strong>$1</strong>").replace(/\*(.+?)\*/g,"<em>$1</em>").replace(/`(.+?)`/g,"<code>$1</code>");
    if (!l.startsWith("<")) l = `<p>${l}</p>`;
    out += l + "\n";
  }
  if (tableBuffer.length) flushTable();
  return out;
}

function generateReportHTML(content: string, question: string): string {
  const date = new Date().toLocaleDateString("ko-KR",{year:"numeric",month:"long",day:"numeric"});
  const body = mdToHtmlBody(content);
  return `<!DOCTYPE html><html lang="ko"><head><meta charset="UTF-8"><title>F.A.C.T 보고서</title>
<style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Malgun Gothic','Noto Sans KR',sans-serif;max-width:940px;margin:0 auto;padding:48px 36px;color:#1e293b;line-height:1.8}
.rpt-header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:20px;border-bottom:3px solid #0a6b7c;margin-bottom:36px}
.brand{font-size:1.6em;font-weight:800;color:#0a6b7c}
.meta{text-align:right;font-size:.82em;color:#64748b;line-height:1.9}
h1{font-size:1.55em;color:#0f172a;margin:20px 0 12px;font-weight:700}
h2{font-size:1.2em;color:#0a6b7c;margin:28px 0 10px;padding-bottom:7px;border-bottom:1px solid #b2d4d9;font-weight:600}
h3{font-size:1.02em;color:#085a68;margin:18px 0 8px;font-weight:600}
p{margin:8px 0;color:#334155}
table{border-collapse:collapse;width:100%;margin:18px 0;font-size:.88em}
th{background:#e8f5f7;color:#085a68;padding:10px 14px;border:1px solid #b2d4d9;font-weight:600;text-align:left}
td{padding:9px 14px;border:1px solid #e2e8f0;color:#334155}
tr:nth-child(even) td{background:#f8fafc}
blockquote{border-left:4px solid #0a6b7c;margin:18px 0;padding:12px 18px;background:#e8f5f7;color:#085a68;border-radius:0 6px 6px 0;font-size:.92em}
li{margin:5px 0 5px 22px;color:#334155}
code{background:#f1f5f9;padding:2px 7px;border-radius:4px;font-family:monospace;font-size:.9em;color:#0284c7}
strong{color:#0f172a}
.footer{margin-top:56px;padding-top:18px;border-top:1px solid #e2e8f0;font-size:.78em;color:#94a3b8;text-align:center}
</style></head><body>
<div class="rpt-header"><div><div class="brand">F.A.C.T 보고서</div><div style="font-size:.82em;color:#64748b;margin-top:5px">FourD AI Convergence Transformer</div></div>
<div class="meta"><div>생성일: <strong>${date}</strong></div><div>질의: ${question.slice(0,70)}</div></div></div>
${body}
<div class="footer">본 보고서는 F.A.C.T AI 시스템에 의해 자동 생성되었습니다. | 인쇄(PDF): Ctrl+P → PDF로 저장</div>
</body></html>`;
}

function downloadReport(content: string, question: string) {
  const html = generateReportHTML(content, question);
  const blob = new Blob([html], { type:"text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = `FACT_보고서_${new Date().toISOString().slice(0,10)}.html`;
  document.body.appendChild(a); a.click();
  setTimeout(()=>{ document.body.removeChild(a); URL.revokeObjectURL(url); },100);
}

// ── Mock responses ─────────────────────────────────────────────────────────
async function mockAgentQuery(question: string): Promise<Partial<ChatMessage>> {
  await new Promise(r => setTimeout(r, 800));
  const q = question;

  if (q.includes("보고서")||q.includes("초안")||q.includes("생성해줘")||q.includes("만들어줘")||q.includes("작성해줘")) {
    if (q.includes("예산")||q.includes("집행")||q.includes("경영")) {
      return { route_type:"report", content:`## 경영 보고서 초안 — 2026년 ${new Date().getMonth()+1}월 기준

### 1. 핵심 경영 지표 요약

| KPI | 실적 | 목표 | 달성률 | 전월 |
|-----|-----|------|-------|-----|
| 매출액 | ₩142.7억 | ₩150.0억 | 95.1% | 93.4% |
| 영업이익률 | 8.2% | 9.0% | 91.1% | 7.8% |
| OEE | 84.2% | 88.0% | 95.7% | 85.1% |
| 납기 준수율 | 96.3% | 98.0% | 98.3% | 95.9% |
| PPM | 1,240 | 800 | 달성 필요 | 1,380 |

### 2. 예산 집행 현황

| 부서 | 예산 | 집행 | 집행률 | 비고 |
|-----|------|------|-------|-----|
| 생산 | ₩45억 | ₩41.2억 | 91.6% | 정상 |
| 구매/자재 | ₩88억 | ₩79.4억 | 90.2% | 정상 |
| 품질 | ₩8억 | ₩6.1억 | 76.3% | 집행 지연 |
| 영업 | ₩12억 | ₩10.8억 | 90.0% | 정상 |

### 3. 이번 주 주요 이슈

1. M-07 설비 유압 이상 → 긴급 정비 중, 생산 차질 약 2.3h
2. SUS304 원자재 가격 상승 (+4.2%) → 구매팀 대응 방안 검토
3. A사 신규 모델 4월 양산 확정 → 생산계획 업데이트 필요

> 아래 **보고서 다운로드** 버튼으로 HTML 파일을 저장한 뒤 브라우저에서 Ctrl+P → PDF로 저장하세요.`,
        sources:[{type:"snowflake",ref:"MART.mart_exec_kpi_weekly",desc:"경영 KPI 주간 마트",score:1.0},{type:"snowflake",ref:"MART.mart_production_oee_daily",desc:"OEE 일별 마트",score:0.94}] };
    }
    return { route_type:"report", content:`## 보고서 초안 생성 완료\n\n요청하신 **"${q}"** 에 대한 보고서 초안을 생성했습니다.\n\n| 항목 | 값 |\n|-----|---|\n| 분析 기간 | 2026년 누적 |\n| 데이터 신선도 | 오늘 08:00 |\n| 적용 모델 | fact_semantic.yaml |\n\n> 아래 **보고서 다운로드** 버튼으로 HTML 파일을 저장하세요.`,
      sources:[{type:"snowflake",ref:"MART.*",desc:"전사 MART 레이어",score:0.90}] };
  }

  if (q.includes("안전재고")||(q.includes("발주")&&!q.includes("발주해줘"))) {
    return { route_type:"structured", content:`## 안전재고 미달 품목 分析

다음 2주 생산계획 기준으로 **7개 품목**이 안전재고 미달 위험 상태입니다.

| 품목코드 | 품목명 | 현재재고 | 필요량 | 부족량 | 우선순위 |
|---------|-------|---------|-------|-------|---------|
| SUS304-50 | SUS304 Φ50mm | 1,200kg | 2,800kg | **1,600kg** | 긴급 |
| SCM435-30 | SCM435 Φ30mm | 850kg | 1,400kg | **550kg** | 긴급 |
| AL6061-20 | AL6061 Φ20mm | 2,100kg | 2,600kg | **500kg** | 주의 |

### 추천 발주 수량

**SUS304 Φ50mm** 기준 추천 발주량: **2,400kg** (안전재고 20% 버퍼 포함)
- 예상 비용: ₩58,080,000 (단가 ₩24,200/kg 기준)
- 권장 납기: 2026-04-30 이전`,
      sql:`SELECT i.item_code, i.item_name, i.current_stock_kg, pp.required_qty_kg\nFROM FACT_DB.CORE.fact_inventory_snapshot i\nJOIN (\n  SELECT item_code, SUM(qty_kg) AS required_qty_kg\n  FROM FACT_DB.CORE.fact_production_result\n  WHERE planned_date BETWEEN CURRENT_DATE AND DATEADD(day,14,CURRENT_DATE)\n  GROUP BY item_code\n) pp ON i.item_code = pp.item_code\nWHERE i.current_stock_kg < pp.required_qty_kg\nORDER BY (pp.required_qty_kg - i.current_stock_kg) DESC;`,
      sources:[{type:"snowflake",ref:"MART.fact_inventory_snapshot",desc:"재고 스냅샷",score:1.0},{type:"snowflake",ref:"CORE.fact_production_result",desc:"2주 생산계획",score:0.97}] };
  }

  if (q.includes("OEE")||q.includes("비가동")||q.includes("가동률")) {
    return { route_type:"structured", content:`## 이번 주 OEE 分析 (16주차)

현재 전체 OEE **84.2%** — 목표 88% 대비 **△3.8%p 미달**

### 비가동 주요 원인

1. **M-07 유압 이상** (2.3h) — 긴급 수리 중
2. **M-03 금형 교환** (1.8h) — 정기 작업
3. **M-12 원자재 대기** (1.2h) — 입고 지연

| 항목 | 이번 주 | 전주 | 목표 |
|-----|--------|-----|-----|
| 가동률 | 91.4% | 93.2% | 95% |
| 성능률 | 94.8% | 95.1% | 97% |
| 양품률 | 97.3% | 97.0% | 98% |
| **OEE** | **84.2%** | **85.6%** | **88%** |`,
      sources:[{type:"snowflake",ref:"MART.mart_production_oee_daily",desc:"OEE 일별 마트",score:1.0}] };
  }

  if (q.includes("불량")||q.includes("PPM")||q.includes("품질")) {
    return { route_type:"structured", content:`## 4주간 반복 불량 패턴 分析

| 불량 유형 | W13 | W14 | W15 | W16 | 합계 | 추세 |
|---------|-----|-----|-----|-----|-----|-----|
| 치수 불량 | 42 | 38 | 51 | 44 | 175 | 반복 |
| 표면 결함 | 18 | 22 | 19 | 25 | 84 | 증가 |
| 경도 미달 | 8 | 6 | 11 | 9 | 34 | 산발 |

### 원인 후보 (95% 신뢰도)

1. **M-03 CNC 공구 마모** — 교체 주기 초과 (2.3배)
2. **SUS304 로트 편차** — B공급사 경도 편차 +8%
3. **야간 3조 작업자 세팅 오류** — 불량 68% 집중

> 시정 조치: M-03 공구 즉시 교체 권고`,
      sql:`SELECT defect_type, week_num, COUNT(*) AS cnt\nFROM FACT_DB.CORE.fact_quality_defect\nWHERE defect_date >= DATEADD(week,-4,CURRENT_DATE)\nGROUP BY defect_type, week_num ORDER BY week_num, cnt DESC;`,
      sources:[{type:"snowflake",ref:"CORE.fact_quality_defect",desc:"불량 이력",score:1.0},{type:"document",ref:"QC-2026-031",desc:"품질 시정조치 보고서",score:0.82}] };
  }

  if (q.includes("납기")||q.includes("공급사")||q.includes("준수율")) {
    return { route_type:"structured", content:`## 공급사 납기 준수율 — 최근 6개월 추이

| 월 | 준수율 | 지연 건수 | 평균 지연일 |
|----|-------|---------|-----------|
| 2025-11 | 97.8% | 4건 | 1.2일 |
| 2025-12 | 96.9% | 6건 | 1.8일 |
| 2026-01 | 95.4% | 9건 | 2.1일 |
| 2026-02 | 94.1% | 12건 | 2.4일 |
| 2026-03 | 95.8% | 8건 | 1.9일 |
| 2026-04 | **96.3%** | 7건 | 1.6일 |

### 하위 공급사 현황

| 공급사 | 준수율 | 리스크 |
|-------|-------|-------|
| B공급사 (SUS) | 88.2% | 높음 |
| D공급사 (AL) | 91.4% | 중간 |`,
      sources:[{type:"snowflake",ref:"CORE.fact_purchase_order",desc:"구매 발주 이력",score:1.0}] };
  }

  if (q.includes("예산")||q.includes("집행률")) {
    return { route_type:"structured", content:`## 예산 집행률 vs 목표 비교 (2026년 Q1)

| 부서 | 연간 예산 | Q1 집행 | 집행률 | 목표 |
|-----|---------|---------|-------|------|
| 생산 | ₩180억 | ₩41.2억 | 22.9% | 25% |
| 구매/자재 | ₩352억 | ₩79.4억 | 22.6% | 25% |
| 품질 | ₩32억 | ₩6.1억 | 19.1% | 25% |
| 영업 | ₩48억 | ₩10.8억 | 22.5% | 25% |
| **전사** | **₩612억** | **₩137.5억** | **22.5%** | **25%** |

> 전사 Q2 목표: 50% — 현재 페이스 유지 시 48.9% 예상`,
      sources:[{type:"snowflake",ref:"MART.mart_exec_kpi_weekly",desc:"경영 KPI 마트",score:1.0}] };
  }

  return { route_type:"mixed", content:`## 分析 결과\n\n**질의**: ${q}\n\n| 구분 | 상태 |\n|-----|------|\n| 데이터 소스 | FACT_DB (Snowflake) |\n| 조회 시각 | ${new Date().toLocaleString("ko-KR")} |\n\n추천 질의:\n- "이번 주 OEE 및 비가동 원인 분析"\n- "안전재고 미달 품목 + 발주 추천"\n- "경영보고서 초안 생성 (이번 주)"`,
    sources:[{type:"snowflake",ref:"CORE.*",desc:"CORE 레이어 종합",score:0.75}] };
}

function nowTime() { return new Date().toLocaleTimeString("ko-KR",{hour:"2-digit",minute:"2-digit"}); }

// ── Simple Markdown renderer (no external deps) ────────────────────────────
function MarkdownContent({ md }: { md: string }) {
  const html = mdToHtmlBody(md);
  return (
    <div
      className="prose-fact"
      style={{ fontSize: 13, lineHeight: 1.8, color: "#e2e8f0" }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

// ── Main Component ─────────────────────────────────────────────────────────
export default function AgentQuerySection() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sqlOpen, setSqlOpen] = useState<Record<string, boolean>>({});
  const [srcOpen, setSrcOpen] = useState<Record<string, boolean>>({});
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:"smooth" }); }, [messages]);

  const handleSend = async (question: string = input.trim()) => {
    const q = question.trim();
    if (!q || loading) return;
    setInput(""); setLoading(true);
    const ts = Date.now(); const aiId = `ai_${ts}`;
    setMessages(prev => [...prev,
      { id:`u_${ts}`, role:"user", content:q, timestamp:nowTime(), status:"done" },
      { id:aiId, role:"assistant", content:"", status:"loading", timestamp:nowTime() },
    ]);
    try {
      const timeout = new Promise<Partial<ChatMessage>>(resolve =>
        setTimeout(()=>resolve({route_type:"mixed",content:"응답 시간이 초과되었습니다.",status:"error"}),6000));
      const result = await Promise.race([mockAgentQuery(q), timeout]);
      setMessages(prev => prev.map(m => m.id===aiId ? {...m,...result,status:(result.status as ChatMessage["status"])??"done"} : m));
    } catch {
      setMessages(prev => prev.map(m => m.id===aiId ? {...m,content:"오류가 발생했습니다.",status:"error"} : m));
    } finally { setLoading(false); }
  };

  const S = {
    wrap: { display:"flex" as const, flexDirection:"column" as const, height:"calc(100vh - 128px)", background:"#0f172a", borderRadius:16, overflow:"hidden" as const, border:"1px solid #1e293b" },
    header: { padding:"16px 20px", borderBottom:"1px solid #1e293b", display:"flex", alignItems:"center", justifyContent:"space-between" },
    title: { color:"#f1f5f9", fontWeight:700, fontSize:16, display:"flex", alignItems:"center", gap:8 },
    badge: { display:"flex", alignItems:"center", gap:6, fontSize:11, color:"#10b981" },
    dot: { width:6, height:6, borderRadius:"50%", background:"#10b981" },
    msgs: { flex:1, overflowY:"auto" as const, padding:"16px 20px", display:"flex", flexDirection:"column" as const, gap:16 },
    empty: { flex:1, display:"flex", flexDirection:"column" as const, alignItems:"center", justifyContent:"center", gap:24, padding:24 },
    emptyIcon: { width:64, height:64, borderRadius:16, background:"linear-gradient(135deg,#0a6b7c,#0ea5e9)", display:"flex", alignItems:"center", justifyContent:"center", marginBottom:8 },
    emptyTitle: { color:"#f1f5f9", fontSize:18, fontWeight:600, textAlign:"center" as const },
    emptySubtitle: { color:"#64748b", fontSize:13, marginTop:4, textAlign:"center" as const },
    presetGrid: { display:"grid", gridTemplateColumns:"1fr 1fr", gap:8, width:"100%", maxWidth:640 },
    preset: { display:"flex", alignItems:"flex-start", gap:10, padding:"12px 14px", borderRadius:12, border:"1px solid #1e293b", background:"#0d1526", cursor:"pointer", textAlign:"left" as const, transition:"all 0.15s" },
    userBubble: { display:"flex", justifyContent:"flex-end" },
    userContent: { maxWidth:512, background:"rgba(10,107,124,0.2)", border:"1px solid rgba(10,107,124,0.3)", borderRadius:"16px 4px 16px 16px", padding:"10px 14px" },
    aiBubble: { display:"flex", gap:12 },
    aiAvatar: { width:28, height:28, borderRadius:"50%", background:"linear-gradient(135deg,#0a6b7c,#0ea5e9)", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, marginTop:4 },
    aiCard: { flex:1, background:"#0d1526", border:"1px solid #1e293b", borderRadius:12, padding:"14px 16px" },
    loadingDot: { width:6, height:6, borderRadius:"50%", background:"#4a87ff", display:"inline-block" },
    input: { padding:"12px 20px", borderTop:"1px solid #1e293b", display:"flex", gap:12 },
    textarea: { flex:1, background:"#0d1526", border:"1px solid #1e293b", borderRadius:10, padding:"10px 14px 10px 14px", color:"#e2e8f0", fontSize:13, resize:"none" as const, outline:"none", fontFamily:"inherit", lineHeight:1.6 },
    sendBtn: { width:44, height:44, borderRadius:10, background:"#0a6b7c", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", flexShrink:0 },
    sendBtnDisabled: { opacity:0.4, cursor:"not-allowed" },
  };

  return (
    <div style={S.wrap}>
      {/* Header */}
      <div style={S.header}>
        <div style={S.title}>
          <Sparkles size={16} color="#0ea5e9" />
          AI 질의
          <span style={{fontSize:11,color:"#64748b",fontWeight:400}}>Cortex Analyst · Cortex Search · 부서별 에이전트</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <div style={S.badge}><div style={S.dot}/> F.A.C.T AI 준비됨</div>
          {messages.length > 0 && (
            <button onClick={()=>setMessages([])} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#64748b",background:"none",border:"none",cursor:"pointer",padding:"4px 8px",borderRadius:6}}>
              <RefreshCw size={11}/> 초기화
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div style={S.msgs}>
        {messages.length === 0 && (
          <div style={S.empty}>
            <div style={{textAlign:"center"}}>
              <div style={S.emptyIcon}><Sparkles size={28} color="#fff"/></div>
              <div style={S.emptyTitle}>F.A.C.T AI에게 물어보세요</div>
              <div style={S.emptySubtitle}>ERP, MES, 품질, 문서까지 자연어로 分析합니다</div>
            </div>
            <div style={S.presetGrid}>
              {PRESETS.map((p,i) => (
                <button key={i} onClick={()=>handleSend(p.label)} style={S.preset}>
                  <Sparkles size={14} color="#0ea5e9" style={{marginTop:2,flexShrink:0}}/>
                  <div>
                    <div style={{fontSize:12,color:"#cbd5e1"}}>{p.label}</div>
                    <div style={{fontSize:10,color:"#475569",marginTop:2}}>{p.dept}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => {
          if (msg.role === "user") return (
            <div key={msg.id} style={S.userBubble}>
              <div style={S.userContent}>
                <div style={{fontSize:13,color:"#e2e8f0"}}>{msg.content}</div>
                <div style={{fontSize:10,color:"#64748b",marginTop:4,textAlign:"right"}}>{msg.timestamp}</div>
              </div>
            </div>
          );

          if (msg.status === "loading") return (
            <div key={msg.id} style={S.aiBubble}>
              <div style={S.aiAvatar}><Sparkles size={12} color="#fff"/></div>
              <div style={S.aiCard}>
                <div style={{display:"flex",alignItems:"center",gap:8,fontSize:12,color:"#64748b"}}>
                  <Loader2 size={13} color="#0ea5e9" style={{animation:"spin 1s linear infinite"}}/>
                  Router Agent 분析 중
                  {[0,1,2].map(i=>(
                    <span key={i} style={{...S.loadingDot,animationDelay:`${i*0.15}s`,animation:"bounce 0.6s infinite"}}/>
                  ))}
                </div>
              </div>
            </div>
          );

          const route = msg.route_type ? ROUTE_META[msg.route_type] : null;
          const isReport = msg.route_type === "report";

          return (
            <div key={msg.id} style={S.aiBubble}>
              <div style={S.aiAvatar}><Sparkles size={12} color="#fff"/></div>
              <div style={{flex:1,display:"flex",flexDirection:"column",gap:10}}>
                {route && (
                  <div style={{display:"flex",alignItems:"center",gap:6}}>
                    {msg.route_type==="structured"&&<Database size={12} color={route.color}/>}
                    {msg.route_type==="document"&&<Search size={12} color={route.color}/>}
                    {msg.route_type==="mixed"&&<Zap size={12} color={route.color}/>}
                    {msg.route_type==="report"&&<FileText size={12} color={route.color}/>}
                    {msg.route_type==="action"&&<AlertCircle size={12} color={route.color}/>}
                    <span style={{fontSize:11,fontWeight:500,color:route.color}}>{route.label}</span>
                    <span style={{fontSize:10,color:"#475569"}}>{msg.timestamp}</span>
                  </div>
                )}

                <div style={S.aiCard}>
                  <MarkdownContent md={msg.content}/>
                </div>

                {/* Report download */}
                {isReport && msg.status==="done" && msg.content && (
                  <button
                    onClick={()=>downloadReport(msg.content, msg.content.split("\n")[0].replace(/^#+\s*/,"").trim()||"F.A.C.T 분析 보고서")}
                    style={{display:"flex",alignItems:"center",gap:8,padding:"8px 16px",borderRadius:8,background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.3)",color:"#10b981",cursor:"pointer",fontSize:12,fontWeight:500}}
                  >
                    <Download size={13}/>
                    보고서 다운로드 (HTML → 브라우저에서 PDF 저장)
                  </button>
                )}

                {/* SQL */}
                {msg.sql && (
                  <div>
                    <button onClick={()=>setSqlOpen(p=>({...p,[msg.id]:!p[msg.id]}))} style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:"#475569",background:"none",border:"none",cursor:"pointer",padding:0}}>
                      <Code size={11}/> 생성된 SQL 보기 {sqlOpen[msg.id]?<ChevronUp size={10}/>:<ChevronDown size={10}/>}
                    </button>
                    {sqlOpen[msg.id] && (
                      <div style={{marginTop:6,position:"relative"}}>
                        <pre style={{background:"#050d1a",border:"1px solid #1e293b",borderRadius:8,padding:"12px 14px",fontSize:11,fontFamily:"'Consolas','D2Coding',monospace",color:"#94a3b8",overflow:"auto",lineHeight:1.7}}>{msg.sql}</pre>
                        <button onClick={()=>navigator.clipboard.writeText(msg.sql!)} style={{position:"absolute",top:8,right:8,padding:4,background:"#1e293b",border:"none",borderRadius:4,cursor:"pointer",color:"#64748b"}}>
                          <Copy size={11} color="#94a3b8"/>
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Sources */}
                {msg.sources && msg.sources.length > 0 && (
                  <div>
                    <button onClick={()=>setSrcOpen(p=>({...p,[msg.id]:!p[msg.id]}))} style={{display:"flex",alignItems:"center",gap:6,fontSize:11,color:"#475569",background:"none",border:"none",cursor:"pointer",padding:0}}>
                      <BookOpen size={11}/> 참조 출처 {msg.sources.length}건 {srcOpen[msg.id]?<ChevronUp size={10}/>:<ChevronDown size={10}/>}
                    </button>
                    {srcOpen[msg.id] && (
                      <div style={{marginTop:6,display:"flex",flexDirection:"column",gap:4}}>
                        {msg.sources.map((s,i)=>(
                          <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:8,background:"#050d1a",border:"1px solid #1e293b"}}>
                            <Database size={12} color="#06b6d4"/>
                            <div style={{flex:1}}>
                              <div style={{fontSize:11,fontFamily:"monospace",color:"#94a3b8"}}>{s.ref}</div>
                              <div style={{fontSize:10,color:"#475569"}}>{s.desc}</div>
                            </div>
                            {s.score&&<span style={{fontSize:10,color:"#334155"}}>{(s.score*100).toFixed(0)}%</span>}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Feedback */}
                {msg.status==="done" && (
                  <div style={{display:"flex",gap:12}}>
                    <button style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#475569",background:"none",border:"none",cursor:"pointer"}}><ThumbsUp size={11}/> 도움됨</button>
                    <button style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#475569",background:"none",border:"none",cursor:"pointer"}}><ThumbsDown size={11}/> 부정확</button>
                    <button onClick={()=>handleSend(messages.find(m=>m.id===msg.id.replace("ai_","u_"))?.content||"")} style={{display:"flex",alignItems:"center",gap:4,fontSize:11,color:"#475569",background:"none",border:"none",cursor:"pointer"}}><RefreshCw size={11}/> 재생성</button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef}/>
      </div>

      {/* Input */}
      <div style={S.input}>
        <textarea
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>{ if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();handleSend();} }}
          placeholder="자연어로 질문하세요. (예: 이번 주 OEE가 낮은 원인은?)"
          rows={2}
          style={S.textarea}
        />
        <button
          onClick={()=>handleSend()}
          disabled={!input.trim()||loading}
          style={{...S.sendBtn,...(!input.trim()||loading?S.sendBtnDisabled:{})}}
        >
          {loading ? <Loader2 size={16} style={{animation:"spin 1s linear infinite"}}/> : <Send size={16}/>}
        </button>
      </div>

      <style>{`
        .prose-fact h1{color:#f1f5f9;font-size:1.2em;font-weight:700;margin:12px 0 8px}
        .prose-fact h2{color:#cbd5e1;font-size:1.05em;font-weight:600;margin:16px 0 8px;padding-bottom:6px;border-bottom:1px solid #1e293b}
        .prose-fact h3{color:#94a3b8;font-size:.95em;font-weight:600;margin:12px 0 6px}
        .prose-fact p{margin:6px 0;color:#94a3b8}
        .prose-fact strong{color:#e2e8f0;font-weight:600}
        .prose-fact table{border-collapse:collapse;width:100%;margin:10px 0;font-size:.85em}
        .prose-fact th{background:#050d1a;color:#94a3b8;padding:7px 12px;border:1px solid #1e293b;font-weight:600;text-align:left}
        .prose-fact td{padding:6px 12px;border:1px solid #1e293b;color:#64748b}
        .prose-fact tr:nth-child(even) td{background:#080f1e}
        .prose-fact li{margin:4px 0 4px 18px;color:#94a3b8;list-style:disc}
        .prose-fact blockquote{border-left:3px solid #0a6b7c;margin:10px 0;padding:8px 14px;background:#050d1a;color:#64748b;border-radius:0 6px 6px 0;font-size:.9em}
        .prose-fact code{background:#050d1a;padding:1px 5px;border-radius:3px;font-family:monospace;font-size:.88em;color:#06b6d4}
        @keyframes spin{to{transform:rotate(360deg)}}
        @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
      `}</style>
    </div>
  );
}
