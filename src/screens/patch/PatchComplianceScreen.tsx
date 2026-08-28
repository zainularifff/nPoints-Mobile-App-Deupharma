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
  ChevronRight,
  RefreshCcw,
  ShieldCheck,
  XCircle,
} from "lucide-react-native";

import { useNavigation } from "@react-navigation/native";

import { useMobileOpsSnapshot } from "../../hooks/useLiveOpsData";
import { fetchPatchDepartments, type MobilePatchDepartment } from "../../services/opsMobileService";
import { formatNumber } from "../../utils/formatters";
import { drilldownPalette } from "../../theme/colors";

const ui = drilldownPalette;

function toneForPercent(percent: number) {
  if (percent >= 90) return ui.green;
  if (percent >= 70) return ui.amber;
  return ui.red;
}

export default function PatchComplianceScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { snapshot } = useMobileOpsSnapshot();

  const [departments, setDepartments] = useState<MobilePatchDepartment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (force = false) => {
    if (force) setRefreshing(true);
    else setLoading(true);

    try {
      const rows = await fetchPatchDepartments({ force });
      setDepartments(rows);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err || "Failed to load patch data."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

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
            <Text style={styles.eyebrow}>PATCH COMPLIANCE</Text>
            <Text style={styles.title}>Device Patch Status</Text>
            <Text style={styles.meta}>Installed vs applicable patches across scanned devices, by department.</Text>
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
            <Text style={styles.coverageLabel}>Patch compliance (scanned fleet)</Text>
            <Text style={styles.coverageValue}>{snapshot.patch.complianceRate}%</Text>
            <Text style={styles.coverageHint}>Installed vs applicable patch records</Text>
          </View>
          <ShieldCheck size={32} color="#E0E7FF" strokeWidth={2.8} />
        </View>
      </LinearGradient>

      {error ? (
        <View style={styles.errorCard}>
          <AlertTriangle size={18} color={ui.red} strokeWidth={2.8} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.summaryRow}>
        <TouchableOpacity
          style={styles.summaryCard}
          activeOpacity={0.8}
          onPress={() => navigation.navigate("PatchDeviceList", { onlyMissing: false })}
        >
          <View style={[styles.summaryIcon, { backgroundColor: "rgba(22, 163, 74, 0.12)" }]}>
            <CheckCircle2 size={18} color={ui.green} strokeWidth={2.8} />
          </View>
          <Text style={styles.summaryValue}>{formatNumber(snapshot.patch.scannedDevices)}</Text>
          <Text style={styles.summaryTitle}>Devices Scanned</Text>
          <View style={styles.summaryTapRow}>
            <Text style={styles.summaryHint}>Devices with patch scan data on file</Text>
            <ChevronRight size={14} color={ui.muted} strokeWidth={2.8} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.summaryCard}
          activeOpacity={0.8}
          onPress={() => navigation.navigate("PatchDeviceList", { onlyMissing: true })}
        >
          <View style={[styles.summaryIcon, { backgroundColor: "rgba(220, 38, 38, 0.12)" }]}>
            <XCircle size={18} color={ui.red} strokeWidth={2.8} />
          </View>
          <Text style={styles.summaryValue}>{formatNumber(snapshot.patch.missingPatchDevices)}</Text>
          <Text style={styles.summaryTitle}>Need Patching</Text>
          <View style={styles.summaryTapRow}>
            <Text style={styles.summaryHint}>Scanned devices missing updates</Text>
            <ChevronRight size={14} color={ui.muted} strokeWidth={2.8} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.tablePanel}>
        <View style={styles.tableHeader}>
          <View>
            <Text style={styles.tableTitle}>By Department</Text>
            <Text style={styles.tableMeta}>Lowest compliance first · tap for devices</Text>
          </View>
        </View>

        {loading && departments.length === 0 ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="small" color={ui.cyan} />
            <Text style={styles.loadingText}>Loading department breakdown...</Text>
          </View>
        ) : departments.length === 0 ? (
          <View style={styles.emptyBlock}>
            <ShieldCheck size={24} color={ui.muted} strokeWidth={2.7} />
            <Text style={styles.emptyTitle}>No department breakdown available</Text>
            <Text style={styles.emptyText}>Department-level patch data isn't available from the backend right now.</Text>
          </View>
        ) : (
          <View style={styles.deptList}>
            {departments.map((dept, index) => {
              const tone = toneForPercent(dept.percent);
              return (
                <TouchableOpacity
                  key={dept.name}
                  style={[styles.deptRow, index === departments.length - 1 && styles.deptRowLast]}
                  activeOpacity={0.7}
                  onPress={() => navigation.navigate("PatchDeviceList", { onlyMissing: false, department: dept.name })}
                >
                  <View style={styles.deptTopRow}>
                    <Text style={styles.deptName} numberOfLines={1}>{dept.name}</Text>
                    <View style={styles.deptPercentRow}>
                      <Text style={[styles.deptPercent, { color: tone }]}>{dept.percent}%</Text>
                      <ChevronRight size={14} color={ui.muted} strokeWidth={2.8} />
                    </View>
                  </View>
                  <View style={styles.deptTrack}>
                    <View style={[styles.deptFill, { width: `${Math.max(dept.percent, 3)}%`, backgroundColor: tone }]} />
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      <View style={styles.notePanel}>
        <Text style={styles.noteTitle}>Mobile scope</Text>
        <Text style={styles.noteText}>
          Tap a card or a department row above to see which devices they
          cover. Per-patch details (KB names, severity) and manual patch actions
          remain in the main EMA web system.
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
  summaryHint: { color: ui.soft, fontSize: 10.2, fontWeight: "700", flexShrink: 1 },
  summaryTapRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 4, marginTop: 4 },
  tablePanel: { marginHorizontal: 16, marginTop: 14, backgroundColor: ui.card, borderRadius: 24, padding: 15, borderWidth: 1, borderColor: ui.line, shadowColor: "#000000", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 2 },
  tableHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  tableTitle: { color: ui.ink, fontSize: 16, fontWeight: "900" },
  tableMeta: { color: ui.soft, fontSize: 10.5, fontWeight: "700", marginTop: 4 },
  loadingBlock: { alignItems: "center", paddingVertical: 24, gap: 8 },
  loadingText: { color: ui.soft, fontSize: 11, fontWeight: "800" },
  emptyBlock: { alignItems: "center", paddingVertical: 24 },
  emptyTitle: { color: ui.ink, fontSize: 13, fontWeight: "900", marginTop: 8 },
  emptyText: { color: ui.soft, fontSize: 11, fontWeight: "700", marginTop: 4, textAlign: "center" },
  deptList: {},
  deptRow: { marginBottom: 16 },
  deptRowLast: { marginBottom: 0 },
  deptTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 7 },
  deptName: { flex: 1, color: ui.ink, fontSize: 12.5, fontWeight: "700", paddingRight: 8 },
  deptPercentRow: { flexDirection: "row", alignItems: "center", gap: 3 },
  deptPercent: { fontSize: 12.5, fontWeight: "800" },
  deptTrack: { height: 7, borderRadius: 99, backgroundColor: "#EDEFF7", overflow: "hidden" },
  deptFill: { height: 7, borderRadius: 99 },
  notePanel: { marginHorizontal: 16, marginTop: 14, backgroundColor: ui.card, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: ui.line },
  noteTitle: { color: ui.ink, fontSize: 14, fontWeight: "900" },
  noteText: { color: ui.soft, fontSize: 12, fontWeight: "700", lineHeight: 18, marginTop: 5 },
});
