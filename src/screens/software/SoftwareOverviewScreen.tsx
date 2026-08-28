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
  AppWindow,
  CheckCircle2,
  Layers,
  RefreshCcw,
} from "lucide-react-native";

import {
  fetchSoftwareSummary,
  type MobileSoftwareSummary,
} from "../../services/opsMobileService";
import { formatNumber } from "../../utils/formatters";
import { drilldownPalette } from "../../theme/colors";

const ui = drilldownPalette;

const emptySummary: MobileSoftwareSummary = {
  totalInstallations: 0,
  uniqueSoftware: 0,
  devicesWithSoftware: 0,
  unclassifiedSoftware: 0,
  latestScan: "-",
  topCategories: [],
  classificationBreakdown: [],
  lifecycleWatch: [],
  businessSoftware: 0,
  remoteControlSoftware: 0,
  antivirusSoftware: 0,
  browserSoftware: 0,
  gamingSoftware: 0,
  eolApplications: 0,
  eosApplications: 0,
  unsupportedApplications: 0,
};

const CLASSIFICATION_TONE: Record<string, string> = {
  Business: ui.blue,
  "Remote Control": ui.purple,
  Antivirus: ui.green,
  "Web Browser": ui.cyan,
  Gaming: ui.amber,
  Unclassified: ui.soft,
};

function lifecycleTone(status: string) {
  const value = status.toLowerCase();
  if (value.includes("eol") || value.includes("eos") || value.includes("unsupported")) return ui.red;
  if (value.includes("supported")) return ui.green;
  return ui.soft;
}

// Backend returns the "EOL / EOS" shorthand — spell it out so it reads
// clearly for non-technical viewers instead of requiring the acronym to be explained.
function expandLifecycleLabel(status: string) {
  return status
    .replace(/\bEOL\b/g, "End of Life")
    .replace(/\bEOS\b/g, "End of Support");
}

export default function SoftwareOverviewScreen() {
  const insets = useSafeAreaInsets();

  const [summary, setSummary] = useState<MobileSoftwareSummary>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (force = false) => {
    if (force) setRefreshing(true);
    else setLoading(true);

    try {
      const result = await fetchSoftwareSummary({ force });
      setSummary(result);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err || "Failed to load software inventory data."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  const flaggedLifecycle = summary.lifecycleWatch.filter(
    (item) => lifecycleTone(item.lifecycleStatus) !== ui.green
  );
  const flaggedCount = summary.eolApplications + summary.unsupportedApplications;

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
            <Text style={styles.eyebrow}>SOFTWARE INVENTORY</Text>
            <Text style={styles.title}>Software Overview</Text>
            <Text style={styles.meta}>Installed applications across managed devices, classified by type and lifecycle status.</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={() => load(true)} activeOpacity={0.85}>
            {loading || refreshing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <RefreshCcw size={18} color="#FFFFFF" strokeWidth={2.8} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.coverageCard}>
          <View>
            <Text style={styles.coverageLabel}>Total software installations</Text>
            <Text style={styles.coverageValue}>{formatNumber(summary.totalInstallations)}</Text>
            <Text style={styles.coverageHint}>Last scan: {summary.latestScan}</Text>
          </View>
          <AppWindow size={32} color="#E0E7FF" strokeWidth={2.8} />
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
          <View style={[styles.summaryIcon, { backgroundColor: "rgba(79, 70, 229, 0.12)" }]}>
            <Layers size={18} color={ui.blue} strokeWidth={2.8} />
          </View>
          <Text style={styles.summaryValue}>{formatNumber(summary.uniqueSoftware)}</Text>
          <Text style={styles.summaryTitle}>Unique Titles</Text>
          <Text style={styles.summaryHint}>Across {formatNumber(summary.devicesWithSoftware)} devices scanned</Text>
        </View>

        <View style={styles.summaryCard}>
          <View style={[styles.summaryIcon, { backgroundColor: "rgba(220, 38, 38, 0.12)" }]}>
            <AlertTriangle size={18} color={ui.red} strokeWidth={2.8} />
          </View>
          <Text style={styles.summaryValue}>{formatNumber(flaggedCount)}</Text>
          <Text style={styles.summaryTitle}>Lifecycle Flagged</Text>
          <Text style={styles.summaryHint}>End of life / unsupported apps</Text>
        </View>
      </View>

      {summary.classificationBreakdown.length > 0 ? (
        <View style={styles.tablePanel}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableTitle}>Classification Breakdown</Text>
            <Text style={styles.tableMeta}>{formatNumber(summary.unclassifiedSoftware)} unclassified installs</Text>
          </View>
          {summary.classificationBreakdown.map((row) => {
            const tone = CLASSIFICATION_TONE[row.name] || ui.soft;
            return (
              <View key={row.name} style={styles.categoryRow}>
                <View style={styles.categoryTopRow}>
                  <Text style={styles.categoryName}>{row.name}</Text>
                  <Text style={[styles.categoryValue, { color: tone }]}>{formatNumber(row.value)} ({row.percent}%)</Text>
                </View>
                <View style={styles.categoryTrack}>
                  <View style={[styles.categoryFill, { width: `${Math.max(row.percent, 2)}%`, backgroundColor: tone }]} />
                </View>
              </View>
            );
          })}
        </View>
      ) : null}

      {summary.topCategories.length > 0 ? (
        <View style={styles.tablePanel}>
          <View style={styles.tableHeader}>
            <Text style={styles.tableTitle}>Top Software Categories</Text>
          </View>
          {summary.topCategories.map((row, index) => (
            <View
              key={row.name}
              style={[styles.categoryListRow, index === summary.topCategories.length - 1 && styles.categoryListRowLast]}
            >
              <Text style={styles.categoryListName} numberOfLines={1}>{row.name}</Text>
              <Text style={styles.categoryListValue}>{formatNumber(row.value)} · {row.percent}%</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View style={styles.tablePanel}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableTitle}>Lifecycle Watch</Text>
          <Text style={styles.tableMeta}>Applications needing lifecycle review first</Text>
        </View>

        {loading && summary.totalInstallations === 0 ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="small" color={ui.cyan} />
            <Text style={styles.loadingText}>Loading software inventory...</Text>
          </View>
        ) : flaggedLifecycle.length === 0 ? (
          <View style={styles.emptyBlock}>
            <CheckCircle2 size={22} color={ui.green} strokeWidth={2.7} />
            <Text style={styles.emptyTitle}>No lifecycle issues flagged</Text>
            <Text style={styles.emptyText}>No major application in the tracked lifecycle list is currently End of Life, End of Support, or unsupported.</Text>
          </View>
        ) : (
          flaggedLifecycle.map((item, index) => {
            const tone = lifecycleTone(item.lifecycleStatus);
            return (
              <View
                key={`${item.name}-${index}`}
                style={[styles.deviceRow, index === flaggedLifecycle.length - 1 && styles.deviceRowLast]}
              >
                <View style={styles.deviceTopRow}>
                  <Text style={styles.deviceName} numberOfLines={1}>{item.name}</Text>
                  <View style={[styles.severityPill, { backgroundColor: `${tone}1E`, borderColor: `${tone}4D` }]}>
                    <Text style={[styles.severityPillText, { color: tone }]}>{expandLifecycleLabel(item.lifecycleStatus)}</Text>
                  </View>
                </View>
                <Text style={styles.deviceMeta} numberOfLines={1}>
                  {item.vendor ? `${item.vendor} · ` : ""}{formatNumber(item.installs)} installs across {formatNumber(item.uniqueTitles)} version(s)
                </Text>
                <Text style={styles.deviceReason} numberOfLines={2}>{item.supportStatus}</Text>
                {item.eolDate || item.eosDate ? (
                  <Text style={styles.deviceLastSeen}>
                    {item.eolDate ? `End of Life: ${item.eolDate}` : ""}{item.eolDate && item.eosDate ? " · " : ""}{item.eosDate ? `End of Support: ${item.eosDate}` : ""}
                  </Text>
                ) : null}
              </View>
            );
          })
        )}
      </View>

      <View style={styles.notePanel}>
        <Text style={styles.noteTitle}>Mobile scope</Text>
        <Text style={styles.noteText}>
          Lifecycle status here covers a fixed list of common applications (Microsoft
          Office generations, Microsoft 365, Adobe, Chrome, Firefox, Edge). Software
          outside this list shows as "Lifecycle Not Found" rather than an assumed
          safe status.
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
  categoryListRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: ui.line, gap: 10 },
  categoryListRowLast: { borderBottomWidth: 0 },
  categoryListName: { flex: 1, color: ui.ink, fontSize: 12.5, fontWeight: "700" },
  categoryListValue: { color: ui.soft, fontSize: 11.5, fontWeight: "800" },
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
