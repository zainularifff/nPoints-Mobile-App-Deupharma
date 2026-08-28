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
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";

import {
  fetchDeviceAging,
  type MobileAgingDevice,
  type MobileDeviceAgingSummary,
} from "../../services/opsMobileService";
import { formatNumber } from "../../utils/formatters";
import { colors, tones } from "../../theme/colors";
import { radius } from "../../theme/spacing";

const emptySummary: MobileDeviceAgingSummary = {
  totalDevices: 0,
  agingDevices: 0,
  monitorDevices: 0,
  healthyDevices: 0,
  unknownAgeDevices: 0,
  agingMinYears: 5,
  devices: [],
};

const PAGE_SIZE = 25;

export default function AgingDevicesScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [summary, setSummary] = useState<MobileDeviceAgingSummary>(emptySummary);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);

  const load = useCallback(async (force = false) => {
    if (force) setRefreshing(true);
    else setLoading(true);

    try {
      const result = await fetchDeviceAging({ force });
      setSummary(result);
      setPage(0);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err || "Failed to load aging device data."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  const pageCount = Math.max(1, Math.ceil(summary.devices.length / PAGE_SIZE));
  const pageDevices = summary.devices.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  function openDevice(device: MobileAgingDevice) {
    navigation.navigate("DeviceQuickView", {
      device: device.deviceName,
      site: device.department,
      status: device.status,
      lastSeen: device.lastSeen,
      risk: "High",
      category: "Aging Hardware",
      action: `This device is approximately ${device.ageYears} years old, past the PC Aging Rule threshold (${summary.agingMinYears}y). Plan for replacement or further evaluation.`,
    });
  }

  return (
    <View style={styles.page}>
      <View style={{ height: insets.top, backgroundColor: colors.background }} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: Math.max(insets.bottom, 24) }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => load(true)}
            tintColor={colors.blueBright}
            colors={[colors.blueBright]}
            progressBackgroundColor={colors.surfaceSoft}
          />
        }
      >
        <View style={styles.headerRow}>
          <TouchableOpacity style={styles.backButton} activeOpacity={0.85} onPress={() => navigation.goBack()}>
            <Ionicons name="chevron-back" size={20} color={colors.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.hello}>CRITICAL RISK</Text>
            <Text style={styles.screenTitle}>Aging Devices</Text>
          </View>
        </View>

        <Text style={styles.subtitle}>
          Devices older than {summary.agingMinYears} year(s), based on hardware age (BIOS date) — same rule as the PC Aging Rule setting.
        </Text>

        {error ? (
          <View style={styles.errorCard}>
            <Ionicons name="warning" size={17} color={colors.red} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatNumber(summary.agingDevices)}</Text>
            <Text style={styles.statLabel}>Aging</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatNumber(summary.monitorDevices)}</Text>
            <Text style={styles.statLabel}>Monitor</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatNumber(summary.healthyDevices)}</Text>
            <Text style={styles.statLabel}>Healthy</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.blueBright} />
          </View>
        ) : summary.devices.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="checkmark-done-circle" size={24} color={colors.textSoft} />
            <Text style={styles.emptyText}>No devices are past the aging threshold.</Text>
          </View>
        ) : (
          <>
            {pageDevices.map((device: MobileAgingDevice) => (
              <TouchableOpacity
                key={device.id}
                style={styles.deviceCard}
                activeOpacity={0.8}
                onPress={() => openDevice(device)}
              >
                <View style={styles.deviceCardTop}>
                  <View style={styles.deviceIcon}>
                    <Ionicons name="hardware-chip" size={16} color={tones.red.text} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.deviceName} numberOfLines={1}>{device.deviceName}</Text>
                    <Text style={styles.deviceMeta} numberOfLines={1}>{device.model || device.platform || "-"} • {device.department}</Text>
                  </View>
                  <View style={styles.agePill}>
                    <Text style={styles.ageText}>{device.ageYears}y</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color={colors.textSoft} />
                </View>
                <View style={styles.deviceCardBottom}>
                  <Text style={styles.deviceDetailLabel}>Last seen</Text>
                  <Text style={styles.deviceDetailValue} numberOfLines={1}>{device.lastSeen}</Text>
                </View>
              </TouchableOpacity>
            ))}

            {pageCount > 1 ? (
              <View style={styles.pagination}>
                <TouchableOpacity
                  style={[styles.pageButton, page === 0 && styles.pageButtonDisabled]}
                  activeOpacity={0.8}
                  disabled={page === 0}
                  onPress={() => setPage((p) => Math.max(0, p - 1))}
                >
                  <Ionicons name="chevron-back" size={16} color={page === 0 ? colors.muted : colors.text} />
                </TouchableOpacity>
                <Text style={styles.pageLabel}>Page {page + 1} of {pageCount}</Text>
                <TouchableOpacity
                  style={[styles.pageButton, page >= pageCount - 1 && styles.pageButtonDisabled]}
                  activeOpacity={0.8}
                  disabled={page >= pageCount - 1}
                  onPress={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                >
                  <Ionicons name="chevron-forward" size={16} color={page >= pageCount - 1 ? colors.muted : colors.text} />
                </TouchableOpacity>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  headerRow: { flexDirection: "row", alignItems: "center", paddingTop: 16, marginBottom: 10, gap: 12 },
  backButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  hello: { color: colors.blueBright, fontSize: 11, fontWeight: "700", letterSpacing: 1.4 },
  screenTitle: { color: colors.text, fontSize: 22, fontWeight: "800", letterSpacing: -0.5, marginTop: 2 },
  subtitle: { color: colors.textSoft, fontSize: 12, fontWeight: "500", lineHeight: 17, marginBottom: 16 },

  pagination: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16, paddingVertical: 12, marginTop: 4 },
  pageButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  pageButtonDisabled: { opacity: 0.4 },
  pageLabel: { color: colors.textSoft, fontSize: 12, fontWeight: "600" },

  errorCard: { marginBottom: 14, padding: 14, borderRadius: radius.lg, backgroundColor: "rgba(220, 38, 38, 0.10)", borderWidth: 1, borderColor: "rgba(220, 38, 38, 0.26)", flexDirection: "row", alignItems: "center", gap: 9 },
  errorText: { flex: 1, color: colors.textSoft, fontSize: 11.5, fontWeight: "500", lineHeight: 16 },

  statsRow: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingVertical: 14, marginBottom: 16 },
  statItem: { flex: 1, alignItems: "center" },
  statValue: { color: colors.text, fontSize: 18, fontWeight: "800" },
  statLabel: { color: colors.textSoft, fontSize: 10.5, fontWeight: "600", marginTop: 3 },
  statDivider: { width: 1, height: 28, backgroundColor: colors.border },

  loadingWrap: { paddingVertical: 40, alignItems: "center" },
  emptyCard: { paddingVertical: 40, alignItems: "center", gap: 8 },
  emptyText: { color: colors.textSoft, fontSize: 12.5, fontWeight: "500" },

  deviceCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderSoft, padding: 14, marginBottom: 10 },
  deviceCardTop: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  deviceIcon: { width: 32, height: 32, borderRadius: 10, borderWidth: 1, borderColor: tones.red.border, backgroundColor: tones.red.bg, alignItems: "center", justifyContent: "center" },
  deviceName: { color: colors.text, fontSize: 13.5, fontWeight: "700" },
  deviceMeta: { color: colors.textSoft, fontSize: 11, fontWeight: "500", marginTop: 2 },
  agePill: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, backgroundColor: tones.red.bg },
  ageText: { color: tones.red.text, fontSize: 10.5, fontWeight: "800" },

  deviceCardBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.borderSoft },
  deviceDetailLabel: { color: colors.textSoft, fontSize: 10.5, fontWeight: "600" },
  deviceDetailValue: { color: colors.text, fontSize: 11.5, fontWeight: "600", flexShrink: 1, textAlign: "right", marginLeft: 10 },
});
