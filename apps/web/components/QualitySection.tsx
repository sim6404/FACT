"use client";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  Clock,
  FilePlus2,
  Loader2,
  Search,
  ShieldAlert,
  ShieldCheck,
  XCircle,
} from "lucide-react";
import {
  createQualityNCR,
  listQualityNCRs,
  updateQualityNCR,
  updateQualityNCRStatus,
  type QualityNCR,
  type QualityNCRUpsertPayload,
} from "@/lib/api";

const STATUS_META: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  open: {
    label: "미처리",
    cls: "bg-red-100 text-red-700",
    icon: <XCircle size={12} />,
  },
  investigating: {
    label: "조사중",
    cls: "bg-amber-100 text-amber-700",
    icon: <Clock size={12} />,
  },
  resolved: {
    label: "처리완료",
    cls: "bg-emerald-100 text-emerald-700",
    icon: <CheckCircle2 size={12} />,
  },
  closed: {
    label: "종결",
    cls: "bg-slate-100 text-slate-600",
    icon: <ShieldCheck size={12} />,
  },
};

const SEVERITY_META: Record<string, { label: string; cls: string }> = {
  critical: { label: "치명적", cls: "bg-red-600 text-white" },
  major: { label: "주요", cls: "bg-orange-500 text-white" },
  minor: { label: "경미", cls: "bg-sky-500 text-white" },
};

const DEFAULT_FORM: QualityNCRUpsertPayload = {
  ncr_no: "",
  detected_at: new Date().toISOString().slice(0, 10),
  department_code: "QUAL",
  item_code: "",
  item_name: "",
  defect_type: "",
  defect_qty: 0,
  total_qty: 0,
  status: "open",
  severity: "major",
  detected_by: "",
  root_cause: "",
  action_taken: "",
  customer_name: "",
  remark: "",
};

export default function QualitySection() {
  const [ncrs, setNcrs] = useState<QualityNCR[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreate, setIsCreate] = useState(false);
  const [form, setForm] = useState<QualityNCRUpsertPayload>(DEFAULT_FORM);
  const [saving, setSaving] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const selectedNCR = ncrs.find((n) => n.id === selectedId) ?? null;

  const fetchNCRs = async () => {
    setLoading(true);
    try {
      const data = await listQualityNCRs();
      setNcrs(data);
    } catch {
      setNcrs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNCRs();
  }, []);

  useEffect(() => {
    if (selectedNCR && !isCreate) {
      setForm({
        ncr_no: selectedNCR.ncr_no,
        detected_at: selectedNCR.detected_at,
        department_code: selectedNCR.department_code,
        item_code: selectedNCR.item_code ?? "",
        item_name: selectedNCR.item_name ?? "",
        defect_type: selectedNCR.defect_type,
        defect_qty: selectedNCR.defect_qty,
        total_qty: selectedNCR.total_qty,
        status: selectedNCR.status,
        severity: selectedNCR.severity,
        detected_by: selectedNCR.detected_by,
        root_cause: selectedNCR.root_cause ?? "",
        action_taken: selectedNCR.action_taken ?? "",
        customer_name: selectedNCR.customer_name ?? "",
        remark: selectedNCR.remark ?? "",
      });
    }
  }, [selectedId, isCreate]);

  const filteredNCRs = ncrs.filter((n) => {
    const matchStatus = filterStatus === "all" || n.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      n.ncr_no.toLowerCase().includes(q) ||
      (n.item_name ?? "").toLowerCase().includes(q) ||
      (n.customer_name ?? "").toLowerCase().includes(q) ||
      n.defect_type.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  const handleStartCreate = () => {
    setIsCreate(true);
    setSelectedId(null);
    setForm({ ...DEFAULT_FORM, ncr_no: `NCR-${new Date().toISOString().slice(0, 10)}-${String(ncrs.length + 1).padStart(3, "0")}` });
    setApiError(null);
  };

  const handleChange = (key: keyof QualityNCRUpsertPayload, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!form.ncr_no || !form.defect_type || !form.detected_by) {
      setApiError("필수 항목(NCR번호, 불량유형, 발견자)을 입력해주세요.");
      return;
    }
    setSaving(true);
    setApiError(null);
    try {
      if (isCreate) {
        const created = await createQualityNCR(form);
        setNcrs((prev) => [created, ...prev]);
        setSelectedId(created.id);
        setIsCreate(false);
      } else if (selectedId) {
        const updated = await updateQualityNCR(selectedId, form);
        setNcrs((prev) => prev.map((n) => (n.id === selectedId ? updated : n)));
      }
    } catch (e: unknown) {
      setApiError(e instanceof Error ? e.message : "저장 오류");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    if (!selectedNCR) return;
    setStatusUpdating(true);
    setApiError(null);
    try {
      const updated = await updateQualityNCRStatus(selectedNCR.id, {
        status: newStatus,
        action_taken: form.action_taken || undefined,
        root_cause: form.root_cause || undefined,
      });
      setNcrs((prev) => prev.map((n) => (n.id === updated.id ? updated : n)));
      setForm((prev) => ({ ...prev, status: updated.status }));
    } catch (e: unknown) {
      setApiError(e instanceof Error ? e.message : "상태 변경 오류");
    } finally {
      setStatusUpdating(false);
    }
  };

  const counts = {
    all: ncrs.length,
    open: ncrs.filter((n) => n.status === "open").length,
    investigating: ncrs.filter((n) => n.status === "investigating").length,
    resolved: ncrs.filter((n) => n.status === "resolved").length,
    closed: ncrs.filter((n) => n.status === "closed").length,
  };

  const criticalCount = ncrs.filter((n) => n.severity === "critical" && n.status !== "closed").length;

  return (
    <div className="space-y-4">
      {/* 상단 요약 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="전체 NCR" value={counts.all} sub="건" color="slate" />
        <StatCard label="미처리" value={counts.open} sub="건" color="red" />
        <StatCard label="조사중" value={counts.investigating} sub="건" color="amber" />
        <StatCard label="처리완료" value={counts.resolved} sub="건" color="emerald" />
      </div>

      {criticalCount > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <ShieldAlert size={16} className="shrink-0" />
          <strong>치명적(Critical) NCR {criticalCount}건</strong>이 미결 상태입니다. 즉시 조치가 필요합니다.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* 목록 패널 */}
        <div className="rounded-2xl border border-slate-200 bg-white lg:col-span-1">
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
            <ClipboardList size={16} className="text-violet-600" />
            <span className="text-sm font-semibold text-slate-900">NCR 목록</span>
            <button
              onClick={handleStartCreate}
              className="ml-auto flex items-center gap-1.5 rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-700"
            >
              <FilePlus2 size={13} />
              신규 등록
            </button>
          </div>

          {/* 필터 */}
          <div className="flex flex-wrap gap-1.5 border-b border-slate-100 px-4 py-2">
            {(["all", "open", "investigating", "resolved", "closed"] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${
                  filterStatus === s
                    ? "bg-violet-600 text-white"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {s === "all" ? "전체" : STATUS_META[s]?.label} {(counts as Record<string, number>)[s]}
              </button>
            ))}
          </div>

          {/* 검색 */}
          <div className="border-b border-slate-100 px-4 py-2">
            <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-1.5">
              <Search size={13} className="text-slate-400" />
              <input
                className="w-full bg-transparent text-xs text-slate-700 placeholder:text-slate-400 outline-none"
                placeholder="NCR번호, 품목, 고객명 검색"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          {/* 목록 */}
          <div className="max-h-[520px] overflow-y-auto">
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 size={22} className="animate-spin text-slate-400" />
              </div>
            ) : filteredNCRs.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">NCR 없음</p>
            ) : (
              filteredNCRs.map((ncr) => (
                <button
                  key={ncr.id}
                  onClick={() => { setSelectedId(ncr.id); setIsCreate(false); setApiError(null); }}
                  className={`flex w-full flex-col gap-1 border-b border-slate-100 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                    selectedId === ncr.id ? "bg-violet-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${SEVERITY_META[ncr.severity]?.cls}`}>
                      {SEVERITY_META[ncr.severity]?.label}
                    </span>
                    <span className="truncate text-xs font-semibold text-slate-800">{ncr.ncr_no}</span>
                    <ChevronRight size={12} className="ml-auto shrink-0 text-slate-400" />
                  </div>
                  <p className="truncate text-xs text-slate-500">{ncr.item_name || ncr.defect_type}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span>{ncr.detected_at}</span>
                    <span>·</span>
                    <span
                      className={`flex items-center gap-0.5 rounded-full px-1.5 py-0.5 font-medium ${STATUS_META[ncr.status]?.cls}`}
                    >
                      {STATUS_META[ncr.status]?.icon}
                      {STATUS_META[ncr.status]?.label}
                    </span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* 상세 / 작업공간 */}
        <div className="space-y-4 lg:col-span-2">
          {!selectedNCR && !isCreate ? (
            <div className="flex h-64 items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white">
              <p className="text-sm text-slate-400">NCR을 선택하거나 신규 등록하세요</p>
            </div>
          ) : (
            <>
              {/* 상태 액션 (기존 건만) */}
              {selectedNCR && !isCreate && (
                <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-4">
                  <span className="mr-auto text-sm font-semibold text-slate-900">
                    {selectedNCR.ncr_no}
                    <span className={`ml-2 inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_META[selectedNCR.status]?.cls}`}>
                      {STATUS_META[selectedNCR.status]?.icon}
                      {STATUS_META[selectedNCR.status]?.label}
                    </span>
                    <span className={`ml-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${SEVERITY_META[selectedNCR.severity]?.cls}`}>
                      {SEVERITY_META[selectedNCR.severity]?.label}
                    </span>
                  </span>
                  {statusUpdating && <Loader2 size={16} className="animate-spin text-slate-400" />}
                  {selectedNCR.status === "open" && (
                    <ActionBtn label="조사 시작" color="amber" onClick={() => handleStatusChange("investigating")} />
                  )}
                  {selectedNCR.status === "investigating" && (
                    <ActionBtn label="처리 완료" color="emerald" onClick={() => handleStatusChange("resolved")} />
                  )}
                  {selectedNCR.status === "resolved" && (
                    <ActionBtn label="종결 처리" color="slate" onClick={() => handleStatusChange("closed")} />
                  )}
                </div>
              )}

              {/* 등록/수정 폼 */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="mb-4 text-sm font-semibold text-slate-900">
                  {isCreate ? "신규 NCR 등록" : "NCR 상세 정보"}
                </p>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <FormField label="NCR 번호 *" value={String(form.ncr_no)} onChange={(v) => handleChange("ncr_no", v)} />
                  <FormField label="발생일 *" type="date" value={String(form.detected_at)} onChange={(v) => handleChange("detected_at", v)} />
                  <FormField label="고객사" value={String(form.customer_name ?? "")} onChange={(v) => handleChange("customer_name", v)} />
                  <FormField label="품목코드" value={String(form.item_code ?? "")} onChange={(v) => handleChange("item_code", v)} />
                  <FormField label="품목명" value={String(form.item_name ?? "")} onChange={(v) => handleChange("item_name", v)} />
                  <FormField label="불량 유형 *" value={String(form.defect_type)} onChange={(v) => handleChange("defect_type", v)} />
                  <FormField label="전체 수량" type="number" value={String(form.total_qty)} onChange={(v) => handleChange("total_qty", Number(v))} />
                  <FormField label="불량 수량" type="number" value={String(form.defect_qty)} onChange={(v) => handleChange("defect_qty", Number(v))} />
                  <FormSelect
                    label="심각도"
                    value={String(form.severity)}
                    options={[
                      { value: "critical", label: "치명적" },
                      { value: "major", label: "주요" },
                      { value: "minor", label: "경미" },
                    ]}
                    onChange={(v) => handleChange("severity", v)}
                  />
                  <FormSelect
                    label="상태"
                    value={String(form.status)}
                    options={[
                      { value: "open", label: "미처리" },
                      { value: "investigating", label: "조사중" },
                      { value: "resolved", label: "처리완료" },
                      { value: "closed", label: "종결" },
                    ]}
                    onChange={(v) => handleChange("status", v)}
                  />
                  <FormField label="발견자 *" value={String(form.detected_by)} onChange={(v) => handleChange("detected_by", v)} />
                  <div className="sm:col-span-2">
                    <FormField label="원인 분석" value={String(form.root_cause ?? "")} onChange={(v) => handleChange("root_cause", v)} multiline />
                  </div>
                  <div className="sm:col-span-2">
                    <FormField label="조치 내용" value={String(form.action_taken ?? "")} onChange={(v) => handleChange("action_taken", v)} multiline />
                  </div>
                  <div className="sm:col-span-2">
                    <FormField label="비고" value={String(form.remark ?? "")} onChange={(v) => handleChange("remark", v)} multiline />
                  </div>
                </div>

                {apiError && (
                  <p className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-xs text-red-700">
                    <AlertTriangle size={14} /> {apiError}
                  </p>
                )}

                <div className="mt-4 flex justify-end gap-2">
                  {isCreate && (
                    <button
                      onClick={() => { setIsCreate(false); setSelectedId(null); }}
                      className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      취소
                    </button>
                  )}
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 rounded-lg bg-violet-600 px-5 py-2 text-xs font-semibold text-white hover:bg-violet-700 disabled:opacity-50"
                  >
                    {saving ? <Loader2 size={13} className="animate-spin" /> : null}
                    {isCreate ? "NCR 등록" : "수정 저장"}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: number;
  sub: string;
  color: string;
}) {
  const clsMap: Record<string, string> = {
    slate: "text-slate-700 bg-slate-50 border-slate-200",
    red: "text-red-700 bg-red-50 border-red-200",
    amber: "text-amber-700 bg-amber-50 border-amber-200",
    emerald: "text-emerald-700 bg-emerald-50 border-emerald-200",
  };
  return (
    <div className={`rounded-2xl border p-4 ${clsMap[color] ?? clsMap.slate}`}>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold">
        {value}
        <span className="ml-1 text-sm font-normal">{sub}</span>
      </p>
    </div>
  );
}

function ActionBtn({ label, color, onClick }: { label: string; color: string; onClick: () => void }) {
  const clsMap: Record<string, string> = {
    amber: "bg-amber-500 hover:bg-amber-600 text-white",
    emerald: "bg-emerald-600 hover:bg-emerald-700 text-white",
    slate: "bg-slate-600 hover:bg-slate-700 text-white",
  };
  return (
    <button onClick={onClick} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${clsMap[color] ?? clsMap.slate}`}>
      {label}
    </button>
  );
}

function FormField({
  label,
  value,
  type = "text",
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  type?: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  const cls = "w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-violet-400 focus:ring-1 focus:ring-violet-200";
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      {multiline ? (
        <textarea rows={2} className={cls} value={value} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input type={type} className={cls} value={value} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

function FormSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <select
        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-violet-400"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}
