export type NavKey =
  | "dashboard"
  | "query"
  | "reports"
  | "approvals"
  | "documents"
  | "ops";

export interface AlertItem {
  title: string;
  department: string;
  severity: string;
}

export interface ApprovalItem {
  type: string;
  owner: string;
  status: string;
}

export interface ReportItem {
  title: string;
  period: string;
  status: string;
}

export interface ConnectorItem {
  name: string;
  lastRun: string;
  status: string;
}
