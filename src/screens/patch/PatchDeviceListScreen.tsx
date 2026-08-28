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
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AlertTriangle,
  ArrowLeft,
  ChevronRight,
  RefreshCcw,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react-native";

import {
  fetchPatchMissingDevices,
  type MobilePatchMissingDevice,
} from "../../services/opsMobileService";
import { formatNumber } from "../../utils/formatters";
import { drilldownPalette } from "../../theme/colors";

const ui = drilldownPalette;

function toneForCount(count: number) {
  if (count >= 10) return ui.red;
  if (count >= 5) return ui.amber;
  return ui.cyan;
}

type PatchDeviceListParams = {
  onlyMissing?: boolean;
  department?: string;
};

export default function PatchDeviceListScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const params: PatchDeviceListParams = route.params || {};
  const onlyMissing = params.onlyMissing !== false;
  const department = params.department || "";

  const [devices, setDevices] = useState<MobilePatchMissingDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (force = false) => {
    if (force) setRefreshing(true);
    else setLoading(true);

    try {
      const rows = await fetchPatchMissingDevices({ force, onlyMissing, department });
      setDevices(rows);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err || "Failed to load device list."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [onlyMissing, department]);

  useEffect(() => {
    load(false);
  }, [load]);

  function openDevice(device: MobilePatchMissingDevice) {
    navigation.navigate("DeviceQuickView", {
      device: device.deviceName,
      site: device.department,
      status: device.missingPatchCount > 0 ? "Needs Patching" : "Up to date",
      lastSeen: device.lastScanTime,
      risk: device.missingPatchCount >= 10 ? "High" : device.missingPatchCount > 0 ? "Medium" : "Low",
      category: "Patch Compliance",
      action:
        device.missingPatchCount > 0
          ? `${device.missingPatchCount} applicable patch(es) not yet installed on this device. Review and deploy via the main EMA web system.`
          : `All ${device.applicablePatches} applicable patch(es) are installed on this device.`,
    });
  }

  // Hero copy adapts to which drill-down this screen was opened for.
  const eyebrow = department
    ? "BY DEPARTMENT"
    : onlyMissing
    ? "NEED PATCHING"
    : "DEVICES SCANNED";
  const title = department
    ? department
    : onlyMissing
    ? "Devices Missing Updates"
    : "All Scanned Devices";
  const meta = department
    ? `Patch scan data for devices in ${department}.`
    : onlyMissing
    ? "Devices with at least one applicable patch not yet installed."
    : "Every device with patch scan data on file, compliant or not.";
  const backLabel = "Patch Compliance";

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
          <TouchableOpacity style={styles.backPill} activeOpacity={0.85} onPress={() => navigation.goBack()}>
            <ArrowLeft size={16} color="#FFFFFF" strokeWidth={2.8} />
            <Text style={styles.backText}>{backLabel}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.refreshButton} onPress={() => load(true)} activeOpacity={0.85}>
            {loading || refreshing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <RefreshCcw size={18} color="#FFFFFF" strokeWidth={2.8} />
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.meta}>{meta}</Text>

        <View style={styles.coverageCard}>
          <View>
            <Text style={styles.coverageLabel}>{onlyMissing ? "Devices Flagged" : "Devices Listed"}</Text>
            <Text style={styles.coverageValue}>{formatNumber(devices.length)}</Text>
            <Text style={styles.coverageHint}>Tap a device for a quick summary</Text>
          </View>
          <ShieldAlert size={32} color="#E0E7FF" strokeWidth={2.8} />
        </View>
      </LinearGradient>

      {error ? (
        <View style={styles.errorCard}>
          <AlertTriangle size={18} color={ui.red} strokeWidth={2.8} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.tablePanel}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableTitle}>{department ? "Department Devices" : onlyMissing ? "Flagged Devices" : "All Devices"}</Text>
          <Text style={styles.tableMeta}>{onlyMissing ? "Most missing patches first" : "Lowest compliance first"}</Text>
        </View>

        {loading && devices.length === 0 ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="small" color={ui.cyan} />
            <Text style={styles.loadingText}>Loading devices...</Text>
          </View>
        ) : devices.length === 0 ? (
          <View style={styles.emptyBlock}>
            <ShieldCheck size={24} color={ui.green} strokeWidth={2.7} />
            <Text style={styles.emptyTitle}>{onlyMissing ? "No devices need patching" : "No devices found"}</Text>
            <Text style={styles.emptyText}>
              {onlyMissing
                ? "Every scanned device has all applicable patches installed."
                : "No patch scan data on file for this view yet."}
            </Text>
          </View>
        ) : (
          devices.map((device, index) => {
            const isCompliant = device.missingPatchCount === 0;
            const tone = isCompliant ? ui.green : toneForCount(device.missingPatchCount);
            return (
              <TouchableOpacity
                key={device.id}
                style={[styles.deviceRow, index === devices.length - 1 && styles.deviceRowLast]}
                activeOpacity={0.8}
                onPress={() => openDevice(device)}
              >
                <View style={styles.deviceTopRow}>
                  <Text style={styles.deviceName} numberOfLines={1}>{device.deviceName}</Text>
                  <View style={[styles.countPill, { backgroundColor: `${tone}1E`, borderColor: `${tone}4D` }]}>
                    <Text style={[styles.countPillText, { color: tone }]}>
                      {isCompliant ? "Up to date" : `${device.missingPatchCount} missing`}
                    </Text>
                  </View>
                </View>
                <View style={styles.deviceBottomRow}>
                  <Text style={styles.deviceMeta} numberOfLines={1}>
                    {device.department} · {device.percent}% compliant · Last scan: {device.lastScanTime}
                  </Text>
                  <ChevronRight size={16} color={ui.muted} strokeWidth={2.6} />
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </View>

      <View style={styles.notePanel}>
        <Text style={styles.noteTitle}>Mobile scope</Text>
        <Text style={styles.noteText}>
          This drill-down lists devices only. Per-device patch names, KB
          details, and manual install actions remain in the main EMA web
          system.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: ui.bg },
  hero: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 28, borderBottomLeftRadius: 34, borderBottomRightRadius: 34, overflow: "hidden" },
  heroOrb: { position: "absolute", width: 220, height: 220, borderRadius: 220, backgroundColor: "rgba(14,143,166,0.35)", top: -110, right: -80 },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 22 },
  backPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.14)", borderWidth: 1, borderColor: "rgba(255,255,255,0.16)" },
  backText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900" },
  refreshButton: { width: 42, height: 42, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.16)", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
  eyebrow: { color: "#9DC2FF", fontSize: 11, fontWeight: "900", letterSpacing: 1.25 },
  title: { color: "#FFFFFF", fontSize: 27, fontWeight: "900", letterSpacing: -1, marginTop: 6 },
  meta: { color: "#B5C7DE", fontSize: 11.5, fontWeight: "700", marginTop: 8, lineHeight: 16 },
  coverageCard: { marginTop: 24, padding: 16, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.11)", borderWidth: 1, borderColor: "rgba(255,255,255,0.16)", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  coverageLabel: { color: "#D8E7FF", fontSize: 11, fontWeight: "800" },
  coverageValue: { color: "#FFFFFF", fontSize: 44, fontWeight: "900", letterSpacing: -1.6, marginTop: 3 },
  coverageHint: { color: "#9EB1CA", fontSize: 10.5, fontWeight: "700", marginTop: 2 },
  errorCard: { marginHorizontal: 16, marginTop: 14, padding: 14, borderRadius: 18, backgroundColor: "rgba(220, 38, 38, 0.10)", borderWidth: 1, borderColor: "rgba(220, 38, 38, 0.26)", flexDirection: "row", alignItems: "center", gap: 9 },
  errorText: { flex: 1, color: ui.soft, fontSize: 11, fontWeight: "700" },
  tablePanel: { marginHorizontal: 16, marginTop: 14, backgroundColor: ui.card, borderRadius: 24, padding: 15, borderWidth: 1, borderColor: ui.line, shadowColor: "#000000", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 2 },
  tableHeader: { marginBottom: 14 },
  tableTitle: { color: ui.ink, fontSize: 16, fontWeight: "900" },
  tableMeta: { color: ui.soft, fontSize: 10.5, fontWeight: "700", marginTop: 4 },
  loadingBlock: { alignItems: "center", paddingVertical: 24, gap: 8 },
  loadingText: { color: ui.soft, fontSize: 11, fontWeight: "800" },
  emptyBlock: { alignItems: "center", paddingVertical: 24 },
  emptyTitle: { color: ui.ink, fontSize: 13, fontWeight: "900", marginTop: 8 },
  emptyText: { color: ui.soft, fontSize: 11, fontWeight: "700", marginTop: 4, textAlign: "center" },
  deviceRow: { backgroundColor: "#FFFFFF", borderRadius: 20, borderWidth: 1, borderColor: ui.line, padding: 14, marginBottom: 10 },
  deviceRowLast: { marginBottom: 0 },
  deviceTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  deviceName: { flex: 1, color: ui.ink, fontSize: 13, fontWeight: "800" },
  countPill: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 4 },
  countPillText: { fontSize: 10, fontWeight: "800" },
  deviceBottomRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 7, gap: 8 },
  deviceMeta: { flex: 1, color: ui.soft, fontSize: 11, fontWeight: "600" },
  notePanel: { marginHorizontal: 16, marginTop: 14, backgroundColor: ui.card, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: ui.line },
  noteTitle: { color: ui.ink, fontSize: 14, fontWeight: "900" },
  noteText: { color: ui.soft, fontSize: 12, fontWeight: "700", lineHeight: 18, marginTop: 5 },
});
