import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  Gauge,
  Laptop,
  MapPin,
  Share2,
  Ticket,
  TriangleAlert,
  Wifi,
  WifiOff,
} from "lucide-react-native";

import { getMobileReportById, type MobileReportTemplate } from "../../config/mobileReports";
import { useMobileOpsSnapshot } from "../../hooks/useLiveOpsData";
import { fetchGeolocationSummary } from "../../services/opsMobileService";
import {
  generateMobileReportPdf,
  saveMobileReportPdfToDevice,
  shareMobileReportPdf,
} from "../../services/mobileReportPdf";
import { cardShadow, colors, tones } from "../../theme/colors";
import { radius } from "../../theme/spacing";
import { formatNumber } from "../../utils/formatters";

type ReportContext = {
  snapshot: ReturnType<typeof useMobileOpsSnapshot>["snapshot"];
  onlineRate: number;
  geolocationRate: number;
  attention: number;
};

type ReportKpi = { icon: any; tone: keyof typeof tones; label: string; value: number; suffix?: string };

// Each report has a distinct focus (see mobileReports.ts primaryFocus), so
// the KPI grid, insights and breakdown must actually differ per report —
// otherwise every report screen just shows the same generic snapshot.
function getReportKpis(report: MobileReportTemplate, ctx: ReportContext): ReportKpi[] {
  const { snapshot, geolocationRate, attention } = ctx;

  if (report.id === "endpointCoverage") {
    return [
      { icon: Laptop, tone: "blue", label: "Endpoints", value: snapshot.endpoints.total },
      { icon: Wifi, tone: "green", label: "Online", value: snapshot.endpoints.online },
      { icon: WifiOff, tone: "red", label: "Offline", value: snapshot.endpoints.offline },
      { icon: MapPin, tone: "cyan", label: "Geo Coverage", value: geolocationRate, suffix: "%" },
    ];
  }

  if (report.id === "serviceDesk") {
    return [
      { icon: Ticket, tone: "blue", label: "Open Tickets", value: snapshot.tickets.open },
      { icon: CheckCircle2, tone: "green", label: "Closed", value: snapshot.tickets.closed },
      { icon: TriangleAlert, tone: "red", label: "SLA Exceeded", value: snapshot.tickets.slaExceeded },
      { icon: Gauge, tone: "purple", label: "SLA Achievement", value: Math.max(0, Math.min(snapshot.tickets.slaAchievement || 0, 100)), suffix: "%" },
    ];
  }

  return [
    { icon: Laptop, tone: "blue", label: "Endpoints", value: snapshot.endpoints.total },
    { icon: Wifi, tone: "green", label: "Online", value: snapshot.endpoints.online },
    { icon: Ticket, tone: "purple", label: "Open Tickets", value: snapshot.tickets.open },
    { icon: TriangleAlert, tone: "red", label: "Attention", value: attention },
  ];
}

function getReportInsights(report: MobileReportTemplate, ctx: ReportContext): string[] {
  const { snapshot, onlineRate, geolocationRate } = ctx;

  if (report.id === "endpointCoverage") {
    return [
      `Online coverage is ${onlineRate}% across ${formatNumber(snapshot.endpoints.total)} managed endpoints.`,
      `${formatNumber(snapshot.endpoints.offline)} device(s) are offline and ${formatNumber(snapshot.endpoints.stale)} have no check-in for 7+ days.`,
      `Geolocation coverage is ${geolocationRate}% from ${formatNumber(snapshot.locationTotal)} detected devices.`,
    ];
  }

  if (report.id === "serviceDesk") {
    return [
      `Service desk currently has ${formatNumber(snapshot.tickets.open)} open ticket(s) and ${formatNumber(snapshot.tickets.closed)} closed.`,
      `${formatNumber(snapshot.tickets.slaExceeded)} ticket(s) have exceeded SLA and require review.`,
      `SLA achievement is recorded at ${Math.max(0, Math.min(snapshot.tickets.slaAchievement || 0, 100))}% for the current snapshot.`,
    ];
  }

  return [
    `Online coverage is ${onlineRate}% across ${formatNumber(snapshot.endpoints.total)} managed endpoints.`,
    `Geolocation coverage is ${geolocationRate}% from ${formatNumber(snapshot.locationTotal)} detected devices.`,
    `${formatNumber(snapshot.tickets.slaExceeded)} ticket(s) have exceeded SLA and require review.`,
  ];
}

function getReportBreakdown(report: MobileReportTemplate, ctx: ReportContext) {
  const { snapshot } = ctx;

  if (report.id === "endpointCoverage") {
    return [
      { label: "Offline devices", value: formatNumber(snapshot.endpoints.offline), tone: colors.red },
      { label: "No check-in 7+ days", value: formatNumber(snapshot.endpoints.stale), tone: colors.amber },
      { label: "Devices with location", value: formatNumber(snapshot.locationTotal), tone: colors.green },
      { label: "Total managed endpoints", value: formatNumber(snapshot.endpoints.total), tone: colors.blueBright },
    ];
  }

  if (report.id === "serviceDesk") {
    return [
      { label: "Open tickets", value: formatNumber(snapshot.tickets.open), tone: colors.blueBright },
      { label: "Closed tickets", value: formatNumber(snapshot.tickets.closed), tone: colors.green },
      { label: "SLA exceeded", value: formatNumber(snapshot.tickets.slaExceeded), tone: colors.red },
      { label: "SLA achievement", value: `${Math.max(0, Math.min(snapshot.tickets.slaAchievement || 0, 100))}%`, tone: colors.amber },
    ];
  }

  return [
    { label: "Offline devices", value: formatNumber(snapshot.endpoints.offline), tone: colors.red },
    { label: "No check-in 7+ days", value: formatNumber(snapshot.endpoints.stale), tone: colors.amber },
    { label: "Closed tickets", value: formatNumber(snapshot.tickets.closed), tone: colors.green },
    { label: "SLA achievement", value: `${Math.max(0, Math.min(snapshot.tickets.slaAchievement || 0, 100))}%`, tone: colors.blueBright },
  ];
}

export default function LiveReportScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const report = getMobileReportById(route.params?.reportId || route.params?.report?.id);
  const tone = tones[report.tone];
  const { snapshot, loading, error } = useMobileOpsSnapshot();
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [pdfUri, setPdfUri] = useState("");
  const [pdfFileName, setPdfFileName] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [pdfWarning, setPdfWarning] = useState("");
  const [pdfError, setPdfError] = useState("");
  const [geoDetected, setGeoDetected] = useState<number | null>(null);

  useEffect(() => {
    let isMounted = true;

    // snapshot.locationTotal only covers devices matched against a capped
    // location fetch — fetch the full reconciled count here (same
    // trackedDevices-backed number the Geolocation screen shows) so the
    // report never contradicts that screen.
    fetchGeolocationSummary({ endpointLimit: 1000, locationLimit: 3000 })
      .then((result) => {
        if (isMounted) setGeoDetected(result.detectedCount);
      })
      .catch(() => {
        // Falls back to snapshot.locationTotal below if this fails.
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const effectiveSnapshot = useMemo(
    () => ({
      ...snapshot,
      locationTotal: geoDetected ?? snapshot.locationTotal,
    }),
    [snapshot, geoDetected]
  );

  const onlineRate = useMemo(() => {
    if (!effectiveSnapshot.endpoints.total) return 0;
    return Math.round((effectiveSnapshot.endpoints.online / effectiveSnapshot.endpoints.total) * 100);
  }, [effectiveSnapshot.endpoints.online, effectiveSnapshot.endpoints.total]);

  const geolocationRate = useMemo(() => {
    if (!effectiveSnapshot.endpoints.total) return 0;
    return Math.round((effectiveSnapshot.locationTotal / effectiveSnapshot.endpoints.total) * 100);
  }, [effectiveSnapshot.endpoints.total, effectiveSnapshot.locationTotal]);

  const attention = effectiveSnapshot.endpoints.offline + effectiveSnapshot.endpoints.stale + effectiveSnapshot.tickets.slaExceeded;
  const reportCtx: ReportContext = { snapshot: effectiveSnapshot, onlineRate, geolocationRate, attention };
  const kpis = useMemo(() => getReportKpis(report, reportCtx), [report, effectiveSnapshot, onlineRate, geolocationRate, attention]);
  const insights = useMemo(() => getReportInsights(report, reportCtx), [report, effectiveSnapshot, onlineRate, geolocationRate]);
  const breakdown = useMemo(() => getReportBreakdown(report, reportCtx), [report, effectiveSnapshot]);

  async function ensurePdfGenerated(): Promise<{ uri: string; fileName: string } | null> {
    if (pdfUri && pdfFileName) return { uri: pdfUri, fileName: pdfFileName };
    const result = await generateMobileReportPdf(report, effectiveSnapshot);
    setPdfUri(result.uri);
    setPdfFileName(result.fileName);
    return result;
  }

  async function handleGeneratePdf() {
    setPdfError("");
    setPdfWarning("");
    setStatusMessage("");
    setGenerating(true);
    try {
      await ensurePdfGenerated();
      setStatusMessage("PDF generated. Save it to your device or share it below.");
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : String(err || "Failed to generate PDF."));
    } finally {
      setGenerating(false);
    }
  }

  async function handleSavePdf() {
    setPdfError("");
    setPdfWarning("");
    setStatusMessage("");
    setSaving(true);
    try {
      const file = await ensurePdfGenerated();
      if (!file) return;

      if (Platform.OS !== "android") {
        setPdfWarning("Direct download isn't supported on this device — use Share and pick \"Save to Files\" instead.");
        return;
      }

      const result = await saveMobileReportPdfToDevice(file.uri, file.fileName);
      if (result.saved) {
        setStatusMessage("PDF saved to the folder you selected.");
      } else if (result.cancelled) {
        setPdfWarning("Save cancelled — no folder was selected.");
      } else {
        setPdfError(result.error || "Failed to save PDF to device.");
      }
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : String(err || "Failed to save PDF."));
    } finally {
      setSaving(false);
    }
  }

  async function handleSharePdf() {
    setPdfError("");
    setPdfWarning("");
    setStatusMessage("");
    setSharing(true);
    try {
      const file = await ensurePdfGenerated();
      if (!file) return;

      const result = await shareMobileReportPdf(file.uri, report);
      if (result.shared) {
        setStatusMessage("PDF shared successfully.");
      } else if (result.shareError) {
        setPdfWarning(result.shareError);
      }
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : String(err || "Failed to share PDF."));
    } finally {
      setSharing(false);
    }
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        <TouchableOpacity style={styles.backButton} activeOpacity={0.85} onPress={() => navigation.goBack()}>
          <ArrowLeft size={19} color={colors.text} strokeWidth={2.7} />
          <Text style={styles.backText}>Reports</Text>
        </TouchableOpacity>

        <LinearGradient
          colors={report.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.coverCard}
        >
          <View style={styles.coverGlowOne} />
          <View style={styles.coverGlowTwo} />

          <View style={styles.coverTopRow}>
            <View style={styles.coverIcon}><FileText size={25} color={report.accent} strokeWidth={2.8} /></View>
            <Text style={styles.reportCode}>{report.code}</Text>
          </View>
          <Text style={styles.coverTitle}>{report.title}</Text>
          <Text style={styles.coverDesc}>{report.description}</Text>
          <View style={styles.coverPillRow}>
            <Text style={styles.coverPill}>{report.category}</Text>
            <Text style={styles.coverPill}>PDF Ready</Text>
          </View>
        </LinearGradient>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        <View style={styles.kpiGrid}>
          {kpis.map((kpi) => (
            <KpiCard
              key={kpi.label}
              icon={kpi.icon}
              tone={kpi.tone}
              label={kpi.label}
              value={kpi.value}
              suffix={kpi.suffix}
            />
          ))}
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>{report.primaryFocus}</Text>
          {insights.map((text) => (
            <Insight key={text} color={tone.text} text={text} />
          ))}
        </View>

        <View style={styles.breakdownCard}>
          <Text style={styles.sectionTitle}>Snapshot Breakdown</Text>
          {breakdown.map((row) => (
            <BreakdownRow key={row.label} label={row.label} value={row.value} tone={row.tone} />
          ))}
        </View>

        {!pdfUri ? (
          <TouchableOpacity
            style={[styles.pdfButton, { backgroundColor: report.accent, shadowColor: report.accent }]}
            activeOpacity={0.88}
            disabled={generating || loading}
            onPress={handleGeneratePdf}
          >
            {generating ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <FileText size={18} color={colors.white} strokeWidth={2.8} />
            )}
            <Text style={styles.pdfButtonText}>{generating ? "Generating PDF..." : "Generate PDF"}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.pdfActionRow}>
            <TouchableOpacity
              style={[styles.pdfButton, styles.pdfActionButton, { backgroundColor: report.accent, shadowColor: report.accent }]}
              activeOpacity={0.88}
              disabled={saving}
              onPress={handleSavePdf}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Download size={18} color={colors.white} strokeWidth={2.8} />
              )}
              <Text style={styles.pdfButtonText}>{saving ? "Saving..." : "Save to Device"}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.pdfButton, styles.pdfActionButton, styles.pdfShareButton]}
              activeOpacity={0.88}
              disabled={sharing}
              onPress={handleSharePdf}
            >
              {sharing ? (
                <ActivityIndicator size="small" color={colors.text} />
              ) : (
                <Share2 size={17} color={colors.text} strokeWidth={2.8} />
              )}
              <Text style={[styles.pdfButtonText, { color: colors.text }]}>{sharing ? "Sharing..." : "Share"}</Text>
            </TouchableOpacity>
          </View>
        )}

        {statusMessage ? <Text style={styles.pdfPath}>{statusMessage}</Text> : null}
        {pdfWarning ? <Text style={styles.pdfWarning}>{pdfWarning}</Text> : null}
        {pdfError ? <Text style={styles.pdfError}>{pdfError}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function KpiCard({
  icon: Icon,
  tone,
  label,
  value,
  suffix,
}: {
  icon: any;
  tone: keyof typeof tones;
  label: string;
  value: number;
  suffix?: string;
}) {
  const t = tones[tone];

  return (
    <View style={styles.kpiCard}>
      <View style={[styles.kpiIcon, { backgroundColor: t.bg, borderColor: t.border }]}>
        <Icon size={16} color={t.text} strokeWidth={2.6} />
      </View>
      <Text style={styles.kpiValue}>{formatNumber(value)}{suffix || ""}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

function Insight({ text, color }: { text: string; color: string }) {
  return (
    <View style={styles.insightRow}>
      <View style={[styles.insightDot, { backgroundColor: color }]} />
      <Text style={styles.insightText}>{text}</Text>
    </View>
  );
}

function BreakdownRow({ label, value, tone }: { label: string; value: number | string; tone: string }) {
  return (
    <View style={styles.breakdownRow}>
      <Text style={styles.breakdownLabel}>{label}</Text>
      <Text style={[styles.breakdownValue, { color: tone }]}>{typeof value === "number" ? formatNumber(value) : value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  page: { flex: 1, backgroundColor: colors.background },
  container: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 110 },
  backButton: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft, borderRadius: 999, paddingHorizontal: 13, paddingVertical: 9, marginBottom: 14 },
  backText: { color: colors.text, fontSize: 12, fontWeight: "900" },
  coverCard: { borderRadius: 30, padding: 20, marginBottom: 14, overflow: "hidden", shadowColor: colors.black, shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.4, shadowRadius: 26, elevation: 8 },
  coverGlowOne: { position: "absolute", width: 180, height: 180, borderRadius: 180, backgroundColor: "rgba(255,255,255,0.08)", right: -50, top: -60 },
  coverGlowTwo: { position: "absolute", width: 130, height: 130, borderRadius: 130, backgroundColor: "rgba(0,0,0,0.16)", left: -40, bottom: -46 },
  coverTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  coverIcon: { width: 52, height: 52, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.92)", alignItems: "center", justifyContent: "center" },
  reportCode: { color: colors.white, fontSize: 11, fontWeight: "900", letterSpacing: 1.2 },
  coverTitle: { color: colors.white, fontSize: 26, fontWeight: "900", letterSpacing: -1, lineHeight: 31, marginTop: 20 },
  coverDesc: { color: "rgba(255,255,255,0.82)", fontSize: 12, fontWeight: "700", lineHeight: 18, marginTop: 8 },
  coverPillRow: { flexDirection: "row", gap: 8, marginTop: 18 },
  coverPill: { color: colors.white, fontSize: 10.5, fontWeight: "900", backgroundColor: "rgba(255,255,255,0.15)", borderWidth: 1, borderColor: "rgba(255,255,255,0.16)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7, overflow: "hidden" },
  errorText: { color: colors.red, fontSize: 11, fontWeight: "800", marginBottom: 12 },
  kpiGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 },
  kpiCard: { width: "47.9%", backgroundColor: colors.surface, borderRadius: 20, borderWidth: 1, borderColor: colors.borderSoft, padding: 14, ...cardShadow },
  kpiIcon: { width: 32, height: 32, borderRadius: 11, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  kpiValue: { color: colors.text, fontSize: 24, fontWeight: "900", letterSpacing: -0.7 },
  kpiLabel: { color: colors.textSoft, fontSize: 10.5, fontWeight: "700", marginTop: 3 },
  summaryCard: { backgroundColor: colors.surface, borderRadius: 24, borderWidth: 1, borderColor: colors.borderSoft, padding: 15, marginBottom: 14, ...cardShadow },
  breakdownCard: { backgroundColor: colors.surface, borderRadius: 24, borderWidth: 1, borderColor: colors.borderSoft, padding: 15, marginBottom: 14, ...cardShadow },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: "900", letterSpacing: -0.3, marginBottom: 11 },
  insightRow: { flexDirection: "row", alignItems: "flex-start", gap: 9, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  insightDot: { width: 8, height: 8, borderRadius: 8, marginTop: 5 },
  insightText: { flex: 1, color: colors.textSoft, fontSize: 11.5, fontWeight: "700", lineHeight: 17 },
  breakdownRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  breakdownLabel: { color: colors.textSoft, fontSize: 12, fontWeight: "800" },
  breakdownValue: { fontSize: 13, fontWeight: "900" },
  pdfButton: { minHeight: 52, borderRadius: 18, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, marginTop: 2, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.4, shadowRadius: 18, elevation: 6 },
  pdfActionRow: { flexDirection: "row", gap: 10 },
  pdfActionButton: { flex: 1, marginTop: 0 },
  pdfShareButton: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft, shadowOpacity: 0, elevation: 0 },
  pdfButtonText: { color: colors.white, fontSize: 13, fontWeight: "900" },
  pdfPath: { color: colors.green, fontSize: 11, fontWeight: "800", marginTop: 10, textAlign: "center" },
  pdfWarning: { color: colors.amber, fontSize: 11, fontWeight: "800", marginTop: 8, textAlign: "center" },
  pdfError: { color: colors.red, fontSize: 11, fontWeight: "800", marginTop: 10, textAlign: "center" },
});
