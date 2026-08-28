import { Platform } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { StorageAccessFramework, readAsStringAsync, EncodingType } from "expo-file-system/legacy";

import type { MobileOpsSnapshot } from "./opsMobileService";
import type { MobileReportTemplate } from "../config/mobileReports";

export type MobileReportSaveResult = {
  saved: boolean;
  cancelled?: boolean;
  error?: string;
};

function esc(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function number(value: unknown) {
  const parsed = Number(value || 0);
  if (!Number.isFinite(parsed)) return "0";
  return new Intl.NumberFormat().format(parsed);
}

function pct(value: number) {
  return `${Math.max(0, Math.min(Math.round(value || 0), 100))}%`;
}

function onlineRate(snapshot: MobileOpsSnapshot) {
  if (!snapshot.endpoints.total) return 0;
  return (snapshot.endpoints.online / snapshot.endpoints.total) * 100;
}

function geolocationRate(snapshot: MobileOpsSnapshot) {
  if (!snapshot.endpoints.total) return 0;
  return (snapshot.locationTotal / snapshot.endpoints.total) * 100;
}

function riskTone(value: number, highThreshold: number, mediumThreshold: number) {
  if (value >= highThreshold) return "High";
  if (value >= mediumThreshold) return "Medium";
  return "Low";
}

function buildInsights(report: MobileReportTemplate, snapshot: MobileOpsSnapshot) {
  const online = Math.round(onlineRate(snapshot));
  const geo = Math.round(geolocationRate(snapshot));
  const attention = snapshot.endpoints.offline + snapshot.endpoints.stale + snapshot.tickets.slaExceeded;

  if (report.id === "endpointCoverage") {
    return [
      `Endpoint inventory contains ${number(snapshot.endpoints.total)} managed devices with ${number(snapshot.endpoints.online)} currently online.`,
      `${number(snapshot.endpoints.offline)} devices are offline and ${number(snapshot.endpoints.stale)} devices have stale telemetry.`,
      `Geolocation coverage is ${pct(geo)}, based on ${number(snapshot.locationTotal)} devices with detected latest location.`,
    ];
  }

  if (report.id === "serviceDesk") {
    return [
      `Service Desk currently has ${number(snapshot.tickets.open)} open tickets and ${number(snapshot.tickets.closed)} closed tickets.`,
      `${number(snapshot.tickets.slaExceeded)} tickets have exceeded SLA and should be reviewed first.`,
      `SLA achievement is recorded at ${pct(snapshot.tickets.slaAchievement)} for the current mobile snapshot.`,
    ];
  }

  return [
    `Overall attention queue is ${number(attention)}, combining offline devices, stale devices and SLA exceeded tickets.`,
    `Endpoint online coverage is ${pct(online)} across ${number(snapshot.endpoints.total)} managed devices.`,
    `Geolocation visibility covers ${number(snapshot.locationTotal)} devices and report data was generated at ${esc(snapshot.generatedAt)}.`,
  ];
}

function buildActions(report: MobileReportTemplate) {
  if (report.id === "endpointCoverage") {
    return [
      "Validate offline endpoints by branch before escalating to field support.",
      "Review stale devices and confirm whether agent telemetry is delayed or device is inactive.",
      "Prioritise branches with missing geolocation records for device check-in validation.",
    ];
  }

  if (report.id === "serviceDesk") {
    return [
      "Review SLA exceeded tickets first and update owner or escalation status.",
      "Compare open and closed workload daily to confirm support team throughput.",
      "Use ticket trend as a lightweight indicator of operational pressure.",
    ];
  }

  return [
    "Start with offline endpoints because they reduce operational visibility.",
    "Review stale endpoint telemetry to separate inactive devices from reporting issues.",
    "Use geolocation coverage to confirm location visibility by branch.",
  ];
}

// Each report has a distinct focus (see report.primaryFocus), so these
// tables must actually differ per report — otherwise every generated PDF
// shows the exact same Executive Metrics / Coverage Breakdown regardless
// of which report the user picked.
function metricRows(report: MobileReportTemplate, snapshot: MobileOpsSnapshot, attention: number) {
  if (report.id === "endpointCoverage") {
    const geo = Math.round(geolocationRate(snapshot));
    return [
      ["Total Managed Endpoints", number(snapshot.endpoints.total), "All hardware inventory assets included in mobile snapshot."],
      ["Online Devices", number(snapshot.endpoints.online), `${pct(onlineRate(snapshot))} online coverage.`],
      ["Offline Devices", number(snapshot.endpoints.offline), "Devices not reporting or disconnected."],
      ["Stale Devices (7+ days)", number(snapshot.endpoints.stale), "No check-in for over 7 days."],
      ["Geolocation Detected", number(snapshot.locationTotal), `${pct(geo)} of managed endpoints.`],
    ];
  }

  if (report.id === "serviceDesk") {
    return [
      ["Open Tickets", number(snapshot.tickets.open), "Tickets still requiring support action."],
      ["Closed Tickets", number(snapshot.tickets.closed), "Resolved tickets in the current snapshot."],
      ["SLA Exceeded", number(snapshot.tickets.slaExceeded), "Tickets requiring SLA follow-up."],
      ["SLA Achievement", pct(snapshot.tickets.slaAchievement), "Share of tickets resolved within SLA."],
    ];
  }

  return [
    ["Total Managed Endpoints", number(snapshot.endpoints.total), "All hardware inventory assets included in mobile snapshot."],
    ["Online Devices", number(snapshot.endpoints.online), `${pct(onlineRate(snapshot))} online coverage.`],
    ["Offline Devices", number(snapshot.endpoints.offline), "Devices not reporting or disconnected."],
    ["Stale Devices", number(snapshot.endpoints.stale), "Devices with no check-in for 7+ days."],
    ["Open Tickets", number(snapshot.tickets.open), "Tickets still requiring support action."],
    ["Closed Tickets", number(snapshot.tickets.closed), "Resolved tickets in the current snapshot."],
    ["SLA Exceeded", number(snapshot.tickets.slaExceeded), "Tickets requiring SLA follow-up."],
    ["Attention Queue", number(attention), "Offline + stale + SLA exceeded items."],
  ];
}

function breakdownRows(report: MobileReportTemplate, snapshot: MobileOpsSnapshot, attention: number) {
  const geo = Math.round(geolocationRate(snapshot));
  const online = Math.round(onlineRate(snapshot));
  const notDetected = Math.max(snapshot.endpoints.total - snapshot.locationTotal, 0);

  if (report.id === "endpointCoverage") {
    return [
      ["Endpoint Online Coverage", pct(online), `${number(snapshot.endpoints.online)} online from ${number(snapshot.endpoints.total)} managed endpoints.`],
      ["Geolocation Detected", number(snapshot.locationTotal), `${pct(geo)} coverage; ${number(notDetected)} devices not detected.`],
      ["Offline Devices", number(snapshot.endpoints.offline), "Not connected right now."],
      ["Stale Devices (7+ days)", number(snapshot.endpoints.stale), "May be idle, offline, or not syncing."],
    ];
  }

  if (report.id === "serviceDesk") {
    return [
      ["Ticket SLA Achievement", pct(snapshot.tickets.slaAchievement), `${number(snapshot.tickets.slaExceeded)} SLA exceeded tickets.`],
      ["Open vs Closed", `${number(snapshot.tickets.open)} / ${number(snapshot.tickets.closed)}`, "Open tickets vs closed tickets in current snapshot."],
      ["SLA Exceeded Ratio", pct(snapshot.tickets.open ? (snapshot.tickets.slaExceeded / snapshot.tickets.open) * 100 : 0), "Share of open tickets that have exceeded SLA."],
    ];
  }

  return [
    ["Endpoint Online Coverage", pct(online), `${number(snapshot.endpoints.online)} online from ${number(snapshot.endpoints.total)} managed endpoints.`],
    ["Geolocation Detected", number(snapshot.locationTotal), `${pct(geo)} coverage; ${number(notDetected)} devices not detected.`],
    ["Ticket SLA Achievement", pct(snapshot.tickets.slaAchievement), `${number(snapshot.tickets.slaExceeded)} SLA exceeded tickets.`],
    ["Current Attention Level", riskTone(attention, 50, 10), "Calculated from endpoint and service desk exposure."],
  ];
}

function tableRows(rows: string[][]) {
  return rows
    .map(
      ([a, b, c]) => `
        <tr>
          <td>${esc(a)}</td>
          <td class="metric-value">${esc(b)}</td>
          <td>${esc(c)}</td>
        </tr>`
    )
    .join("");
}

function listRows(rows: string[]) {
  return rows
    .map(
      (item, index) => `
        <tr>
          <td class="num">${index + 1}</td>
          <td>${esc(item)}</td>
        </tr>`
    )
    .join("");
}

export function buildMobileReportHtml(report: MobileReportTemplate, snapshot: MobileOpsSnapshot) {
  const attention = snapshot.endpoints.offline + snapshot.endpoints.stale + snapshot.tickets.slaExceeded;
  const insights = buildInsights(report, snapshot);
  const actions = buildActions(report);
  const generated = esc(snapshot.generatedAt);

  return `
<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  @page { size: A4; margin: 18mm 16mm 16mm; }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: Arial, Helvetica, sans-serif;
    color: #111827;
    background: #ffffff;
    font-size: 11px;
    line-height: 1.45;
  }
  .document { width: 100%; }
  .letterhead {
    border-bottom: 2px solid #111827;
    padding-bottom: 12px;
    margin-bottom: 18px;
    display: table;
    width: 100%;
  }
  .brand, .doc-meta { display: table-cell; vertical-align: top; }
  .brand-title { font-size: 20px; font-weight: 900; letter-spacing: -0.3px; }
  .brand-sub { margin-top: 3px; color: #475467; font-weight: 700; }
  .doc-meta { text-align: right; color: #475467; font-size: 10px; }
  .doc-code { color: ${report.accent}; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; }
  h1 { margin: 0 0 6px; font-size: 26px; line-height: 1.08; letter-spacing: -0.8px; }
  .summary { color: #475467; font-size: 12px; max-width: 620px; margin-bottom: 16px; }
  .meta-grid {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 16px;
    border: 1px solid #d0d5dd;
  }
  .meta-grid td {
    padding: 8px 10px;
    border: 1px solid #d0d5dd;
    vertical-align: top;
  }
  .meta-label { color: #667085; font-weight: 900; text-transform: uppercase; font-size: 9px; letter-spacing: .5px; }
  .meta-value { margin-top: 2px; font-weight: 800; color: #111827; }
  .section-title {
    margin: 18px 0 8px;
    padding: 7px 9px;
    background: #f2f4f7;
    border-left: 4px solid ${report.accent};
    font-size: 13px;
    font-weight: 900;
    text-transform: uppercase;
    letter-spacing: .4px;
  }
  table.report-table {
    width: 100%;
    border-collapse: collapse;
    border: 1px solid #d0d5dd;
    margin-bottom: 12px;
  }
  .report-table th {
    background: #111827;
    color: #ffffff;
    text-align: left;
    padding: 8px 9px;
    font-size: 10px;
    letter-spacing: .3px;
    text-transform: uppercase;
  }
  .report-table td {
    padding: 8px 9px;
    border: 1px solid #d0d5dd;
    vertical-align: top;
  }
  .report-table tr:nth-child(even) td { background: #f9fafb; }
  .metric-value { font-size: 15px; font-weight: 900; color: ${report.accent}; white-space: nowrap; }
  .num {
    width: 34px;
    text-align: center;
    font-weight: 900;
    color: ${report.accent};
  }
  .note {
    border: 1px solid #d0d5dd;
    background: #fcfcfd;
    padding: 10px 12px;
    color: #344054;
    margin-top: 6px;
  }
  .footer {
    margin-top: 22px;
    padding-top: 9px;
    border-top: 1px solid #d0d5dd;
    color: #667085;
    font-size: 9px;
    display: table;
    width: 100%;
  }
  .footer span { display: table-cell; }
  .footer .right { text-align: right; }
</style>
</head>
<body>
  <main class="document">
    <header class="letterhead">
      <div class="brand">
        <div class="brand-title">EMA Operational Dashboard</div>
        <div class="brand-sub">Operational reporting generated from live mobile snapshot</div>
      </div>
      <div class="doc-meta">
        <div class="doc-code">${esc(report.code)} · ${esc(report.category)}</div>
        <div>Generated: ${generated}</div>
      </div>
    </header>

    <section>
      <h1>${esc(report.pdfTitle)}</h1>
      <div class="summary">${esc(report.description)}</div>
      <table class="meta-grid">
        <tr>
          <td><div class="meta-label">Report Type</div><div class="meta-value">${esc(report.category)}</div></td>
          <td><div class="meta-label">Primary Focus</div><div class="meta-value">${esc(report.primaryFocus)}</div></td>
          <td><div class="meta-label">Snapshot Range</div><div class="meta-value">${esc(snapshot.rangeLabel || "Current Snapshot")}</div></td>
        </tr>
      </table>
    </section>

    <div class="section-title">Executive Metrics</div>
    <table class="report-table">
      <thead><tr><th>Metric</th><th>Value</th><th>Interpretation</th></tr></thead>
      <tbody>${tableRows(metricRows(report, snapshot, attention))}</tbody>
    </table>

    <div class="section-title">Coverage Breakdown</div>
    <table class="report-table">
      <thead><tr><th>Area</th><th>Result</th><th>Details</th></tr></thead>
      <tbody>${tableRows(breakdownRows(report, snapshot, attention))}</tbody>
    </table>

    <div class="section-title">Key Findings</div>
    <table class="report-table">
      <thead><tr><th>No.</th><th>Finding</th></tr></thead>
      <tbody>${listRows(insights)}</tbody>
    </table>

    <div class="section-title">Recommended Actions</div>
    <table class="report-table">
      <thead><tr><th>No.</th><th>Action</th></tr></thead>
      <tbody>${listRows(actions)}</tbody>
    </table>

    <div class="note">
      This PDF is intended as a concise operational report for mobile review. Detailed device inventory, ticket drilldown, and branch-level investigation remain available through the relevant operational screens.
    </div>

    <footer class="footer">
      <span>EMA Operational Dashboard · ${esc(report.shortTitle)}</span>
      <span class="right">Generated from live snapshot</span>
    </footer>
  </main>
</body>
</html>`;
}

// Generates the PDF only — does not share or save it anywhere. The file
// lands in the app's private cache, so callers must explicitly save or
// share it for the user to be able to access it afterward.
export async function generateMobileReportPdf(
  report: MobileReportTemplate,
  snapshot: MobileOpsSnapshot
): Promise<{ uri: string; fileName: string }> {
  const html = buildMobileReportHtml(report, snapshot);
  const result = await Print.printToFileAsync({ html, base64: false });
  const fileName = `${report.shortTitle.replace(/[^a-z0-9]+/gi, "-")}-report.pdf`;
  return { uri: result.uri, fileName };
}

// Opens the OS share sheet for the generated PDF (send via WhatsApp, email,
// AirDrop, etc.). This is a secondary action, not the only way to get the file.
export async function shareMobileReportPdf(
  uri: string,
  report: MobileReportTemplate
): Promise<{ shared: boolean; shareError?: string }> {
  try {
    if (!(await Sharing.isAvailableAsync())) {
      return { shared: false, shareError: "Sharing is not available on this device." };
    }

    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      dialogTitle: report.pdfTitle,
      UTI: "com.adobe.pdf",
    });
    return { shared: true };
  } catch (err) {
    return {
      shared: false,
      shareError: err instanceof Error ? err.message : String(err || "Sharing failed."),
    };
  }
}

// Saves the PDF directly to a folder the user picks (e.g. Downloads) via
// Android's Storage Access Framework — no share sheet involved. iOS has no
// equivalent direct-to-folder API in a managed app, so callers should fall
// back to shareMobileReportPdf() there (the iOS share sheet's "Save to
// Files" is the closest equivalent to a download on that platform).
export async function saveMobileReportPdfToDevice(
  uri: string,
  fileName: string
): Promise<MobileReportSaveResult> {
  if (Platform.OS !== "android") {
    return { saved: false, error: "Direct save is only available on Android on this device." };
  }

  try {
    const downloadsHint = StorageAccessFramework.getUriForDirectoryInRoot("Download");
    const permissions = await StorageAccessFramework.requestDirectoryPermissionsAsync(downloadsHint);

    if (!permissions.granted) {
      return { saved: false, cancelled: true };
    }

    const base64 = await readAsStringAsync(uri, { encoding: EncodingType.Base64 });
    const destinationUri = await StorageAccessFramework.createFileAsync(
      permissions.directoryUri,
      fileName.replace(/\.pdf$/i, ""),
      "application/pdf"
    );

    await StorageAccessFramework.writeAsStringAsync(destinationUri, base64, {
      encoding: EncodingType.Base64,
    });

    return { saved: true };
  } catch (err) {
    return {
      saved: false,
      error: err instanceof Error ? err.message : String(err || "Failed to save PDF to device."),
    };
  }
}
