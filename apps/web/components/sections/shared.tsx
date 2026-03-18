"use client";
// ─── 영동테크 ERP 공유 UI 컴포넌트 ───────────────────────────────────────────
// app-shell.tsx 의 디자인 시스템과 동일한 팔레트 사용

import { useState, useRef } from "react";
import { X, Search, AlertTriangle, Save, ChevronDown, ChevronUp, ArrowLeft, ChevronRight as ChevRight, Upload, Download, Printer, FileSpreadsheet } from "lucide-react";
import { exportToExcel, importFromExcel, printContent, downloadTemplate, type ExcelRow, type ExportOptions } from "@/lib/excelUtils";

// ── 배지 색상 맵 (박스 배경과 조화) ─────────────────────────────────────────────
export const BC: Record<string, string> = {
  blue:   "bg-sky-50     text-sky-700",
  green:  "bg-emerald-50 text-emerald-700",
  amber:  "bg-amber-50   text-amber-700",
  red:    "bg-red-50     text-red-600",
  gray:   "bg-slate-100  text-slate-600",
  sky:    "bg-sky-50     text-sky-600",
  purple: "bg-violet-50  text-violet-600",
};

// ── 공통 유틸 ─────────────────────────────────────────────────────────────────
export const fd   = (s: string) => String(s).slice(0, 10);
export const fc   = (n: number) => n.toLocaleString("ko-KR");
export const fw   = (n: number) => `₩${fc(n)}`;
export const fp   = (a: number, b: number) => b ? Math.min(100, Math.round(a / b * 100)) : 0;
export const uid  = () => Math.random().toString(36).slice(2, 10);
export const fmt10 = (n: number) => (n >= 0 ? "+" : "") + fc(n);
export const pctFmt = (a: number, b: number) => b ? (a / b * 100).toFixed(1) + "%" : "—";

// ── 배지 ─────────────────────────────────────────────────────────────────────
export function Badge({ l, c }: { l: string; c: string }) {
  return (
    <span className={`inline-flex h-5 items-center rounded-md px-2 font-medium ${BC[c] ?? BC.gray}`}
      style={{ fontSize: 11 }}>{l}</span>
  );
}

// ── 모달 ─────────────────────────────────────────────────────────────────────
export function Modal({
  title, onClose, children, wide = false, xl = false,
}: {
  title: string; onClose: () => void; children: React.ReactNode; wide?: boolean; xl?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className={`flex flex-col w-full rounded-2xl bg-white shadow-xl border border-slate-200/80 ${xl ? "max-w-4xl" : wide ? "max-w-2xl" : "max-w-lg"}`}>
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50/80 rounded-t-2xl">
          <span className="font-semibold text-slate-800" style={{ fontSize: 15 }}>{title}</span>
          <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-200/60 hover:text-slate-700 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4" style={{ maxHeight: "85vh" }}>{children}</div>
      </div>
    </div>
  );
}

// ── 폼 필드 ──────────────────────────────────────────────────────────────────
export function Fld({ label, req, children }: { label: string; req?: boolean; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="font-medium text-slate-600" style={{ fontSize: 12 }}>
        {label}{req && <span className="ml-0.5 text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

export function Inp(p: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input {...p}
      className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 text-[13px] text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[var(--primary)] focus:bg-white focus:ring-2 focus:ring-[var(--primary-soft)]" />
  );
}

export function Textarea(p: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea {...p}
      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-[11px] text-[#1e2247] outline-none transition placeholder:text-slate-400 focus:border-[#5c6bc0] focus:bg-white resize-none" />
  );
}

export function Sl({ v, set, opts }: { v: string; set: (x: string) => void; opts: { value: string; label: string }[] }) {
  return (
    <select value={v} onChange={e => set(e.target.value)}
      className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50/80 px-3 text-[13px] text-slate-800 outline-none transition focus:border-[var(--primary)] focus:bg-white">
      {opts.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

// ── 버튼 ─────────────────────────────────────────────────────────────────────
export function Btn({
  onClick, v = "primary", disabled, children, icon, xs,
}: {
  onClick?: () => void; v?: "primary" | "secondary" | "ghost" | "danger" | "success";
  disabled?: boolean; children: React.ReactNode; icon?: React.ReactNode; xs?: boolean;
}) {
  const cls: Record<string, string> = {
    primary:   "bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] shadow-sm hover:shadow",
    secondary: "bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm",
    ghost:     "text-slate-600 hover:bg-slate-100",
    danger:    "bg-red-500 text-white hover:bg-red-600 shadow-sm",
    success:   "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm",
  };
  return (
    <button onClick={onClick} disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-lg font-semibold transition-all disabled:opacity-50 ${cls[v]} ${xs ? "h-7 px-2.5" : "h-9 px-4"}`}
      style={{ fontSize: xs ? 11 : 13 }}>
      {icon}{children}
    </button>
  );
}

// ── 페이지 헤더 ───────────────────────────────────────────────────────────────
export function PgHdr({
  title, sub, actions,
}: { title: string; sub?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="font-bold text-slate-800" style={{ fontSize: 22, letterSpacing: "-0.02em" }}>{title}</h1>
        {sub && <p className="mt-1.5 text-slate-500" style={{ fontSize: 13 }}>{sub}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}

// ── 탭 ───────────────────────────────────────────────────────────────────────
export function Tabs({ tabs, active, set }: {
  tabs: { key: string; label: string; n?: number }[];
  active: string;
  set: (k: string) => void;
}) {
  return (
    <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-200 pb-3">
      {tabs.map(t => (
        <button key={t.key} onClick={() => set(t.key)}
          className={`flex h-8 items-center gap-1.5 rounded-lg px-4 font-medium transition-all ${active === t.key
            ? "bg-[var(--primary)] text-white shadow-sm"
            : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-slate-800"
          }`} style={{ fontSize: 13 }}>
          {t.label}
          {t.n !== undefined && (
            <span className={`rounded px-1.5 font-semibold ${active === t.key ? "text-white/80" : "text-slate-400"}`} style={{ fontSize: 11 }}>{t.n}</span>
          )}
        </button>
      ))}
    </div>
  );
}

// ── 검색창 ───────────────────────────────────────────────────────────────────
export function Srch({ v, set, ph }: { v: string; set: (s: string) => void; ph: string }) {
  return (
    <div className="mb-3 flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 shadow-sm transition focus-within:border-[var(--primary)] focus-within:ring-2 focus-within:ring-[var(--primary-soft)]">
      <Search size={14} className="shrink-0 text-slate-400" />
      <input className="flex-1 bg-transparent text-[13px] text-slate-800 outline-none placeholder:text-slate-400"
        placeholder={ph} value={v} onChange={e => set(e.target.value)} />
    </div>
  );
}

// ── 데이터 테이블 ─────────────────────────────────────────────────────────────
export function Tbl({ cols, children }: { cols: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/90">
              {cols.map(c => (
                <th key={c}
                  className={`whitespace-nowrap px-4 py-3.5 text-left font-semibold tracking-wide text-slate-600 ${c.includes("↓") ? "text-right" : ""}`}
                  style={{ fontSize: 12 }}>
                  {c.replace("↓", "")}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">{children}</tbody>
        </table>
      </div>
    </div>
  );
}

export function TR({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <tr onClick={onClick}
      className={`transition-colors text-[13px] ${onClick ? "cursor-pointer hover:bg-sky-50/40" : "hover:bg-slate-50/60"}`}>
      {children}
    </tr>
  );
}

export function TD({
  children, r, muted, mono, bold, warn, cls = "",
}: {
  children: React.ReactNode; r?: boolean; muted?: boolean;
  mono?: boolean; bold?: boolean; warn?: boolean; cls?: string;
}) {
  return (
    <td className={`px-4 py-2.5 ${r ? "text-right" : ""} ${muted ? "text-slate-500" : ""} ${mono ? "font-mono text-[11px]" : ""} ${bold ? "font-semibold text-slate-800" : ""} ${warn ? "font-semibold text-red-600" : ""} ${cls}`}>
      {children}
    </td>
  );
}

export function NoRow({ n, msg = "데이터가 없습니다" }: { n: number; msg?: string }) {
  return <tr><td colSpan={n} className="py-12 text-center text-slate-500" style={{ fontSize: 13 }}>{msg}</td></tr>;
}

// ── 진행 막대 ─────────────────────────────────────────────────────────────────
export function PBar({ a, b, c = "indigo" }: { a: number; b: number; c?: string }) {
  const r = fp(a, b);
  const fill: Record<string, string> = {
    indigo: "bg-[#5c6bc0]", green: "bg-emerald-500", amber: "bg-amber-400", red: "bg-red-400",
  };
  return (
    <div className="flex items-center gap-2">
      <div className="h-1 w-14 overflow-hidden rounded-full bg-[#eef1f8]">
        <div className={`h-full rounded-full ${fill[c] ?? fill.indigo}`} style={{ width: `${r}%` }} />
      </div>
      <span className="w-8 text-right tabular-nums text-slate-400" style={{ fontSize: 10 }}>{r}%</span>
    </div>
  );
}

// ── KPI 요약 카드 ─────────────────────────────────────────────────────────────
export function StatC({
  label, value, unit, warn, sub,
}: { label: string; value: string | number; unit?: string; warn?: boolean; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm text-center transition-shadow hover:shadow-md" style={{margin:8}}>
      <p className="text-slate-500 font-medium" style={{ fontSize: 12 }}>{label}</p>
      <p className={`mt-2 font-bold leading-none tabular-nums ${warn ? "text-amber-600" : "text-slate-800"}`}
        style={{ fontSize: 22, letterSpacing: "-0.02em" }}>
        {value}
        {unit && <span className="ml-1 font-medium text-slate-400" style={{ fontSize: 12 }}>{unit}</span>}
      </p>
      {sub && <p className="mt-2 text-slate-500" style={{ fontSize: 11 }}>{sub}</p>}
    </div>
  );
}

// ── 알림 배너 ─────────────────────────────────────────────────────────────────
export function AlertBanner({ msg }: { msg: string }) {
  return (
    <div className="mb-4 flex items-start gap-3 rounded-xl border border-amber-200/80 bg-amber-50/90 px-4 py-3.5">
      <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-600" />
      <p className="font-medium text-amber-800" style={{ fontSize: 13 }}>{msg}</p>
    </div>
  );
}

// ── 섹션 카드 (접이식) ────────────────────────────────────────────────────────
export function SectionCard({
  title, children, defaultOpen = true,
}: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-sm" style={{margin:8}}>
      <button
        className="flex w-full items-center justify-between px-5 py-4 transition-colors hover:bg-slate-50/80 rounded-t-xl"
        onClick={() => setOpen(o => !o)}>
        <span className="font-semibold text-slate-800" style={{ fontSize: 14 }}>{title}</span>
        {open ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
      </button>
      {open && <div className="border-t border-slate-100 p-5">{children}</div>}
    </div>
  );
}

// ── 저장 버튼 영역 ────────────────────────────────────────────────────────────
export function SaveBar({ onSave, onClose, saving }: { onSave: () => void; onClose: () => void; saving?: boolean }) {
  return (
    <div className="mt-5 flex justify-end gap-1.5">
      <Btn v="secondary" onClick={onClose}>취소</Btn>
      <Btn v="primary" onClick={onSave} disabled={saving} icon={<Save size={12} />}>
        {saving ? "저장중…" : "저장"}
      </Btn>
    </div>
  );
}

// ── 주차 선택 ─────────────────────────────────────────────────────────────────
export function getWeekLabel(year: number, week: number) {
  return `${year}년 ${week}주차`;
}

export function currentWeek() {
  const now = new Date();
  const startOfYear = new Date(now.getFullYear(), 0, 1);
  const week = Math.ceil(((now.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7);
  return { year: now.getFullYear(), week };
}

// ── 풀스크린 페이지 모달 ─────────────────────────────────────────────────────
// 사이드바(196px) + 탑바(52px) 아래 콘텐츠 영역을 완전히 덮는 오버레이
export function PageModal({
  title, section, onClose, actions, children,
}: {
  title: string;
  section?: string;
  onClose: () => void;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed z-40 flex flex-col overflow-hidden"
      style={{ top: 52, left: 220, right: 0, bottom: 0, background: "var(--bg)" }}
    >
      {/* 페이지 헤더 */}
      <div
        className="flex h-[52px] shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
      >
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 transition-colors hover:bg-slate-100 text-slate-600 hover:text-slate-800"
            style={{ fontSize: 12 }}
          >
            <ArrowLeft size={14} />
            {section && <span className="font-medium">{section}</span>}
          </button>
          <ChevRight size={12} className="text-slate-300" />
          <span className="font-semibold text-slate-800" style={{ fontSize: 14 }}>{title}</span>
        </div>
        <div className="flex items-center gap-2">
          {actions}
          <div className="mx-1 h-4 w-px bg-slate-200" />
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* 스크롤 가능한 콘텐츠 */}
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1600px] p-6">
          {children}
        </div>
      </div>
    </div>
  );
}

// ── 섹션 랜딩 페이지 카드 그리드 ──────────────────────────────────────────────
export interface LandingCardDef {
  key: string;
  label: string;
  desc: string;
  Icon: React.ComponentType<{ size: number; className?: string }>;
  count?: number;
  alert?: number;
  color?: string;
  extra?: string;
}

export function SectionLanding({
  title, sub, cards, onOpen,
}: {
  title: string;
  sub: string;
  cards: LandingCardDef[];
  onOpen: (key: string) => void;
}) {
  return (
    <div>
      <div className="mb-7">
        <h1 className="font-bold text-slate-800" style={{ fontSize: 22, letterSpacing: "-0.02em" }}>{title}</h1>
        <p className="mt-2 text-slate-500" style={{ fontSize: 14 }}>{sub}</p>
      </div>
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
        {cards.map(c => {
          const CIcon = c.Icon;
          const color = c.color ?? "var(--primary)";
          return (
            <button
              key={c.key}
              onClick={() => onOpen(c.key)}
              className="group relative flex flex-col items-center rounded-xl border border-slate-200 bg-white p-6 text-center shadow-sm transition-all hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20"
            >
              {/* 알림 뱃지 */}
              {c.alert != null && c.alert > 0 && (
                <span
                  className="absolute right-3 top-3 flex items-center rounded-full bg-red-50 px-2 py-0.5 font-bold text-red-500"
                  style={{ fontSize: 10 }}
                >
                  {c.alert}건
                </span>
              )}

              {/* 아이콘 — 중앙 */}
              <div
                className="flex h-14 w-14 items-center justify-center rounded-xl transition-colors"
                style={{ background: c.color ? `${c.color}15` : "var(--primary-soft)", color: c.color ?? "var(--primary)" }}
              >
                <CIcon size={26} />
              </div>

              {/* 제목 + 설명 — 중앙 */}
              <div className="mt-4 flex-1">
                <p
                  className="font-semibold text-slate-800 transition-colors group-hover:text-[var(--primary)]"
                  style={{ fontSize: 15 }}
                >
                  {c.label}
                </p>
                <p className="mt-2 leading-relaxed text-slate-500" style={{ fontSize: 13 }}>
                  {c.desc}
                </p>
              </div>

              {/* 하단 메타 + 열기 — 중앙 */}
              <div className="mt-4 flex w-full items-center justify-center gap-3 border-t border-slate-100 pt-3">
                {c.count != null && (
                  <span className="tabular-nums text-slate-400" style={{ fontSize: 12 }}>
                    {c.count}건
                  </span>
                )}
                {c.extra && (
                  <span className="text-slate-400" style={{ fontSize: 12 }}>{c.extra}</span>
                )}
                <span
                  className="flex items-center gap-1 font-semibold transition-all group-hover:gap-1.5"
                  style={{ color: c.color ?? "var(--primary)", fontSize: 13 }}
                >
                  열기 <ChevRight size={13} />
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── 엑셀 내보내기 버튼 ────────────────────────────────────────────────────────
export function ExcelExportBtn({
  data, options, disabled,
}: {
  data: ExcelRow[];
  options: ExportOptions;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={() => exportToExcel(data, options)}
      disabled={disabled || !data.length}
      title="엑셀로 내보내기"
      className="flex h-7 items-center gap-1.5 rounded-lg border border-[#e8eaf0] bg-white px-2.5 font-medium text-slate-500 transition-all hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-40"
      style={{ fontSize: 11 }}
    >
      <FileSpreadsheet size={12} />
      엑셀 내보내기
    </button>
  );
}

// ── 엑셀 불러오기 버튼 ────────────────────────────────────────────────────────
export function ExcelImportBtn({
  onImport, templateHeaders, templateFilename,
}: {
  onImport: (rows: ExcelRow[]) => void;
  templateHeaders?: string[];
  templateFilename?: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    const result = await importFromExcel(file);
    setLoading(false);
    if (result.error) {
      alert(result.error);
    } else if (result.rows.length === 0) {
      alert("데이터가 없습니다. 파일을 확인해주세요.");
    } else {
      onImport(result.rows);
      alert(`${result.total}건이 성공적으로 불러와졌습니다.`);
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="flex items-center gap-1">
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={handleFile}
      />
      <button
        onClick={() => fileRef.current?.click()}
        disabled={loading}
        title="엑셀 파일 불러오기"
        className="flex h-7 items-center gap-1.5 rounded-lg border border-[#e8eaf0] bg-white px-2.5 font-medium text-slate-500 transition-all hover:border-[#5c6bc0] hover:bg-[#eef1f8] hover:text-[#5c6bc0] disabled:opacity-40"
        style={{ fontSize: 11 }}
      >
        <Upload size={12} />
        {loading ? "불러오는 중..." : "엑셀 불러오기"}
      </button>
      {templateHeaders && templateFilename && (
        <button
          onClick={() => downloadTemplate(templateHeaders, templateFilename)}
          title="입력 양식 템플릿 다운로드"
          className="flex h-7 items-center gap-1.5 rounded-lg border border-[#e8eaf0] bg-white px-2.5 font-medium text-slate-400 transition-all hover:border-slate-300 hover:text-slate-600"
          style={{ fontSize: 10 }}
        >
          <Download size={11} />
          양식
        </button>
      )}
    </div>
  );
}

// ── 인쇄 버튼 ────────────────────────────────────────────────────────────────
export function PrintBtn({ title, printId }: { title: string; printId?: string }) {
  return (
    <button
      onClick={() => printContent(title, printId)}
      title="인쇄"
      className="flex h-7 items-center gap-1.5 rounded-lg border border-[#e8eaf0] bg-white px-2.5 font-medium text-slate-500 transition-all hover:border-slate-400 hover:bg-slate-50 hover:text-slate-700"
      style={{ fontSize: 11 }}
    >
      <Printer size={12} />
      인쇄
    </button>
  );
}

// re-export excel utils for convenience
export { exportToExcel, importFromExcel, downloadTemplate, printContent };
export type { ExcelRow, ExportOptions };
