"use client";
// ─── 승인 섹션 (PPT Slide 2 결재양식: 작성→검토→승인) ─────────────────────────
// 주간회의 결재선, 4M 변경 승인

import { useState } from "react";
import { FileSignature } from "lucide-react";
import { PgHdr, Btn, Tbl, TR, TD, Badge } from "./shared";
import { MEETING_INFO } from "@/lib/fact-plan-data";

const MOCK_APPROVALS = [
  { id: "a1", type: "주간회의 결재", title: "02월(04주차) 주간 회의 — 지시사항 및 주요사항", requester: "경영지원팀", created: MEETING_INFO.date, status: "검토중" as const, step: 2, steps: ["작성", "검토", "승인"] as const },
  { id: "a2", type: "4M 변경 승인", title: "이너씰 금형 교체 — SRG45", requester: "기술팀", created: "2026-02-11", status: "대기" as const, step: 1, steps: ["검토 요청", "승인"] as const },
  { id: "a3", type: "주간회의 결재", title: "26년 01월 사업 계획 대비 실적보고", requester: "경영지원팀", created: "2026-02-27", status: "승인완료" as const, step: 3, steps: ["작성", "검토", "승인"] as const },
];

const STEP_COLORS: Record<string, string> = {
  대기: "gray",
  검토중: "amber",
  승인완료: "green",
  반려: "red",
};

export default function ApprovalSection() {
  const [tab, setTab] = useState<"all" | "pending" | "done">("all");
  const items = MOCK_APPROVALS.filter((a) => (tab === "pending" ? a.status !== "승인완료" : tab === "done" ? a.status === "승인완료" : true));

  return (
    <div className="space-y-6">
      <PgHdr
        title="승인"
        sub="주간회의 결재 · 4M 변경 승인"
        actions={
          <>
            <Btn v="secondary">필터</Btn>
            <Btn v="primary" icon={<FileSignature size={12} />}>
              결재 요청
            </Btn>
          </>
        }
      />

      <div className="flex gap-2">
        {[
          { key: "all" as const, label: "전체" },
          { key: "pending" as const, label: "대기/검토" },
          { key: "done" as const, label: "승인완료" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-xl px-4 py-2 font-semibold transition-all ${tab === t.key ? "bg-[#0d7f8a] text-white" : "bg-white border border-slate-200 text-slate-600"}`}
            style={{ fontSize: 12 }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="rounded-xl border border-[#e8eaf0] bg-white shadow-sm">
        <Tbl cols={["유형", "제목", "요청자", "요청일", "결재선", "상태", "처리"]}>
          {items.length === 0 ? (
            <tr>
              <td colSpan={7} className="px-4 py-12 text-center text-slate-400" style={{ fontSize: 12 }}>
                해당 건이 없습니다.
              </td>
            </tr>
          ) : (
            items.map((a) => (
              <TR key={a.id}>
                <td className="px-3 py-2">
                  <Badge l={a.type} c="blue" />
                </td>
                <TD bold>{a.title}</TD>
                <TD muted>{a.requester}</TD>
                <TD muted>{a.created}</TD>
                <td className="px-3 py-2 text-[11px] text-slate-600">
                  {a.steps.map((s, i) => (
                    <span key={i}>
                      {i > 0 && " → "}
                      <span className={i < a.step ? "font-semibold text-[#0d7f8a]" : "text-slate-400"}>{s}</span>
                    </span>
                  ))}
                </td>
                <td className="px-3 py-2">
                  <Badge l={a.status} c={STEP_COLORS[a.status] ?? "gray"} />
                </td>
                <td className="px-3 py-2">
                  {a.status !== "승인완료" && (
                    <button className="rounded-lg bg-[#0d7f8a] px-2 py-1 text-[10px] font-semibold text-white hover:bg-[#0a6470]">
                      검토
                    </button>
                  )}
                </td>
              </TR>
            ))
          )}
        </Tbl>
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
        <p className="mb-2 font-bold text-slate-700" style={{ fontSize: 12 }}>
          결재 워크플로우
        </p>
        <p className="text-slate-600" style={{ fontSize: 11 }}>
          작성자 → 검토자 → 승인자 순으로 결재 진행. 4M 변경(Man/Machine/Material/Method)은 별도 승인 라인 적용.
        </p>
      </div>
    </div>
  );
}
