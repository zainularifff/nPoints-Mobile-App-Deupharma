import type { ReportPdfPayload } from "./reportPdf";

type ReportSection = ReportPdfPayload["sections"][number];

type ReportMetric = ReportPdfPayload["metrics"][number];
type ReportFinding = ReportPdfPayload["findings"][number];
type ReportDetailTable = ReportPdfPayload["detailTable"];

function cleanText(value: unknown, fallback = "-") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function asNumber(value: unknown, fallback = 0) {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;

  const parsed = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeMetrics(report: any): ReportMetric[] {
  if (Array.isArray(report?.metrics)) {
    return report.metrics.map((item: any) => ({
      label: cleanText(item?.label || item?.name),
      value: cleanText(item?.value),
      note: cleanText(item?.note || item?.description, ""),
    }));
  }

  return [];
}

function normalizeFindings(report: any): ReportFinding[] {
  if (Array.isArray(report?.findings)) {
    return report.findings.map((item: any) => ({
      area: cleanText(item?.area || item?.title),
      statement: cleanText(item?.statement || item?.description),
    }));
  }

  return [];
}

function normalizeDetailTable(report: any): ReportDetailTable {
  const table = report?.detailTable || report?.detailsTable || {};

  return {
    title: cleanText(table?.title, "Selected Detail Records"),
    description: cleanText(
      table?.description,
      "Detail records will be shown when provided by the backend response."
    ),
    columns: Array.isArray(table?.columns) ? table.columns : [],
    rows: Array.isArray(table?.rows) ? table.rows : [],
  };
}

export function getReportPdfPayload(
  report: any,
  sections: ReportSection[] = []
): ReportPdfPayload {
  return {
    id: cleanText(report?.id),
    title: cleanText(report?.title, "EMA Operational Dashboard Report"),
    description: cleanText(report?.description, "Operational report summary."),
    category: cleanText(report?.category, "executive"),
    frequency: cleanText(report?.frequency),
    lastGenerated: cleanText(report?.lastGenerated),
    pages: asNumber(report?.pages, 0),
    status: cleanText(report?.status),
    sections,
    metrics: normalizeMetrics(report),
    findings: normalizeFindings(report),
    detailTable: normalizeDetailTable(report),
  };
}
