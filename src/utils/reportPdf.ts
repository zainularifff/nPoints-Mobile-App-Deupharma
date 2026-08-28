import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

type ReportSection = {
  title: string;
  statement: string;
};

type PdfMetric = {
  label: string;
  value: string;
  note: string;
};

type PdfFinding = {
  area: string;
  statement: string;
};

type PdfColumn = {
  key: string;
  label: string;
};

type PdfDetailTable = {
  title: string;
  description: string;
  columns: PdfColumn[];
  rows: Record<string, string>[];
};

export type ReportPdfPayload = {
  id: string;
  title: string;
  description: string;
  category: string;
  frequency: string;
  lastGenerated: string;
  pages: number;
  status: string;
  sections: ReportSection[];
  metrics: PdfMetric[];
  findings: PdfFinding[];
  detailTable: PdfDetailTable;
};

function escapeHtml(value: string | number | boolean | null | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildMetricCards(report: ReportPdfPayload) {
  if (!report.metrics || report.metrics.length === 0) {
    return `<div class="empty-card">No metric data available for this report.</div>`;
  }

  return report.metrics
    .map(
      (item: PdfMetric) => `
        <div class="metric-card">
          <div class="metric-value">${escapeHtml(item.value)}</div>
          <div class="metric-label">${escapeHtml(item.label)}</div>
          <div class="metric-note">${escapeHtml(item.note)}</div>
        </div>
      `
    )
    .join("");
}

function buildFindings(report: ReportPdfPayload) {
  if (!report.findings || report.findings.length === 0) {
    return `<div class="empty-card">No key findings available for this report.</div>`;
  }

  return report.findings
    .map(
      (item: PdfFinding) => `
        <div class="finding-card">
          <div class="finding-area">${escapeHtml(item.area)}</div>
          <div class="finding-statement">${escapeHtml(item.statement)}</div>
        </div>
      `
    )
    .join("");
}

function buildSections(report: ReportPdfPayload) {
  if (!report.sections || report.sections.length === 0) {
    return `<div class="empty-card">No report sections available.</div>`;
  }

  return report.sections
    .map(
      (section: ReportSection, index: number) => `
        <div class="section-card">
          <div class="section-index">${index + 1}</div>
          <div class="section-content">
            <h3>${escapeHtml(section.title)}</h3>
            <p>${escapeHtml(section.statement)}</p>
          </div>
        </div>
      `
    )
    .join("");
}

function buildDetailRecords(report: ReportPdfPayload) {
  if (
    !report.detailTable ||
    !report.detailTable.columns ||
    !report.detailTable.rows ||
    report.detailTable.columns.length === 0 ||
    report.detailTable.rows.length === 0
  ) {
    return `
      <div class="block">
        <h2>Selected Detail Records</h2>
        <p class="block-desc">No detail records available for this report.</p>
      </div>
    `;
  }

  const columns: PdfColumn[] = report.detailTable.columns;
  const rows: Record<string, string>[] = report.detailTable.rows;

  const recordCards = rows
    .map((row: Record<string, string>, rowIndex: number) => {
      const fields = columns
        .map((column: PdfColumn) => {
          const value = row[column.key] ?? "-";

          return `
            <div class="record-field">
              <div class="record-field-label">${escapeHtml(column.label)}</div>
              <div class="record-field-value">${escapeHtml(value)}</div>
            </div>
          `;
        })
        .join("");

      return `
        <div class="record-card">
          <div class="record-header">
            <div class="record-number">${rowIndex + 1}</div>
            <div>
              <div class="record-title">Record ${rowIndex + 1}</div>
              <div class="record-subtitle">Selected report detail item</div>
            </div>
          </div>

          <div class="record-grid">
            ${fields}
          </div>
        </div>
      `;
    })
    .join("");

  return `
    <div class="block">
      <h2>${escapeHtml(report.detailTable.title)}</h2>
      <p class="block-desc">${escapeHtml(report.detailTable.description)}</p>
      ${recordCards}
    </div>
  `;
}

function getSharedPdfCss() {
  return `
    @page {
      size: A4;
      margin: 26px;
    }

    * {
      box-sizing: border-box;
    }

    body {
      margin: 0;
      padding: 0;
      font-family: Arial, Helvetica, sans-serif;
      background: #ffffff;
      color: #172033;
    }

    .cover,
    .bundle-cover {
      background: #071120;
      color: #ffffff;
      border-radius: 24px;
      padding: 30px;
      margin-bottom: 18px;
    }

    .brand-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }

    .brand {
      font-size: 12px;
      font-weight: 900;
      letter-spacing: 1.6px;
      color: #AFC0D6;
    }

    .badge,
    .status-badge {
      background: rgba(255,255,255,0.16);
      border: 1px solid rgba(255,255,255,0.24);
      padding: 8px 12px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 900;
      color: #ffffff;
    }

    .report-id {
      font-size: 12px;
      font-weight: 900;
      color: #1E5BFF;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }

    .cover .report-id {
      color: #8FB4FF;
    }

    h1 {
      margin: 0;
      font-size: 30px;
      line-height: 1.15;
      letter-spacing: -0.5px;
    }

    .desc,
    .bundle-desc {
      margin-top: 12px;
      color: #C8D5E6;
      font-size: 13px;
      line-height: 1.6;
      max-width: 680px;
    }

    .meta-row {
      display: flex;
      gap: 10px;
      margin-bottom: 10px;
    }

    .meta-card {
      flex: 1;
      background: #F5F7FB;
      border: 1px solid #E3E8F0;
      border-radius: 16px;
      padding: 13px;
    }

    .meta-label {
      font-size: 10px;
      font-weight: 900;
      color: #6B7890;
      margin-bottom: 5px;
    }

    .meta-value {
      font-size: 12px;
      font-weight: 900;
      color: #172033;
      line-height: 1.35;
    }

    .block {
      border: 1px solid #E3E8F0;
      border-radius: 20px;
      padding: 18px;
      margin-bottom: 18px;
      page-break-inside: avoid;
    }

    .block h2 {
      font-size: 18px;
      font-weight: 900;
      margin: 0 0 8px 0;
      color: #172033;
    }

    .block-desc {
      font-size: 12px;
      color: #526071;
      line-height: 1.6;
      margin: 0 0 14px 0;
    }

    .metric-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .metric-card {
      width: 48.5%;
      background: #F5F7FB;
      border: 1px solid #E3E8F0;
      border-radius: 16px;
      padding: 14px;
      min-height: 94px;
    }

    .metric-value {
      font-size: 22px;
      font-weight: 900;
      color: #1E5BFF;
      margin-bottom: 5px;
    }

    .metric-label {
      font-size: 11px;
      font-weight: 900;
      color: #172033;
    }

    .metric-note {
      font-size: 10px;
      line-height: 1.35;
      color: #6B7890;
      margin-top: 5px;
    }

    .finding-card,
    .section-card,
    .record-card {
      border: 1px solid #E3E8F0;
      border-radius: 16px;
      padding: 14px;
      margin-bottom: 10px;
      page-break-inside: avoid;
    }

    .finding-area {
      font-size: 12px;
      font-weight: 900;
      color: #1E5BFF;
      margin-bottom: 6px;
    }

    .finding-statement,
    .section-content p {
      font-size: 12px;
      color: #526071;
      line-height: 1.55;
      margin: 0;
    }

    .section-card {
      display: flex;
    }

    .section-index,
    .record-number {
      width: 34px;
      height: 34px;
      border-radius: 12px;
      background: #EAF1FF;
      color: #1E5BFF;
      font-size: 13px;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 10px;
      flex-shrink: 0;
    }

    .section-content h3 {
      margin: 0 0 5px 0;
      font-size: 14px;
      font-weight: 900;
      color: #172033;
    }

    .record-header {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
    }

    .record-title {
      font-size: 13px;
      font-weight: 900;
      color: #172033;
    }

    .record-subtitle {
      font-size: 10px;
      font-weight: 800;
      color: #6B7890;
      margin-top: 2px;
    }

    .record-grid {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .record-field {
      width: 48.7%;
      background: #F8FAFC;
      border: 1px solid #E3E8F0;
      border-radius: 12px;
      padding: 10px;
    }

    .record-field-label {
      color: #6B7890;
      font-size: 9px;
      font-weight: 900;
      margin-bottom: 4px;
    }

    .record-field-value {
      color: #172033;
      font-size: 11px;
      font-weight: 900;
      line-height: 1.35;
    }

    .empty-card {
      background: #F8FAFC;
      border: 1px dashed #D7E0EA;
      border-radius: 16px;
      padding: 14px;
      color: #6B7890;
      font-size: 12px;
      font-weight: 800;
    }

    .footer {
      margin-top: 18px;
      padding-top: 12px;
      border-top: 1px solid #E3E8F0;
      font-size: 10px;
      color: #7B8797;
      display: flex;
      justify-content: space-between;
    }

    .page-break {
      page-break-before: always;
    }

    .report-header {
      background: #F5F7FB;
      border: 1px solid #E3E8F0;
      border-radius: 22px;
      padding: 20px;
      margin-bottom: 14px;
      display: flex;
      justify-content: space-between;
      gap: 14px;
    }

    .report-header h1 {
      color: #172033;
      font-size: 24px;
    }

    .report-header p {
      color: #526071;
      font-size: 12px;
      line-height: 1.55;
      margin: 8px 0 0 0;
    }

    .report-header .status-badge {
      height: 30px;
      background: #EAF1FF;
      color: #1E5BFF;
      border: 0;
      white-space: nowrap;
    }

    .bundle-summary {
      display: flex;
      gap: 10px;
      margin-top: 22px;
    }

    .bundle-card {
      flex: 1;
      background: rgba(255,255,255,0.12);
      border: 1px solid rgba(255,255,255,0.18);
      border-radius: 16px;
      padding: 14px;
    }

    .bundle-value {
      font-size: 22px;
      font-weight: 900;
    }

    .bundle-label {
      font-size: 11px;
      font-weight: 800;
      color: #AFC0D6;
      margin-top: 4px;
    }
  `;
}

export function buildReportHtml(report: ReportPdfPayload) {
  const generatedAt = new Date().toLocaleString();

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>${getSharedPdfCss()}</style>
      </head>

      <body>
        <div class="cover">
          <div class="brand-row">
            <div class="brand">EMA OPERATIONAL DASHBOARD</div>
            <div class="badge">${escapeHtml(report.status)}</div>
          </div>

          <div class="report-id">${escapeHtml(report.id)}</div>
          <h1>${escapeHtml(report.title)}</h1>
          <p class="desc">${escapeHtml(report.description)}</p>
        </div>

        <div class="meta-row">
          <div class="meta-card">
            <div class="meta-label">Category</div>
            <div class="meta-value">${escapeHtml(report.category)}</div>
          </div>

          <div class="meta-card">
            <div class="meta-label">Frequency</div>
            <div class="meta-value">${escapeHtml(report.frequency)}</div>
          </div>
        </div>

        <div class="meta-row">
          <div class="meta-card">
            <div class="meta-label">Last Generated</div>
            <div class="meta-value">${escapeHtml(report.lastGenerated)}</div>
          </div>

          <div class="meta-card">
            <div class="meta-label">Pages</div>
            <div class="meta-value">${escapeHtml(report.pages)} pages</div>
          </div>
        </div>

        <div class="block">
          <h2>KPI Summary</h2>
          <p class="block-desc">
            This section displays report-specific summary indicators based on
            the selected report type.
          </p>

          <div class="metric-wrap">
            ${buildMetricCards(report)}
          </div>
        </div>

        <div class="block">
          <h2>Key Findings</h2>
          <p class="block-desc">
            Findings are generated from the selected report context.
          </p>

          ${buildFindings(report)}
        </div>

        ${buildDetailRecords(report)}

        <div class="block">
          <h2>Report Sections</h2>
          <p class="block-desc">
            These sections represent the expected structure of the generated report.
          </p>

          ${buildSections(report)}
        </div>

        <div class="footer">
          <div>Generated by EMA Operational Dashboard</div>
          <div>${escapeHtml(generatedAt)}</div>
        </div>
      </body>
    </html>
  `;
}

function buildReportsBundleHtml(reports: ReportPdfPayload[]) {
  const generatedAt = new Date().toLocaleString();

  const reportBlocks = reports
    .map(
      (report: ReportPdfPayload, index: number) => `
        <div class="${index > 0 ? "page-break" : ""}">
          <div class="report-header">
            <div>
              <div class="report-id">${escapeHtml(report.id)}</div>
              <h1>${escapeHtml(report.title)}</h1>
              <p>${escapeHtml(report.description)}</p>
            </div>

            <div class="status-badge">${escapeHtml(report.status)}</div>
          </div>

          <div class="meta-row">
            <div class="meta-card">
              <div class="meta-label">Category</div>
              <div class="meta-value">${escapeHtml(report.category)}</div>
            </div>

            <div class="meta-card">
              <div class="meta-label">Frequency</div>
              <div class="meta-value">${escapeHtml(report.frequency)}</div>
            </div>

            <div class="meta-card">
              <div class="meta-label">Generated</div>
              <div class="meta-value">${escapeHtml(report.lastGenerated)}</div>
            </div>
          </div>

          <div class="block">
            <h2>KPI Summary</h2>
            <div class="metric-wrap">
              ${buildMetricCards(report)}
            </div>
          </div>

          <div class="block">
            <h2>Key Findings</h2>
            ${buildFindings(report)}
          </div>

          ${buildDetailRecords(report)}

          <div class="block">
            <h2>Report Sections</h2>
            ${buildSections(report)}
          </div>
        </div>
      `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <style>${getSharedPdfCss()}</style>
      </head>

      <body>
        <div class="bundle-cover">
          <div class="brand">EMA OPERATIONAL DASHBOARD</div>
          <h1>All Reports Bundle</h1>
          <p class="bundle-desc">
            Combined operational report summary generated from the mobile reporting module.
            This PDF includes all selected report categories with KPI summary, findings and selected detail records.
          </p>

          <div class="bundle-summary">
            <div class="bundle-card">
              <div class="bundle-value">${reports.length}</div>
              <div class="bundle-label">Reports Included</div>
            </div>

            <div class="bundle-card">
              <div class="bundle-value">${escapeHtml(generatedAt)}</div>
              <div class="bundle-label">Generated At</div>
            </div>
          </div>
        </div>

        ${reportBlocks}

        <div class="footer">
          <div>Generated by EMA Operational Dashboard</div>
          <div>${escapeHtml(generatedAt)}</div>
        </div>
      </body>
    </html>
  `;
}

export async function generateAndShareReportPdf(report: ReportPdfPayload) {
  const html = buildReportHtml(report);

  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });

  const canShare = await Sharing.isAvailableAsync();

  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      UTI: "com.adobe.pdf",
      dialogTitle: report.title,
    });
  }

  return uri;
}

export async function generateAndShareReportsBundlePdf(
  reports: ReportPdfPayload[]
) {
  const html = buildReportsBundleHtml(reports);

  const { uri } = await Print.printToFileAsync({
    html,
    base64: false,
  });

  const canShare = await Sharing.isAvailableAsync();

  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: "application/pdf",
      UTI: "com.adobe.pdf",
      dialogTitle: "All Reports Bundle",
    });
  }

  return uri;
}