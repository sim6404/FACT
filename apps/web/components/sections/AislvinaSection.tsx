"use client";
// ─── AISLVINA 섹션 (코딩계획서 v1.0) ───────────────────────────────────────
// 품질 현황, 설비 가동률, 비가동 원인 분석

import { useState } from "react";
import { Cpu, PieChart, TrendingUp, AlertTriangle } from "lucide-react";
import { PgHdr, Btn, StatC, Tbl, TR, TD, fc } from "./shared";
import { PPM_CARDS, EQUIPMENT_AVAILABILITY, DOWNTIME_CAUSES } from "@/lib/fact-plan-data";

export default function AislvinaSection() {
  const [focus, setFocus] = useState<"quality" | "equipment" | "downtime">("equipment");
  const avgPpm = Math.round(PPM_CARDS.reduce((a, c) => a + c.ppm, 0) / PPM_CARDS.length);
  const totalDefect = PPM_CARDS.reduce((a, c) => a + c.amount, 0);

  return (
    <div className="space-y-6">
      <PgHdr
        title="AISLVINA"
        sub="품질 현황 · 설비 가동률 · 비가동 원인 분석"
        actions={
          <>
            <Btn v="secondary">엑셀</Btn>
            <Btn v="primary" icon={<Cpu size={12} />}>
              연동 새로고침
            </Btn>
          </>
        }
      />

      {/* 탭 전환 */}
      <div className="flex gap-2">
        {(
          [
            { key: "quality" as const, label: "품질 현황" },
            { key: "equipment" as const, label: "설비 가동률" },
            { key: "downtime" as const, label: "비가동 원인" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setFocus(t.key)}
            className={`rounded-xl px-4 py-2 font-semibold transition-all ${focus === t.key ? "bg-[#0d7f8a] text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-[#0d7f8a] hover:text-[#0d7f8a]"}`}
            style={{ fontSize: 12 }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {focus === "quality" && (
        <div>
          <div className="mb-4 grid grid-cols-4 gap-3">
            <StatC label="평균 PPM" value={fc(avgPpm)} unit="PPM" warn={avgPpm > 50000} />
            <StatC label="불량금액 합계" value={`${Math.round(totalDefect / 10000)}만`} unit="원" warn />
            <StatC label="위험 품목" value={PPM_CARDS.filter((c) => c.status === "위험").length} unit="종" warn />
            <StatC label="양호 품목" value={PPM_CARDS.filter((c) => c.status === "양호").length} unit="종" />
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
            {PPM_CARDS.map((c) => (
              <div
                key={c.category}
                className={`rounded-xl border p-4 ${
                  c.status === "위험" ? "border-red-300 bg-red-50" : c.status === "주의" ? "border-amber-300 bg-amber-50" : "border-green-200 bg-green-50"
                }`}
              >
                <p className="font-bold text-[#0a2535]" style={{ fontSize: 12 }}>
                  {c.category}
                </p>
                <p className="mt-1 font-black" style={{ fontSize: 18 }}>
                  {c.ppm > 0 ? fc(c.ppm) : "-"} PPM
                </p>
                <p className="mt-0.5 text-slate-600" style={{ fontSize: 10 }}>
                  {Math.round(c.amount / 10000)}만원
                </p>
                <span
                  className={`mt-2 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    c.status === "위험" ? "bg-red-200 text-red-800" : c.status === "주의" ? "bg-amber-200 text-amber-800" : "bg-green-200 text-green-800"
                  }`}
                >
                  {c.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {focus === "equipment" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {EQUIPMENT_AVAILABILITY.map((e) => (
              <div key={e.line} className="rounded-xl border border-[#e8eaf0] bg-white p-4 shadow-sm">
                <p className="font-bold text-[#0a2535]" style={{ fontSize: 13 }}>
                  {e.line}
                </p>
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="font-black text-[#0d7f8a]" style={{ fontSize: 28 }}>
                    {e.rate.toFixed(1)}
                  </span>
                  <span className="text-slate-500" style={{ fontSize: 12 }}>
                    %
                  </span>
                </div>
                <p className="mt-1 text-slate-500" style={{ fontSize: 10 }}>
                  가동 {e.run_h}h / 비가동 {e.down_h}h
                </p>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-[#0d7f8a]"
                    style={{ width: `${e.rate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <Tbl cols={["라인", "총시간(h)", "가동시간(h)", "비가동(h)", "가동률(%)"]}>
            {EQUIPMENT_AVAILABILITY.map((e) => (
              <TR key={e.line}>
                <TD bold>{e.line}</TD>
                <TD r>{e.total_h}</TD>
                <TD r>{e.run_h.toFixed(1)}</TD>
                <TD r warn={e.down_h > 15}>{e.down_h.toFixed(1)}</TD>
                <TD r>{e.rate.toFixed(1)}%</TD>
              </TR>
            ))}
          </Tbl>
        </div>
      )}

      {focus === "downtime" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-[#e8eaf0] bg-white p-6 shadow-sm">
            <p className="mb-4 font-bold text-[#0a2535]" style={{ fontSize: 14 }}>
              비가동 원인 비율
            </p>
            <div className="flex flex-col gap-2">
              {DOWNTIME_CAUSES.map((d) => (
                <div key={d.cause} className="flex items-center gap-3">
                  <div className="w-24 shrink-0 text-[11px] font-semibold text-slate-600">{d.cause}</div>
                  <div className="flex-1">
                    <div className="h-6 overflow-hidden rounded-lg bg-slate-100">
                      <div
                        className="flex h-full items-center justify-end rounded-lg pr-2 font-bold text-white"
                        style={{ width: `${d.pct}%`, minWidth: 36, background: d.pct > 25 ? "#0d7f8a" : d.pct > 15 ? "#0891b2" : "#06b6d4" }}
                      >
                        {d.pct}%
                      </div>
                    </div>
                  </div>
                  <span className="w-12 text-right text-[11px] text-slate-500">{d.hours}h</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-[#e8eaf0] bg-white p-6 shadow-sm">
            <p className="mb-4 flex items-center gap-2 font-bold text-[#0a2535]" style={{ fontSize: 14 }}>
              <AlertTriangle size={14} className="text-amber-500" />
              경보 요약
            </p>
            <ul className="space-y-2 text-[12px] text-slate-600">
              <li>• 금형 교체: 총 12h — 최대 비가동 원인</li>
              <li>• 원자재 부족: 8h — 3건 발생</li>
              <li>• 이너씰라인 비가동 19.3h — 품질 점검 연장</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
