import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  ShieldHalf,
} from "lucide-react-native";

import {
  fetchRiskSummary,
  type MobileRiskDevice,
  type MobileRiskSummary,
} from "../../services/opsMobileService";
import { formatNumber } from "../../utils/formatters";
import { drilldownPalette } from "../../theme/colors";

const ui = drilldownPalette;

const emptySummary: MobileRiskSummary = {
  totalCritical: 0,
  totalHigh: 0,
  totalMedium: 0,
  unsupportedOsDevices: 0,
  outdatedOsDevices: 0,
  severityBreakdown: [],
  categoryBreakdown: [],
};

function categoryTone(tone: string) {
  return ui[tone as keyof typeof ui] ?? ui.soft;
}

export default function DeviceRiskScreen() {
  const insets = useSafeAreaInsets();

  const [summary, setSummary] = useState<MobileRiskSummary>(emptySummary);
  const [devices, setDevices] = useState<MobileRiskDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (force = false) => {
    if (force) setRefreshing(true);
    else setLoading(true);

    try {
      const result = await fetchRiskSummary({ force });
      setSummary(result.summary);
      setDevices(result.devices);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err || "Failed to load device risk data."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  const totalRisk = summary.totalCritical + summary.totalHigh + summary.totalMedium;

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 104 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} />}
    >
      <View style={{ height: insets.top, backgroundColor: ui.navy }} />
      <LinearGradient colors={[ui.navy, ui.navy2, "#3B33C4"]} style={styles.hero}>
        <View style={styles.heroOrb} />
        <View style={styles.heroTop}>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>DEVICE RISK</Text>
            <Text style={styles.title}>Windows Lifecycle Risk</Text>
            <Text style={styles.meta}>Devices flagged from OS end-of-life / end-of-support evidence.</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={() => load(true)} activeOpacity={0.85}>
            {loading || refreshing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <ShieldHalf size={18} color="#FFFFFF" strokeWidth={2.8} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.coverageCard}>
          <View>
            <Text style={styles.coverageLabel}>Devices with lifecycle risk flagged</Text>
            <Text style={styles.coverageValue}>{formatNumber(totalRisk)}</Text>
            <Text style={styles.coverageHint}>Compared against full hardware inventory</Text>
          </View>
          <ShieldHalf size={32} color="#E0E7FF" strokeWidth={2.8} />
        </View>
      </LinearGradient>

      {error ? (
        <View style={styles.errorCard}>
          <AlertTriangle size={18} color={ui.red} strokeWidth={2.8} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <View style={[styles.summaryIcon, { backgroundColor: "rgba(220, 38, 38, 0.12)" }]}>
            <ShieldAlert size={18} color={ui.red} strokeWidth={2.8} />
          </View>
          <Text style={styles.summaryValue}>{formatNumber(summary.totalCritical)}</Text>
          <Text style={styles.summaryTitle}>Critical</Text>
          <Text style={styles.summaryHint}>Review and plan upgrade first</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={[styles.summaryIcon, { backgroundColor: "rgba(217, 119, 6, 0.12)" }]}>
            <AlertTriangle size={18} color={ui.amber} strokeWidth={2.8} />
          </View>
          <Text style={styles.summaryValue}>{formatNumber(summary.totalHigh)}</Text>
          <Text style={styles.summaryTitle}>High</Text>
          <Text style={styles.summaryHint}>Plan lifecycle review soon</Text>
        </View>
      </View>

      {summary.categoryBreakdown.length > 0 ? (
        <View style={styles.tablePanel}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableTitle}>Lifecycle Category</Text>
            <Text style={styles.tableMeta}>{formatNumber(summary.totalMedium)} medium-risk devices also flagged</Text>
          </View>
          {summary.categoryBreakdown.map((row) => {
            const tone = categoryTone(row.tone);
            return (
              <View key={row.name} style={styles.categoryRow}>
                <View style={styles.categoryTopRow}>
                  <Text style={styles.categoryName}>{row.name}</Text>
                  <Text style={[styles.categoryValue, { color: tone }]}>{formatNumber(row.value)} ({row.percent}%)</Text>
                </View>
                <View style={styles.categoryTrack}>
                  <View style={[styles.categoryFill, { width: `${Math.max(row.percent, 3)}%`, backgroundColor: tone }]} />
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      <View style={styles.tablePanel}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableTitle}>Flagged Devices</Text>
          <Text style={styles.tableMeta}>Highest risk score first</Text>
        </View>

        {loading && devices.length === 0 ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="small" color={ui.cyan} />
            <Text style={styles.loadingText}>Loading device risk data...</Text>
          </View>
        ) : devices.length === 0 ? (
          <View style={styles.emptyBlock}>
            <CheckCircle2 size={22} color={ui.green} strokeWidth={2.7} />
            <Text style={styles.emptyTitle}>No lifecycle risk flagged</Text>
            <Text style={styles.emptyText}>No devices currently match end-of-life or end-of-support risk criteria.</Text>
          </View>
        ) : (
          devices.map((device, index) => {
            const severityTone = device.severity.toLowerCase() === "critical" ? ui.red : ui.amber;
            return (
              <View
                key={device.id}
                style={[styles.deviceRow, index === devices.length - 1 && styles.deviceRowLast]}
              >
                <View style={styles.deviceTopRow}>
                  <Text style={styles.deviceName} numberOfLines={1}>{device.deviceName}</Text>
                  <View style={[styles.severityPill, { backgroundColor: `${severityTone}1E`, borderColor: `${severityTone}4D` }]}>
                    <Text style={[styles.severityPillText, { color: severityTone }]}>{device.severity}</Text>
                  </View>
                </View>
                <Text style={styles.deviceMeta} numberOfLines={1}>
                  {device.department} · {device.platform} · {device.model}
                </Text>
                <Text style={styles.deviceReason} numberOfLines={2}>{device.reasons}</Text>
                <Text style={styles.deviceLastSeen}>Last seen: {device.lastSeen} · Score: {device.riskScore}</Text>
              </View>
            );
          })
        )}
      </View>

      <View style={styles.notePanel}>
        <Text style={styles.noteTitle}>Mobile scope</Text>
        <Text style={styles.noteText}>
          Risk here is limited to Windows OS lifecycle evidence, matching
          the main EMA web system. It is separate from endpoint connectivity
          status and ticket data shown elsewhere.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: ui.bg },
  hero: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 28, borderBottomLeftRadius: 34, borderBottomRightRadius: 34, overflow: "hidden" },
  heroOrb: { position: "absolute", width: 220, height: 220, borderRadius: 220, backgroundColor: "rgba(14,143,166,0.35)", top: -110, right: -80 },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  heroCopy: { flex: 1, paddingRight: 14 },
  eyebrow: { color: "#9DC2FF", fontSize: 11, fontWeight: "900", letterSpacing: 1.25 },
  title: { color: "#FFFFFF", fontSize: 27, fontWeight: "900", letterSpacing: -1, marginTop: 6 },
  meta: { color: "#B5C7DE", fontSize: 11.5, fontWeight: "700", marginTop: 8, lineHeight: 16 },
  refreshButton: { width: 42, height: 42, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.16)", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
  coverageCard: { marginTop: 24, padding: 16, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.11)", borderWidth: 1, borderColor: "rgba(255,255,255,0.16)", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  coverageLabel: { color: "#D8E7FF", fontSize: 11, fontWeight: "800" },
  coverageValue: { color: "#FFFFFF", fontSize: 44, fontWeight: "900", letterSpacing: -1.6, marginTop: 3 },
  coverageHint: { color: "#9EB1CA", fontSize: 10.5, fontWeight: "700", marginTop: 2 },
  errorCard: { marginHorizontal: 16, marginTop: 14, padding: 14, borderRadius: 18, backgroundColor: "rgba(220, 38, 38, 0.10)", borderWidth: 1, borderColor: "rgba(220, 38, 38, 0.26)", flexDirection: "row", alignItems: "center", gap: 9 },
  errorText: { flex: 1, color: ui.soft, fontSize: 11, fontWeight: "700" },
  summaryRow: { flexDirection: "row", gap: 10, paddingHorizontal: 16, marginTop: -16 },
  summaryCard: { flex: 1, backgroundColor: ui.card, borderRadius: 22, padding: 14, borderWidth: 1, borderColor: ui.line, shadowColor: "#000000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 2 },
  summaryIcon: { width: 36, height: 36, borderRadius: 14, alignItems: "center", justifyContent: "center", marginBottom: 11 },
  summaryValue: { color: ui.ink, fontSize: 30, fontWeight: "900", letterSpacing: -1 },
  summaryTitle: { color: ui.ink, fontSize: 12, fontWeight: "900", marginTop: 2 },
  summaryHint: { color: ui.soft, fontSize: 10.2, fontWeight: "700", marginTop: 4 },
  tablePanel: { marginHorizontal: 16, marginTop: 14, backgroundColor: ui.card, borderRadius: 24, padding: 15, borderWidth: 1, borderColor: ui.line, shadowColor: "#000000", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 2 },
  tableHeader: { marginBottom: 14 },
  tableTitle: { color: ui.ink, fontSize: 16, fontWeight: "900" },
  tableMeta: { color: ui.soft, fontSize: 10.5, fontWeight: "700", marginTop: 4 },
  categoryRow: { marginBottom: 14 },
  categoryTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 7 },
  categoryName: { flex: 1, color: ui.ink, fontSize: 12.5, fontWeight: "700", paddingRight: 8 },
  categoryValue: { fontSize: 12, fontWeight: "800" },
  categoryTrack: { height: 7, borderRadius: 99, backgroundColor: "#EDEFF7", overflow: "hidden" },
  categoryFill: { height: 7, borderRadius: 99 },
  loadingBlock: { alignItems: "center", paddingVertical: 24, gap: 8 },
  loadingText: { color: ui.soft, fontSize: 11, fontWeight: "800" },
  emptyBlock: { alignItems: "center", paddingVertical: 24 },
  emptyTitle: { color: ui.ink, fontSize: 13, fontWeight: "900", marginTop: 8 },
  emptyText: { color: ui.soft, fontSize: 11, fontWeight: "700", marginTop: 4, textAlign: "center" },
  deviceRow: { backgroundColor: "#FFFFFF", borderRadius: 20, borderWidth: 1, borderColor: ui.line, padding: 14, marginBottom: 10 },
  deviceRowLast: { marginBottom: 0 },
  deviceTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  deviceName: { flex: 1, color: ui.ink, fontSize: 13, fontWeight: "800" },
  severityPill: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 4 },
  severityPillText: { fontSize: 10, fontWeight: "800" },
  deviceMeta: { color: ui.soft, fontSize: 11, fontWeight: "600", marginTop: 5 },
  deviceReason: { color: ui.soft, fontSize: 11, fontWeight: "500", marginTop: 6, lineHeight: 15 },
  deviceLastSeen: { color: ui.muted, fontSize: 10, fontWeight: "600", marginTop: 6 },
  notePanel: { marginHorizontal: 16, marginTop: 14, backgroundColor: ui.card, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: ui.line },
  noteTitle: { color: ui.ink, fontSize: 14, fontWeight: "900" },
  noteText: { color: ui.soft, fontSize: 12, fontWeight: "700", lineHeight: 18, marginTop: 5 },
});
