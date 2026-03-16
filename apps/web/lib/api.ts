export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api";

// 백엔드 가용성 캐시 — 한 번 연결 실패 시 동일 세션 내 불필요한 재시도 억제
let _backendAvailable: boolean | null = null;

export async function checkBackendAvailable(): Promise<boolean> {
  if (_backendAvailable !== null) return _backendAvailable;
  try {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 2000);
    await fetch(`${API_BASE_URL.replace(/\/api$/, "")}/health`, {
      signal: ctrl.signal,
      cache: "no-store",
    });
    clearTimeout(tid);
    _backendAvailable = true;
  } catch {
    _backendAvailable = false;
  }
  return _backendAvailable;
}

async function request<T>(path: string): Promise<T> {
  // 이미 백엔드가 꺼진 것으로 확인된 경우 조용히 실패
  if (_backendAvailable === false) {
    throw new Error("BACKEND_OFFLINE");
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, { cache: "no-store" });
  } catch (err) {
    // 네트워크 연결 오류 — 브라우저가 자동으로 콘솔에 찍는 것과 별개로
    // 여기서는 warn 수준으로만 기록하고 throw해 .catch()가 처리하도록 함
    _backendAvailable = false;
    console.warn(`[FACT API] 백엔드 서버에 연결할 수 없습니다 (${API_BASE_URL}). 목(mock) 데이터로 대체합니다.`);
    throw new Error("BACKEND_OFFLINE");
  }

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (err) {
    _backendAvailable = false;
    console.warn(`[FACT API] 백엔드 서버에 연결할 수 없습니다.`);
    throw new Error("BACKEND_OFFLINE");
  }

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export interface DashboardSummary {
  alerts_today: number;
  weekly_reports: number;
  pending_approvals: number;
  recent_queries: number;
  departments: Array<{
    code: string;
    name: string;
    kpi_status: string;
  }>;
}

export interface AgentToolCall {
  tool_name: string;
  purpose: string;
  status: string;
}

export interface AgentAction {
  action_type: string;
  title: string;
  description: string;
}

export interface AgentSource {
  source_type: string;
  source_ref: string;
  relevance_score: number | null;
}

export interface AgentRun {
  id: string;
  department_code: string;
  route_type: string;
  status: string;
  model_name: string | null;
  policy_version: string | null;
}

export interface Alert {
  id: string;
  alert_type: string;
  severity: string;
  department_code: string;
  title: string;
  message: string | null;
  source_ref: string | null;
}

export interface SavedQuery {
  id: string;
  user_id: string;
  title: string;
  query_text: string;
  department_scope: string | null;
  created_at: string;
}

export interface ConnectorRun {
  id: string;
  connector_name: string;
  started_at: string;
  ended_at: string | null;
  status: string;
  inserted_rows: number | null;
  updated_rows: number | null;
  error_message: string | null;
}

export interface Report {
  id: string;
  title: string;
  status: string;
  report_type: string | null;
  department_code: string | null;
  period_start: string | null;
  period_end: string | null;
  output_file_url: string | null;
}

export interface Approval {
  id: string;
  approval_type: string;
  status: string;
}

export interface KpiMetric {
  code: string;
  label: string;
  value: number;
  unit: string;
}

export interface DepartmentKpi {
  department: string;
  kpis: KpiMetric[];
}

export interface KpiTrendPoint {
  period: string;
  oee: number;
  ppm: number;
  supplier_otd: number;
}

export interface DepartmentKpiTrend {
  department: string;
  points: KpiTrendPoint[];
}

export interface MeetingDirective {
  id: string;
  meeting_date: string;
  department_code: string;
  category: string;
  title: string;
  status: string;
  owner_name: string;
  due_date: string | null;
  source_page: number | null;
  source_section: string | null;
  notes: string | null;
}

export interface MeetingDirectiveStatusUpdate {
  status: string;
}

export interface ProductionInquiry {
  id: string;
  inquiry_no: string;
  production_date: string;
  workorder_no: string;
  status: string;
  item_code: string | null;
  item_name: string | null;
  spec: string | null;
  unit: string;
  planned_qty: number;
  receipt_qty: number;
  warehouse: string | null;
  remark: string | null;
}

export interface ProductionInquiryUpsertPayload {
  inquiry_no: string;
  production_date: string;
  workorder_no: string;
  status: string;
  item_code?: string | null;
  item_name?: string | null;
  spec?: string | null;
  unit: string;
  planned_qty: number;
  receipt_qty: number;
  warehouse?: string | null;
  remark?: string | null;
}

export interface ProductionItem {
  id: string;
  item_code: string;
  item_name: string;
  spec: string;
  unit: string;
  available_qty: number;
  process_name: string | null;
  warehouse: string | null;
}

export interface ProductionProcess {
  id: string;
  process_no: string;
  customer_name: string;
  item_code: string;
  item_name: string;
  production_status: string;
  quality_status: string;
  inventory_status: string;
  plan_qty: number;
  produced_qty: number;
  defect_qty: number;
  available_qty: number;
  ready_qty: number;
  next_action: string;
  issue_summary: string | null;
}

export interface ProductionProcessEvent {
  id: string;
  process_id: string;
  step_code: string;
  step_label: string;
  status: string;
  actor_name: string;
  happened_at: string;
  detail: string;
}

export interface ProductionApprovalLog {
  id: string;
  process_id: string;
  stage: string;
  approver_name: string;
  status: string;
  decided_at: string | null;
  comment: string | null;
}

export interface InventorySync {
  process_id: string;
  warehouse: string;
  item_code: string;
  before_qty: number;
  receipt_qty: number;
  after_qty: number;
  sync_status: string;
  last_synced_at: string | null;
}

export interface ProductionProcessDetail {
  process: ProductionProcess;
  timeline: ProductionProcessEvent[];
  approvals: ProductionApprovalLog[];
  inventory_sync: InventorySync | null;
}

export interface DocumentItem {
  id: string;
  title: string;
  type: string;
  highlights: string[];
}

export interface DocumentSearchResult {
  id: string;
  title: string;
  score: number;
}

export interface DocumentSearchResponse {
  query: string;
  results: DocumentSearchResult[];
}

export interface MeetingDocumentAnalysis {
  file_name: string;
  document_type: string;
  summary: string;
  directives: MeetingDirective[];
  detected_sections: string[];
}

export interface AgentQueryResponse {
  route_type: string;
  specialist_agent: string;
  question: string;
  department_code: string | null;
  response_summary: string;
  generated_sql: string | null;
  answer_markdown: string | null;
  tool_calls: AgentToolCall[];
  recommended_actions: AgentAction[];
  sources: AgentSource[];
}

export async function getDashboardSummary() {
  return request<DashboardSummary>("/dashboard/summary");
}

export async function getDashboardSummarySafe() {
  try {
    return await getDashboardSummary();
  } catch {
    return null;
  }
}

export async function queryAgent(question: string, department_code?: string) {
  return post<AgentQueryResponse>("/agent/query", {
    question,
    department_code,
  });
}

export async function getAgentRuns() {
  return request<AgentRun[]>("/agent/runs");
}

export async function getAlerts() {
  return request<Alert[]>("/dashboard/alerts");
}

export async function getDepartmentKpi(department: string) {
  return request<DepartmentKpi>(`/dashboard/kpi/${department}`);
}

export async function getDepartmentKpiTrend(department: string) {
  return request<DepartmentKpiTrend>(`/dashboard/kpi/${department}/trend`);
}

export async function getMeetingDirectives() {
  return request<MeetingDirective[]>("/dashboard/directives");
}

export async function getMeetingDirective(directiveId: string) {
  return request<MeetingDirective>(`/dashboard/directives/${directiveId}`);
}

export async function updateMeetingDirectiveStatus(
  directiveId: string,
  payload: MeetingDirectiveStatusUpdate,
) {
  return post<MeetingDirective>(`/dashboard/directives/${directiveId}/status`, payload);
}

export async function getProductionInquiries() {
  return request<ProductionInquiry[]>("/production/inquiries");
}

export async function createProductionInquiry(payload: ProductionInquiryUpsertPayload) {
  return post<ProductionInquiry>("/production/inquiries", payload);
}

export async function updateProductionInquiry(
  inquiryId: string,
  payload: ProductionInquiryUpsertPayload,
) {
  return post<ProductionInquiry>(`/production/inquiries/${inquiryId}`, payload);
}

export async function cloneProductionInquiry(inquiryId: string) {
  return post<ProductionInquiry>(`/production/inquiries/${inquiryId}/clone`, {});
}

export interface InquiryHistory {
  id: string;
  inquiry_id: string;
  action: string;
  actor_name: string;
  changed_at: string;
  before_status: string | null;
  after_status: string | null;
  before_receipt_qty: number | null;
  after_receipt_qty: number | null;
  note: string | null;
}

export async function getInquiryHistory(inquiryId: string) {
  return request<InquiryHistory[]>(`/production/inquiries/${inquiryId}/history`);
}

export async function getProductionItems() {
  return request<ProductionItem[]>("/production/items");
}

export async function selectProductionItem(
  inquiryId: string,
  payload: { item_id: string; receipt_qty?: number },
) {
  return post<ProductionInquiry>(`/production/inquiries/${inquiryId}/select-item`, payload);
}

export async function getProductionProcesses() {
  return request<ProductionProcess[]>("/production/processes");
}

export async function getProductionProcessDetail(processId: string) {
  return request<ProductionProcessDetail>(`/production/processes/${processId}/detail`);
}

export async function runProductionProcessAction(
  processId: string,
  payload: { action: string },
) {
  return post<ProductionProcess>(`/production/processes/${processId}/action`, payload);
}

export async function getSavedQueries() {
  return request<SavedQuery[]>("/saved-queries");
}

export async function createSavedQuery(payload: {
  title: string;
  query_text: string;
  department_scope?: string;
}) {
  return post<SavedQuery>("/saved-queries", payload);
}

export async function deleteSavedQuery(savedQueryId: string) {
  const response = await fetch(`${API_BASE_URL}/saved-queries/${savedQueryId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<{ deleted: boolean }>;
}

export async function getConnectorRuns() {
  return request<ConnectorRun[]>("/connectors/runs");
}

export async function runConnector(name: string) {
  return post<ConnectorRun>(`/connectors/${name}/sync`, {});
}

export async function getReports() {
  return request<Report[]>("/reports");
}

export async function generateReport(payload: {
  report_type: string;
  department_code: string;
  period_start: string;
  period_end: string;
}) {
  return post<Report>("/reports/generate", payload);
}

export async function publishReport(reportId: string) {
  return post<{ id: string; status: string }>(`/reports/${reportId}/publish`, {});
}

export async function getApprovals() {
  return request<Approval[]>("/approvals");
}

export async function approveApproval(approvalId: string) {
  return post<{ id: string; status: string }>(`/approvals/${approvalId}/approve`, {});
}

export async function rejectApproval(approvalId: string) {
  return post<{ id: string; status: string }>(`/approvals/${approvalId}/reject`, {});
}

export async function getDocuments() {
  return request<DocumentItem[]>("/documents");
}

export async function searchDocuments(payload: { query: string; department_code?: string }) {
  return post<DocumentSearchResponse>("/documents/search", payload);
}

export async function analyzeMeetingDocument(file: File) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${API_BASE_URL}/documents/analyze-meeting`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json() as Promise<MeetingDocumentAnalysis>;
}

// ─────────────────────────── Quality NCR ───────────────────────────

export interface QualityNCR {
  id: string;
  ncr_no: string;
  detected_at: string;
  department_code: string;
  item_code: string | null;
  item_name: string | null;
  defect_type: string;
  defect_qty: number;
  total_qty: number;
  defect_rate: number;
  status: string;
  severity: string;
  detected_by: string;
  root_cause: string | null;
  action_taken: string | null;
  resolved_at: string | null;
  customer_name: string | null;
  remark: string | null;
}

export interface QualityNCRUpsertPayload {
  ncr_no: string;
  detected_at: string;
  department_code: string;
  item_code?: string;
  item_name?: string;
  defect_type: string;
  defect_qty: number;
  total_qty: number;
  status: string;
  severity: string;
  detected_by: string;
  root_cause?: string;
  action_taken?: string;
  resolved_at?: string;
  customer_name?: string;
  remark?: string;
}

export interface QualityNCRStatusUpdate {
  status: string;
  action_taken?: string;
  root_cause?: string;
}

export async function listQualityNCRs(params?: { status?: string; severity?: string }) {
  const qs = new URLSearchParams();
  if (params?.status) qs.set("status", params.status);
  if (params?.severity) qs.set("severity", params.severity);
  const q = qs.toString();
  return request<QualityNCR[]>(`/quality/ncrs${q ? "?" + q : ""}`);
}

export async function getQualityNCR(ncrId: string) {
  return request<QualityNCR>(`/quality/ncrs/${ncrId}`);
}

export async function createQualityNCR(payload: QualityNCRUpsertPayload) {
  return post<QualityNCR>("/quality/ncrs", payload);
}

export async function updateQualityNCR(ncrId: string, payload: QualityNCRUpsertPayload) {
  return post<QualityNCR>(`/quality/ncrs/${ncrId}`, payload);
}

export async function updateQualityNCRStatus(ncrId: string, payload: QualityNCRStatusUpdate) {
  return post<QualityNCR>(`/quality/ncrs/${ncrId}/status`, payload);
}

// ─────────────────────────── Inventory ───────────────────────────

export interface InventoryLedger {
  id: string;
  item_code: string;
  item_name: string;
  spec: string | null;
  unit: string;
  warehouse: string;
  stock_qty: number;
  safety_stock: number;
  is_below_safety: boolean;
  last_updated: string;
}

export interface InventoryTransaction {
  id: string;
  item_code: string;
  item_name: string;
  tx_type: string;
  qty: number;
  balance_after: number;
  warehouse: string;
  reference_no: string | null;
  actor_name: string;
  tx_at: string;
  note: string | null;
}

export interface InventoryTransactionCreatePayload {
  item_code: string;
  tx_type: string;
  qty: number;
  warehouse: string;
  reference_no?: string;
  note?: string;
}

export async function listInventoryLedger(params?: { warehouse?: string; below_safety_only?: boolean }) {
  const qs = new URLSearchParams();
  if (params?.warehouse) qs.set("warehouse", params.warehouse);
  if (params?.below_safety_only) qs.set("below_safety_only", "true");
  const q = qs.toString();
  return request<InventoryLedger[]>(`/inventory/ledger${q ? "?" + q : ""}`);
}

export async function listInventoryTransactions(params?: { item_code?: string; tx_type?: string }) {
  const qs = new URLSearchParams();
  if (params?.item_code) qs.set("item_code", params.item_code);
  if (params?.tx_type) qs.set("tx_type", params.tx_type);
  const q = qs.toString();
  return request<InventoryTransaction[]>(`/inventory/transactions${q ? "?" + q : ""}`);
}

export async function createInventoryTransaction(payload: InventoryTransactionCreatePayload) {
  return post<InventoryTransaction>("/inventory/transactions", payload);
}
