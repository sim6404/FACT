// ─── Excel 유틸리티 (SheetJS) ─────────────────────────────────────────────────
// 엑셀 내보내기 / 불러오기 / 인쇄

import * as XLSX from "xlsx";

// ── 타입 ─────────────────────────────────────────────────────────────────────
export type ExcelRow = Record<string, string | number | boolean | null | undefined>;

export interface ExportOptions {
  filename: string;
  sheetName?: string;
  /** 한글 헤더 표시 → 실제 키 매핑. 없으면 키 그대로 사용 */
  headers?: Record<string, string>;
}

export interface ImportResult {
  headers: string[];
  rows: ExcelRow[];
  total: number;
  error?: string;
}

// ── 내보내기 ─────────────────────────────────────────────────────────────────
/**
 * 데이터 배열을 .xlsx 파일로 내보냅니다.
 * @param data     행 데이터 배열
 * @param options  파일명, 시트명, 헤더 매핑
 */
export function exportToExcel(data: ExcelRow[], options: ExportOptions): void {
  if (!data.length) {
    alert("내보낼 데이터가 없습니다.");
    return;
  }

  const { filename, sheetName = "Sheet1", headers } = options;

  // 헤더 매핑 적용
  const mapped: ExcelRow[] = data.map(row => {
    if (!headers) return row;
    const out: ExcelRow = {};
    Object.entries(headers).forEach(([kor, key]) => {
      out[kor] = row[key] ?? "";
    });
    return out;
  });

  const ws = XLSX.utils.json_to_sheet(mapped);

  // 컬럼 너비 자동 설정
  const cols = Object.keys(mapped[0] ?? {});
  ws["!cols"] = cols.map(key => ({
    wch: Math.max(
      key.length * 2,
      ...mapped.map(r => String(r[key] ?? "").length)
    ) + 2,
  }));

  // 헤더 행 스타일 (배경색)
  const range = XLSX.utils.decode_range(ws["!ref"] ?? "A1");
  for (let c = range.s.c; c <= range.e.c; c++) {
    const addr = XLSX.utils.encode_cell({ r: 0, c });
    if (!ws[addr]) continue;
    ws[addr].s = {
      fill: { fgColor: { rgb: "1E2247" } },
      font: { bold: true, color: { rgb: "FFFFFF" } },
    };
  }

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const fname = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  XLSX.writeFile(wb, fname);
}

// ── 불러오기 ─────────────────────────────────────────────────────────────────
/**
 * .xlsx / .xls / .csv 파일을 읽어 데이터를 반환합니다.
 * @param file  File input에서 받은 파일 객체
 */
export function importFromExcel(file: File): Promise<ImportResult> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const wb = XLSX.read(data, { type: "array", cellDates: true });

        const sheetName = wb.SheetNames[0];
        const ws = wb.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<ExcelRow>(ws, { defval: "" });

        const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

        resolve({ headers, rows, total: rows.length });
      } catch (err) {
        resolve({
          headers: [],
          rows: [],
          total: 0,
          error: `파일 읽기 실패: ${String(err)}`,
        });
      }
    };

    reader.onerror = () =>
      resolve({ headers: [], rows: [], total: 0, error: "파일 읽기 오류" });

    reader.readAsArrayBuffer(file);
  });
}

// ── 템플릿 다운로드 ───────────────────────────────────────────────────────────
/**
 * 빈 템플릿 엑셀 파일을 생성합니다.
 * @param headers  컬럼 헤더 배열
 * @param filename 파일명
 */
export function downloadTemplate(headers: string[], filename: string): void {
  const ws = XLSX.utils.aoa_to_sheet([headers]);
  ws["!cols"] = headers.map(h => ({ wch: Math.max(h.length * 2, 12) }));

  // 헤더 배경색
  headers.forEach((_, c) => {
    const addr = XLSX.utils.encode_cell({ r: 0, c });
    ws[addr].s = {
      fill: { fgColor: { rgb: "5C6BC0" } },
      font: { bold: true, color: { rgb: "FFFFFF" } },
    };
  });

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "입력양식");
  XLSX.writeFile(wb, filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`);
}

// ── 인쇄 ─────────────────────────────────────────────────────────────────────
/**
 * 특정 엘리먼트 또는 페이지 전체를 인쇄합니다.
 * @param title    인쇄 제목
 * @param elementId  인쇄할 div id (없으면 전체)
 */
export function printContent(title: string, elementId?: string): void {
  const printStyle = `
    @media print {
      @page { size: A4 landscape; margin: 15mm; }
      body * { visibility: hidden; }
      #${elementId ?? "print-area"}, #${elementId ?? "print-area"} * { visibility: visible; }
      #${elementId ?? "print-area"} { position: absolute; left: 0; top: 0; width: 100%; }
      .no-print { display: none !important; }
      table { border-collapse: collapse; width: 100%; }
      th, td { border: 1px solid #e2e8f0; padding: 4px 8px; font-size: 10px; }
      th { background: #1e2247 !important; color: white !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      tr:nth-child(even) { background: #f7f8fc !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  `;

  const styleTag = document.createElement("style");
  styleTag.id = "__print_style__";
  styleTag.innerHTML = printStyle;
  document.head.appendChild(styleTag);

  const prevTitle = document.title;
  document.title = `영동테크 ERP - ${title}`;

  window.print();

  setTimeout(() => {
    document.title = prevTitle;
    styleTag.remove();
  }, 1000);
}
