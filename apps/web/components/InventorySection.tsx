"use client";
import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowDownCircle,
  ArrowUpCircle,
  BarChart3,
  Loader2,
  PackageSearch,
  RefreshCw,
  SlidersHorizontal,
  TrendingDown,
} from "lucide-react";
import {
  createInventoryTransaction,
  listInventoryLedger,
  listInventoryTransactions,
  type InventoryLedger,
  type InventoryTransaction,
  type InventoryTransactionCreatePayload,
} from "@/lib/api";

const TX_TYPE_META: Record<string, { label: string; cls: string; icon: React.ReactNode }> = {
  receipt: { label: "입고", cls: "bg-emerald-100 text-emerald-700", icon: <ArrowDownCircle size={12} /> },
  issue: { label: "출고", cls: "bg-sky-100 text-sky-700", icon: <ArrowUpCircle size={12} /> },
  adjust: { label: "조정", cls: "bg-amber-100 text-amber-700", icon: <SlidersHorizontal size={12} /> },
  return: { label: "반납", cls: "bg-violet-100 text-violet-700", icon: <RefreshCw size={12} /> },
};

const DEFAULT_TX: InventoryTransactionCreatePayload = {
  item_code: "",
  tx_type: "receipt",
  qty: 0,
  warehouse: "",
  reference_no: "",
  note: "",
};

function formatDt(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function InventorySection() {
  const [ledger, setLedger] = useState<InventoryLedger[]>([]);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [ledgerLoading, setLedgerLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(true);

  const [belowOnly, setBelowOnly] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryLedger | null>(null);

  const [txForm, setTxForm] = useState<InventoryTransactionCreatePayload>(DEFAULT_TX);
  const [txSaving, setTxSaving] = useState(false);
  const [txError, setTxError] = useState<string | null>(null);

  const fetchLedger = async () => {
    if (process.env.NEXT_PUBLIC_API_ENABLED === "false") { setLedgerLoading(false); return; }
    setLedgerLoading(true);
    try {
      const data = await listInventoryLedger({ below_safety_only: belowOnly });
      setLedger(data);
    } catch {
      setLedger([]);
    } finally {
      setLedgerLoading(false);
    }
  };

  const fetchTransactions = async (itemCode?: string) => {
    if (process.env.NEXT_PUBLIC_API_ENABLED === "false") { setTxLoading(false); return; }
    setTxLoading(true);
    try {
      const data = await listInventoryTransactions(itemCode ? { item_code: itemCode } : {});
      setTransactions(data);
    } catch {
      setTransactions([]);
    } finally {
      setTxLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [belowOnly]);

  useEffect(() => {
    fetchTransactions(selectedItem?.item_code);
  }, [selectedItem]);

  const belowSafetyItems = ledger.filter((l) => l.is_below_safety);

  const handleSelectItem = (item: InventoryLedger) => {
    setSelectedItem(item);
    setTxForm({ ...DEFAULT_TX, item_code: item.item_code, warehouse: item.warehouse });
    setTxError(null);
  };

  const handleTxChange = (key: keyof InventoryTransactionCreatePayload, value: string | number) => {
    setTxForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleCreateTx = async () => {
    if (!txForm.item_code || !txForm.qty || txForm.qty === 0) {
      setTxError("품목코드와 수량을 입력해주세요.");
      return;
    }
    setTxSaving(true);
    setTxError(null);
    if (process.env.NEXT_PUBLIC_API_ENABLED === "false") {
      setTxError("API가 비활성화 상태입니다.");
      setTxSaving(false);
      return;
    }
    try {
      await createInventoryTransaction(txForm);
      await fetchLedger();
      await fetchTransactions(txForm.item_code);
      const refreshed = await listInventoryLedger();
      const updatedItem = refreshed.find((l) => l.item_code === txForm.item_code) ?? null;
      setSelectedItem(updatedItem);
    } catch (e: unknown) {
      setTxError(e instanceof Error ? e.message : "입출고 처리 오류");
    } finally {
      setTxSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 상단 요약 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="등록 품목" value={ledger.length} sub="종" color="slate" />
        <StatCard label="안전재고 미달" value={belowSafetyItems.length} sub="종" color="red" />
        <StatCard
          label="총 입출고 건수"
          value={transactions.length}
          sub="건"
          color="sky"
        />
        <StatCard
          label="입고 건수"
          value={transactions.filter((t) => t.tx_type === "receipt").length}
          sub="건"
          color="emerald"
        />
      </div>

      {belowSafetyItems.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-amber-800">
            <TrendingDown size={16} />
            안전재고 미달 경보
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {belowSafetyItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleSelectItem(item)}
                className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-1.5 text-xs font-medium text-amber-700 shadow-sm hover:bg-amber-100"
              >
                <AlertTriangle size={11} />
                {item.item_name}
                <span className="text-amber-500">
                  ({item.stock_qty}/{item.safety_stock})
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* 재고 원장 */}
        <div className="rounded-2xl border border-slate-200 bg-white lg:col-span-1">
          <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
            <PackageSearch size={16} className="text-sky-600" />
            <span className="text-sm font-semibold text-slate-900">재고 원장</span>
            <label className="ml-auto flex cursor-pointer items-center gap-1.5 text-xs text-slate-500">
              <input
                type="checkbox"
                checked={belowOnly}
                onChange={(e) => setBelowOnly(e.target.checked)}
                className="rounded"
              />
              미달만
            </label>
          </div>

          <div className="max-h-[520px] overflow-y-auto">
            {ledgerLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 size={20} className="animate-spin text-slate-400" />
              </div>
            ) : ledger.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-400">재고 품목 없음</p>
            ) : (
              ledger.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectItem(item)}
                  className={`flex w-full flex-col gap-1.5 border-b border-slate-100 px-4 py-3 text-left transition-colors hover:bg-slate-50 ${
                    selectedItem?.id === item.id ? "bg-sky-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {item.is_below_safety && (
                      <AlertTriangle size={12} className="shrink-0 text-amber-500" />
                    )}
                    <span className="truncate text-xs font-semibold text-slate-800">{item.item_name}</span>
                    <span className="ml-auto shrink-0 text-xs font-bold text-slate-700">
                      {item.stock_qty.toLocaleString()}
                      <span className="ml-0.5 text-[10px] font-normal text-slate-400">{item.unit}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                    <span>{item.item_code}</span>
                    <span>·</span>
                    <span>{item.warehouse}</span>
                    <span className={`ml-auto ${item.is_below_safety ? "text-amber-500 font-medium" : ""}`}>
                      안전재고 {item.safety_stock}
                    </span>
                  </div>
                  {/* 재고 바 */}
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-all ${
                        item.is_below_safety ? "bg-amber-400" : "bg-emerald-500"
                      }`}
                      style={{
                        width: `${Math.min(100, (item.stock_qty / Math.max(item.safety_stock * 2, 1)) * 100)}%`,
                      }}
                    />
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* 오른쪽: 입출고 처리 + 이력 */}
        <div className="space-y-4 lg:col-span-2">
          {/* 입출고 등록 */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 size={16} className="text-sky-600" />
              <span className="text-sm font-semibold text-slate-900">
                입출고 처리
                {selectedItem && (
                  <span className="ml-2 text-xs font-normal text-slate-500">
                    — {selectedItem.item_name} (현재 재고: {selectedItem.stock_qty} {selectedItem.unit})
                  </span>
                )}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">품목코드 *</label>
                <input
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-sky-400"
                  value={txForm.item_code}
                  onChange={(e) => handleTxChange("item_code", e.target.value)}
                  placeholder="예: AX01"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">유형 *</label>
                <select
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-sky-400"
                  value={txForm.tx_type}
                  onChange={(e) => handleTxChange("tx_type", e.target.value)}
                >
                  <option value="receipt">입고</option>
                  <option value="issue">출고</option>
                  <option value="adjust">조정</option>
                  <option value="return">반납</option>
                </select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">수량 *</label>
                <input
                  type="number"
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-sky-400"
                  value={txForm.qty}
                  onChange={(e) => handleTxChange("qty", Number(e.target.value))}
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">창고</label>
                <input
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-sky-400"
                  value={txForm.warehouse}
                  onChange={(e) => handleTxChange("warehouse", e.target.value)}
                  placeholder="예: 원자재창고"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">참조번호</label>
                <input
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-sky-400"
                  value={txForm.reference_no}
                  onChange={(e) => handleTxChange("reference_no", e.target.value)}
                  placeholder="WO번호, SO번호 등"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-600">비고</label>
                <input
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 outline-none focus:border-sky-400"
                  value={txForm.note}
                  onChange={(e) => handleTxChange("note", e.target.value)}
                />
              </div>
            </div>

            {txError && (
              <p className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-xs text-red-700">
                <AlertTriangle size={14} /> {txError}
              </p>
            )}

            <div className="mt-4 flex justify-end">
              <button
                onClick={handleCreateTx}
                disabled={txSaving}
                className="flex items-center gap-1.5 rounded-lg bg-sky-600 px-5 py-2 text-xs font-semibold text-white hover:bg-sky-700 disabled:opacity-50"
              >
                {txSaving ? <Loader2 size={13} className="animate-spin" /> : null}
                입출고 처리
              </button>
            </div>
          </div>

          {/* 입출고 이력 */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="mb-4 flex items-center gap-2">
              <RefreshCw size={15} className="text-sky-600" />
              <span className="text-sm font-semibold text-slate-900">
                입출고 이력
                {selectedItem && <span className="ml-1 text-xs font-normal text-slate-400">({selectedItem.item_name})</span>}
              </span>
              {txLoading && <Loader2 size={13} className="ml-1 animate-spin text-slate-400" />}
            </div>

            {transactions.length === 0 ? (
              <p className="rounded-xl bg-slate-50 px-4 py-5 text-center text-xs text-slate-400">
                {selectedItem ? "이력이 없습니다." : "좌측 품목을 선택하면 이력이 표시됩니다."}
              </p>
            ) : (
              <div className="max-h-72 space-y-2 overflow-y-auto">
                {transactions.map((tx) => (
                  <div key={tx.id} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                    <span
                      className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        TX_TYPE_META[tx.tx_type]?.cls ?? "bg-slate-100 text-slate-600"
                      }`}
                    >
                      {TX_TYPE_META[tx.tx_type]?.icon}
                      {TX_TYPE_META[tx.tx_type]?.label}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-xs font-semibold text-slate-800">{tx.item_name}</span>
                        <span className={`ml-auto text-xs font-bold ${tx.tx_type === "issue" ? "text-red-600" : "text-emerald-600"}`}>
                          {tx.tx_type === "issue" ? "-" : tx.tx_type === "adjust" && tx.qty < 0 ? "" : "+"}
                          {tx.qty.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
                        <span>{formatDt(tx.tx_at)}</span>
                        {tx.reference_no && <><span>·</span><span>{tx.reference_no}</span></>}
                        <span>· {tx.actor_name}</span>
                        <span className="ml-auto">잔고 {tx.balance_after.toLocaleString()}</span>
                      </div>
                      {tx.note && <p className="mt-0.5 text-[10px] text-slate-500">{tx.note}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: number; sub: string; color: string }) {
  const clsMap: Record<string, string> = {
    slate: "text-slate-700 bg-slate-50 border-slate-200",
    red: "text-red-700 bg-red-50 border-red-200",
    sky: "text-sky-700 bg-sky-50 border-sky-200",
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
