import type { AlertItem, ApprovalItem, ConnectorItem, ReportItem } from "@/lib/types";

export const alertItems: AlertItem[] = [
  { title: "안전재고 미달 위험", department: "구매/자재", severity: "High" },
  { title: "설비 비가동 시간 증가", department: "생산/MES", severity: "Medium" },
  { title: "반복 불량 패턴 감지", department: "품질", severity: "High" },
];

export const approvals: ApprovalItem[] = [
  { type: "발주 추천 승인", owner: "구매팀", status: "대기" },
  { type: "주간 경영회의 보고서", owner: "경영지원", status: "검토중" },
  { type: "품질 조치 계획", owner: "품질팀", status: "대기" },
];

export const reports: ReportItem[] = [
  { title: "제조 운영 주간 보고서", period: "2026-W10", status: "초안 완료" },
  { title: "구매 리스크 브리프", period: "2026-W10", status: "승인 대기" },
  { title: "품질 이상 패턴 리포트", period: "2026-W10", status: "생성 중" },
];

export const connectors: ConnectorItem[] = [
  { name: "ERP", lastRun: "5분 전", status: "정상" },
  { name: "MES", lastRun: "8분 전", status: "정상" },
  { name: "Excel/CSV", lastRun: "15분 전", status: "대기" },
  { name: "문서 저장소", lastRun: "12분 전", status: "인덱싱 중" },
];
