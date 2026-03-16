"use client";
/**
 * FileImportButton — 다중 Excel(.xlsx/.xls) + PDF 파일 불러오기
 * PDF는 pdfjs-dist로 텍스트를 추출한 뒤 행/열로 파싱하여 반환합니다.
 * 사용처: 각 섹션의 "엑셀 불러오기" / "PDF 불러오기" 버튼
 */
import React, { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { FileSpreadsheet, FileText, Loader2, CheckCircle2, AlertCircle, X } from "lucide-react";

export type ParsedRow = Record<string, string | number | null>;

interface ImportResult {
  fileName: string;
  rows: ParsedRow[];
  error?: string;
}

interface FileImportButtonProps {
  /** 파싱 완료 후 호출 — 여러 파일의 결과를 배열로 전달 */
  onImport: (results: ImportResult[]) => void;
  /** 버튼 레이블 */
  label?: string;
  /** 허용 타입 */
  accept?: "excel" | "pdf" | "both";
  /** 버튼 스타일 */
  variant?: "excel" | "pdf";
}

/* ── PDF 텍스트 추출 (pdfjs-dist 동적 import) ───────────────────────────── */
async function parsePdf(file: File): Promise<ParsedRow[]> {
  const pdfjsLib = await import("pdfjs-dist");
  // workerSrc를 CDN으로 지정 (빌드 복잡도 없음)
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const allLines: string[][] = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const tc = await page.getTextContent();
    // y 좌표로 묶어 행 단위로 분류
    const byY: Map<number, string[]> = new Map();
    for (const item of tc.items as { str: string; transform: number[] }[]) {
      const y = Math.round(item.transform[5]);
      if (!byY.has(y)) byY.set(y, []);
      byY.get(y)!.push(item.str.trim());
    }
    // y 내림차순(위→아래) 정렬
    const sorted = [...byY.entries()]
      .sort((a, b) => b[0] - a[0])
      .map(([, cells]) => cells.filter(Boolean));
    allLines.push(...sorted.filter(r => r.length > 0));
  }

  if (allLines.length === 0) return [];

  // 첫 행을 헤더로 사용
  const headers = allLines[0];
  return allLines.slice(1).map(row => {
    const obj: ParsedRow = {};
    headers.forEach((h, i) => { obj[h] = row[i] ?? null; });
    return obj;
  });
}

/* ── Excel 파싱 ─────────────────────────────────────────────────────────── */
async function parseExcel(file: File): Promise<ParsedRow[]> {
  const arrayBuffer = await file.arrayBuffer();
  const wb = XLSX.read(arrayBuffer, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json<ParsedRow>(ws, { defval: null });
}

/* ── 결과 상태 뱃지 ─────────────────────────────────────────────────────── */
function StatusBadge({ r }: { r: ImportResult }) {
  if (r.error) return (
    <span className="flex items-center gap-1 text-red-500" style={{ fontSize: 11 }}>
      <AlertCircle size={12} /> {r.error}
    </span>
  );
  return (
    <span className="flex items-center gap-1 text-emerald-600" style={{ fontSize: 11 }}>
      <CheckCircle2 size={12} /> {r.rows.length}행 완료
    </span>
  );
}

/* ── 메인 컴포넌트 ───────────────────────────────────────────────────────── */
export default function FileImportButton({
  onImport,
  label,
  accept = "both",
  variant = "excel",
}: FileImportButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [showLog, setShowLog] = useState(false);

  const acceptAttr =
    accept === "excel" ? ".xlsx,.xls" :
    accept === "pdf"   ? ".pdf" :
    ".xlsx,.xls,.pdf";

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setLoading(true);
    setShowLog(true);

    const out: ImportResult[] = [];
    for (const file of Array.from(files)) {
      try {
        const isPdf = file.name.toLowerCase().endsWith(".pdf");
        const rows = isPdf ? await parsePdf(file) : await parseExcel(file);
        out.push({ fileName: file.name, rows });
      } catch (e: unknown) {
        out.push({
          fileName: file.name,
          rows: [],
          error: e instanceof Error ? e.message : "파싱 오류",
        });
      }
    }

    setResults(out);
    setLoading(false);
    // 성공한 결과만 onImport로 전달
    const success = out.filter(r => !r.error && r.rows.length > 0);
    if (success.length > 0) onImport(success);
  };

  const isExcel = variant === "excel";
  const btnColor = isExcel ? "#16a34a" : "#2563eb";
  const Icon = isExcel ? FileSpreadsheet : FileText;
  const defaultLabel = isExcel ? "엑셀 불러오기" : "PDF 불러오기";

  return (
    <div className="relative inline-block">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={acceptAttr}
        style={{ display: "none" }}
        onChange={e => handleFiles(e.target.files)}
        onClick={e => { (e.target as HTMLInputElement).value = ""; }}
      />

      <button
        onClick={() => inputRef.current?.click()}
        disabled={loading}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          height: 32,
          padding: "0 12px",
          borderRadius: 8,
          border: `1px solid ${btnColor}`,
          background: "#fff",
          color: btnColor,
          fontSize: 12,
          fontWeight: 600,
          cursor: loading ? "not-allowed" : "pointer",
          opacity: loading ? 0.7 : 1,
          transition: "background 0.15s",
        }}
        onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = `${btnColor}12`; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#fff"; }}
      >
        {loading
          ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} />
          : <Icon size={13} />
        }
        {label ?? defaultLabel}
      </button>

      {/* 결과 로그 패널 */}
      {showLog && results.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 6px)",
            right: 0,
            zIndex: 999,
            minWidth: 280,
            maxWidth: 360,
            background: "#fff",
            border: "1px solid #e4e8ee",
            borderRadius: 12,
            boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
            padding: "10px 12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#0d1117" }}>
              가져오기 결과 ({results.length}개 파일)
            </span>
            <button onClick={() => setShowLog(false)} style={{ background: "none", color: "#9aa3b2", cursor: "pointer", padding: 2 }}>
              <X size={13} />
            </button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {results.map((r, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 8px", borderRadius: 8, background: r.error ? "#fff5f5" : "#f0fdf4", border: `1px solid ${r.error ? "#fecaca" : "#bbf7d0"}` }}>
                <span style={{ fontSize: 11, color: "#374151", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.fileName}</span>
                <StatusBadge r={r} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
