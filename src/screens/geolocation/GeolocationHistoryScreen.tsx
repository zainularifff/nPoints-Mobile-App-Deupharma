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
import { ArrowLeft, CalendarClock, MapPin, Navigation, RefreshCcw, UserRound } from "lucide-react-native";

import {
  fetchDeviceLocationHistory,
  type MobileDeviceLocation,
  type MobileGeolocationDevice,
} from "../../services/opsMobileService";
import DeviceLocationMap from "../../components/DeviceLocationMap";
import { colors, drilldownPalette } from "../../theme/colors";
import { formatNumber } from "../../utils/formatters";

const ui = drilldownPalette;

export default function GeolocationHistoryScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();
  const device = route.params?.device as MobileGeolocationDevice | undefined;
  const [records, setRecords] = useState<MobileDeviceLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadHistory = useCallback(async (force = false) => {
    if (!device) return;
    if (force) setRefreshing(true);
    else setLoading(true);

    try {
      const rows = await fetchDeviceLocationHistory(device, { limit: 10, locationLimit: 3000, force });
      setRecords(rows);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err || "Failed to load location history."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [device]);

  useEffect(() => {
    loadHistory(false);
  }, [loadHistory]);

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 104 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadHistory(true)} />}
    >
      <View style={{ height: insets.top, backgroundColor: ui.navy }} />
      <LinearGradient colors={[ui.navy, ui.navy2, "#3B33C4"]} style={styles.hero}>
        <View style={styles.heroTop}>
          <TouchableOpacity style={styles.backPill} activeOpacity={0.85} onPress={() => navigation.goBack()}>
            <ArrowLeft size={16} color="#FFFFFF" strokeWidth={2.8} />
            <Text style={styles.backText}>Device table</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.refreshButton} onPress={() => loadHistory(true)} activeOpacity={0.85}>
            {loading || refreshing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <RefreshCcw size={18} color="#FFFFFF" strokeWidth={2.8} />
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.eyebrow}>LATEST 10 GEOLOCATION RECORDS</Text>
        <Text style={styles.title}>{device?.deviceName || "Device"}</Text>
        <Text style={styles.meta}>{device?.branch || "-"}</Text>

        <View style={styles.coverageCard}>
          <View>
            <Text style={styles.coverageLabel}>Records Loaded</Text>
            <Text style={styles.coverageValue}>{formatNumber(records.length)}</Text>
          </View>
          <MapPin size={32} color="#E0E7FF" strokeWidth={2.8} />
        </View>
      </LinearGradient>

      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <View style={styles.deviceCard}>
        <Text style={styles.sectionTitle}>Device Information</Text>
        <InfoLine label="Device ID" value={device?.deviceId || "-"} />
        <InfoLine label="Model" value={device?.model || "-"} />
        <InfoLine label="Platform" value={device?.platform || "-"} />
        <InfoLine label="IP Address" value={device?.ipAddress || "-"} />
      </View>

      {records.length > 0 ? (
        <View style={styles.mapPanel}>
          <View style={styles.historyHeader}>
            <View>
              <Text style={styles.sectionTitle}>Latest Location</Text>
              <Text style={styles.sectionSub}>{records[0].time}</Text>
            </View>
          </View>
          <View style={styles.mapWrap}>
            <DeviceLocationMap
              latitude={records[0].latitude}
              longitude={records[0].longitude}
              size={260}
            />
          </View>
        </View>
      ) : null}

      <View style={styles.historyPanel}>
        <View style={styles.historyHeader}>
          <View>
            <Text style={styles.sectionTitle}>Location History</Text>
            <Text style={styles.sectionSub}>Only latest 10 records are displayed</Text>
          </View>
          <Text style={styles.badge}>10 max</Text>
        </View>

        {loading && records.length === 0 ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="small" color={ui.cyan} />
            <Text style={styles.loadingText}>Loading latest location records...</Text>
          </View>
        ) : records.length === 0 ? (
          <View style={styles.emptyBlock}>
            <MapPin size={24} color={ui.muted} strokeWidth={2.7} />
            <Text style={styles.emptyTitle}>No location history found</Text>
          </View>
        ) : (
          records.map((item, index) => (
            <View key={item.id} style={[styles.historyRow, index === records.length - 1 && styles.lastRow]}>
              <View style={styles.pinIcon}>
                <Text style={styles.rowNumber}>{index + 1}</Text>
              </View>
              <View style={styles.historyTextWrap}>
                <Text style={styles.address} numberOfLines={2}>{item.address}</Text>
                <View style={styles.metaLine}>
                  <CalendarClock size={12} color={ui.muted} strokeWidth={2.6} />
                  <Text style={styles.rowMeta}>{item.time}</Text>
                </View>
                <View style={styles.metaLine}>
                  <UserRound size={12} color={ui.muted} strokeWidth={2.6} />
                  <Text style={styles.rowMeta}>{item.username}</Text>
                </View>
                <View style={styles.metaLine}>
                  <Navigation size={12} color={ui.muted} strokeWidth={2.6} />
                  <Text style={styles.rowMeta}>{item.latitude}, {item.longitude}</Text>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoLine}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: ui.bg },
  hero: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 28, borderBottomLeftRadius: 34, borderBottomRightRadius: 34, overflow: "hidden" },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 22 },
  backPill: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.14)", borderWidth: 1, borderColor: "rgba(255,255,255,0.16)" },
  backText: { color: "#FFFFFF", fontSize: 11, fontWeight: "900" },
  refreshButton: { width: 42, height: 42, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.16)", borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
  eyebrow: { color: "#9DC2FF", fontSize: 11, fontWeight: "900", letterSpacing: 1.2 },
  title: { color: "#FFFFFF", fontSize: 28, fontWeight: "900", letterSpacing: -1, marginTop: 6 },
  meta: { color: "#B5C7DE", fontSize: 11, fontWeight: "700", marginTop: 7 },
  coverageCard: { marginTop: 22, padding: 16, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.11)", borderWidth: 1, borderColor: "rgba(255,255,255,0.16)", flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  coverageLabel: { color: "#D8E7FF", fontSize: 11, fontWeight: "800" },
  coverageValue: { color: "#FFFFFF", fontSize: 40, fontWeight: "900", letterSpacing: -1.4, marginTop: 3 },
  errorCard: { marginHorizontal: 16, marginTop: 14, padding: 13, borderRadius: 18, backgroundColor: "rgba(220, 38, 38, 0.10)", borderWidth: 1, borderColor: "rgba(220, 38, 38, 0.26)" },
  errorText: { color: colors.red, fontSize: 11, fontWeight: "800" },
  deviceCard: { marginHorizontal: 16, marginTop: -16, backgroundColor: ui.card, borderRadius: 24, padding: 15, borderWidth: 1, borderColor: ui.line, shadowColor: "#000000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 2 },
  sectionTitle: { color: ui.ink, fontSize: 16, fontWeight: "900" },
  sectionSub: { color: ui.soft, fontSize: 10.5, fontWeight: "700", marginTop: 4 },
  infoLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 12, borderTopWidth: 1, borderTopColor: "#16223A", marginTop: 12 },
  infoLabel: { color: ui.soft, fontSize: 10.5, fontWeight: "800" },
  infoValue: { flex: 1, textAlign: "right", color: ui.ink, fontSize: 11, fontWeight: "900", marginLeft: 12 },
  mapPanel: { marginHorizontal: 16, marginTop: 14, backgroundColor: ui.card, borderRadius: 24, padding: 15, borderWidth: 1, borderColor: ui.line, shadowColor: "#000000", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 2 },
  mapWrap: { alignItems: "center", marginTop: 4 },
  historyPanel: { marginHorizontal: 16, marginTop: 14, backgroundColor: ui.card, borderRadius: 24, padding: 15, borderWidth: 1, borderColor: ui.line, shadowColor: "#000000", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 2 },
  historyHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 },
  badge: { color: ui.cyan, fontSize: 10, fontWeight: "900", backgroundColor: "rgba(8, 145, 178, 0.12)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  loadingBlock: { alignItems: "center", paddingVertical: 24, gap: 8 },
  loadingText: { color: ui.soft, fontSize: 11, fontWeight: "800" },
  emptyBlock: { alignItems: "center", paddingVertical: 24 },
  emptyTitle: { color: ui.ink, fontSize: 13, fontWeight: "900", marginTop: 8 },
  historyRow: { flexDirection: "row", paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: "#16223A" },
  lastRow: { borderBottomWidth: 0 },
  pinIcon: { width: 34, height: 34, borderRadius: 13, backgroundColor: "rgba(8, 145, 178, 0.12)", alignItems: "center", justifyContent: "center", marginRight: 11 },
  rowNumber: { color: ui.cyan, fontSize: 12, fontWeight: "900" },
  historyTextWrap: { flex: 1 },
  address: { color: ui.ink, fontSize: 12.5, fontWeight: "900", lineHeight: 17 },
  metaLine: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 5 },
  rowMeta: { flex: 1, color: ui.soft, fontSize: 10.5, fontWeight: "700" },
});
