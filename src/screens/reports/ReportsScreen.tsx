import React from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  AlertTriangle,
  BarChart3,
  ChevronRight,
  FileCheck2,
  FileText,
  MapPinned,
  RefreshCcw,
  Smartphone,
  Ticket,
  TicketCheck,
} from "lucide-react-native";

import StatusPill from "../../components/StatusPill";
import { MOBILE_REPORTS, type MobileReportTemplate } from "../../config/mobileReports";
import { useMobileOpsSnapshot } from "../../hooks/useLiveOpsData";
import { cardShadow, colors, tones } from "../../theme/colors";
import { radius } from "../../theme/spacing";
import { formatNumber } from "../../utils/formatters";

export default function ReportsScreen() {
  const navigation = useNavigation<any>();
  const { snapshot, loading, refreshing, error, reloadSnapshot } = useMobileOpsSnapshot();

  const attention = snapshot.endpoints.offline + snapshot.endpoints.stale + snapshot.tickets.slaExceeded;

  function openReport(report: MobileReportTemplate) {
    navigation.navigate("ReportDetail", { reportId: report.id });
  }

  function handleRefresh() {
    reloadSnapshot({ silent: true });
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <ScrollView
        style={styles.page}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>EMA OPERATIONAL DASHBOARD</Text>
            <Text style={styles.title}>Reports</Text>
            <Text style={styles.subtitle}>Simple, compact reports for mobile review and PDF sharing.</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} activeOpacity={0.85} onPress={handleRefresh}>
            {loading || refreshing ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <RefreshCcw size={18} color={colors.white} strokeWidth={2.8} />
            )}
          </TouchableOpacity>
        </View>

        <LinearGradient
          colors={["#2E6BE6", "#3B33C4", "#0B1834"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.heroCard}
        >
          <View style={styles.heroGlowOne} />
          <View style={styles.heroGlowTwo} />

          <View style={styles.heroTopRow}>
            <View style={styles.heroIcon}><FileText size={25} color={colors.white} strokeWidth={2.8} /></View>
            <StatusPill label={`${MOBILE_REPORTS.length} Reports`} tone="blue" />
          </View>
          <Text style={styles.heroTitle}>Compact Reporting</Text>
          <Text style={styles.heroDesc}>Only essential reports are shown here. Full reporting remains in the main EMA web system.</Text>
          <View style={styles.heroMetrics}>
            <HeroMetric icon={Smartphone} label="Endpoints" value={snapshot.endpoints.total} />
            <HeroMetric icon={Ticket} label="Open Tickets" value={snapshot.tickets.open} />
            <HeroMetric icon={AlertTriangle} label="Attention" value={attention} />
          </View>
        </LinearGradient>

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Available Reports</Text>
          <View style={styles.sectionMetaRow}>
            <Text style={styles.sectionMeta}>PDF ready</Text>
            <FileCheck2 size={13} color={colors.blueBright} strokeWidth={2.6} />
          </View>
        </View>

        <View style={styles.reportList}>
          {MOBILE_REPORTS.map((report) => {
            const t = tones[report.tone];

            return (
              <TouchableOpacity
                key={report.id}
                activeOpacity={0.88}
                style={styles.reportCard}
                onPress={() => openReport(report)}
              >
                <View style={[styles.reportVisual, { backgroundColor: t.bg, borderColor: t.border }]}>
                  {report.id === "operations" ? (
                    <BarChart3 size={24} color={t.text} strokeWidth={2.8} />
                  ) : report.id === "endpointCoverage" ? (
                    <MapPinned size={24} color={t.text} strokeWidth={2.8} />
                  ) : (
                    <TicketCheck size={24} color={t.text} strokeWidth={2.8} />
                  )}
                </View>

                <View style={styles.reportContent}>
                  <View style={styles.reportTopLine}>
                    <Text style={[styles.reportCode, { color: t.text }]}>{report.code}</Text>
                    <Text style={[styles.categoryPill, { color: t.text, backgroundColor: t.bg, borderColor: t.border }]}>{report.category}</Text>
                  </View>
                  <Text style={styles.reportTitle}>{report.title}</Text>
                  <Text style={styles.reportDesc}>{report.subtitle}</Text>
                  <View style={styles.reportFooter}>
                    <Text style={[styles.reportAction, { color: t.text }]}>View summary & PDF</Text>
                    <ChevronRight size={16} color={t.text} strokeWidth={2.8} />
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function HeroMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: any;
  label: string;
  value: number;
}) {
  return (
    <View style={styles.heroMetric}>
      <View style={styles.heroMetricTopRow}>
        <Text style={styles.heroMetricValue}>{formatNumber(value)}</Text>
        <Icon size={13} color="rgba(219, 234, 254, 0.75)" strokeWidth={2.4} />
      </View>
      <Text style={styles.heroMetricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  page: { flex: 1, backgroundColor: colors.background },
  container: { paddingHorizontal: 18, paddingTop: 14, paddingBottom: 110 },
  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 },
  eyebrow: { color: colors.blueBright, fontSize: 10, fontWeight: "900", letterSpacing: 1.2, marginBottom: 4 },
  title: { color: colors.text, fontSize: 28, fontWeight: "900", letterSpacing: -1 },
  subtitle: { color: colors.textSoft, fontSize: 12, fontWeight: "700", lineHeight: 18, marginTop: 5, maxWidth: 270 },
  refreshButton: { width: 42, height: 42, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft, alignItems: "center", justifyContent: "center" },
  heroCard: { borderRadius: 30, padding: 20, marginBottom: 18, overflow: "hidden", borderWidth: 1.5, borderColor: "rgba(79, 70, 229, 0.35)", shadowColor: "#3B33C4", shadowOffset: { width: 0, height: 16 }, shadowOpacity: 0.35, shadowRadius: 28, elevation: 8 },
  heroGlowOne: { position: "absolute", width: 180, height: 180, borderRadius: 180, backgroundColor: "rgba(255,255,255,0.07)", right: -50, top: -60 },
  heroGlowTwo: { position: "absolute", width: 130, height: 130, borderRadius: 130, backgroundColor: "rgba(34,211,238,0.14)", left: -40, bottom: -46 },
  heroTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heroIcon: { width: 54, height: 54, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.14)", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  heroTitle: { color: colors.white, fontSize: 23, fontWeight: "900", marginTop: 18, letterSpacing: -0.6 },
  heroDesc: { color: "rgba(219, 234, 254, 0.80)", fontSize: 12, fontWeight: "700", lineHeight: 18, marginTop: 7 },
  heroMetrics: { flexDirection: "row", gap: 10, marginTop: 18, paddingTop: 16, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.14)" },
  heroMetric: { flex: 1, backgroundColor: "rgba(255,255,255,0.1)", borderRadius: 16, padding: 10 },
  heroMetricTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heroMetricValue: { color: colors.white, fontSize: 20, fontWeight: "900", letterSpacing: -0.6 },
  heroMetricLabel: { color: "rgba(219, 234, 254, 0.75)", fontSize: 9.5, fontWeight: "800", marginTop: 3 },
  errorCard: { backgroundColor: "rgba(220, 38, 38, 0.10)", borderRadius: 18, borderWidth: 1, borderColor: "rgba(220, 38, 38, 0.26)", padding: 13, marginBottom: 12 },
  errorText: { color: colors.red, fontSize: 11, fontWeight: "800" },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  sectionTitle: { color: colors.text, fontSize: 18, fontWeight: "900", letterSpacing: -0.4 },
  sectionMetaRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  sectionMeta: { color: colors.textSoft, fontSize: 11, fontWeight: "800" },
  reportList: { gap: 12 },
  reportCard: { backgroundColor: colors.surface, borderRadius: 26, padding: 14, flexDirection: "row", alignItems: "flex-start", borderWidth: 1, borderColor: colors.borderSoft, ...cardShadow },
  reportVisual: { width: 60, height: 60, borderRadius: 18, borderWidth: 1, alignItems: "center", justifyContent: "center", marginRight: 13 },
  reportContent: { flex: 1, paddingVertical: 2 },
  reportTopLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 5 },
  reportCode: { fontSize: 10, fontWeight: "900", letterSpacing: 0.8 },
  categoryPill: { fontSize: 9, fontWeight: "900", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, borderWidth: 1, overflow: "hidden" },
  reportTitle: { color: colors.text, fontSize: 15, fontWeight: "900", letterSpacing: -0.3, lineHeight: 19 },
  reportDesc: { color: colors.textSoft, fontSize: 11, fontWeight: "700", lineHeight: 16, marginTop: 4 },
  reportFooter: { marginTop: "auto", flexDirection: "row", alignItems: "center", gap: 5 },
  reportAction: { fontSize: 10.5, fontWeight: "900" },
});
