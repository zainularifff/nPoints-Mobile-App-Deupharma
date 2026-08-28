export type MobileReportKey = "operations" | "endpointCoverage" | "serviceDesk";

export type MobileReportTemplate = {
  id: MobileReportKey;
  code: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  description: string;
  // Used for the printed/shared PDF (white background), kept saturated for contrast on paper.
  accent: string;
  // Used for the in-app dark UI (hero gradient + tone system).
  tone: "purple" | "cyan" | "amber";
  gradient: [string, string, string];
  category: string;
  primaryFocus: string;
  pdfTitle: string;
};

export const MOBILE_REPORTS: MobileReportTemplate[] = [
  {
    id: "operations",
    code: "OPS-01",
    title: "Operations Snapshot",
    shortTitle: "Operations",
    subtitle: "Endpoint, ticket and location health in one page.",
    description: "Compact executive view for overall IT operations status, attention count and daily posture.",
    accent: "#5B49D8",
    tone: "purple",
    gradient: ["#6D5AE0", "#4C3FBF", "#140F33"],
    category: "Executive Summary",
    primaryFocus: "Overall operating posture",
    pdfTitle: "Operations Snapshot Report",
  },
  {
    id: "endpointCoverage",
    code: "OPS-02",
    title: "Endpoint & Geolocation Coverage",
    shortTitle: "Endpoint Coverage",
    subtitle: "Managed devices, online status and location coverage.",
    description: "Focused report for endpoint fleet coverage, online/offline/stale state and geolocation detection.",
    accent: "#0891B2",
    tone: "cyan",
    gradient: ["#17A6C4", "#0E7490", "#0B1D2E"],
    category: "Endpoint Management",
    primaryFocus: "Device coverage and location visibility",
    pdfTitle: "Endpoint & Geolocation Coverage Report",
  },
  {
    id: "serviceDesk",
    code: "OPS-03",
    title: "Service Desk & SLA Summary",
    shortTitle: "Service Desk",
    subtitle: "Ticket workload, closure and SLA exposure.",
    description: "Short report for ticket workload, open/closed status and SLA exceeded items requiring follow-up.",
    accent: "#C45A2B",
    tone: "amber",
    gradient: ["#F0973A", "#C2620F", "#2B1608"],
    category: "Support Operations",
    primaryFocus: "Ticket workload and SLA exposure",
    pdfTitle: "Service Desk & SLA Summary Report",
  },
];

export function getMobileReportById(id: unknown) {
  const reportId = String(id || "");
  return MOBILE_REPORTS.find((report) => report.id === reportId) || MOBILE_REPORTS[0];
}
