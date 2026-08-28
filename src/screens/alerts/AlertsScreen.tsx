import React, { useMemo } from "react";
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

import { useMobileOpsSnapshot } from "../../hooks/useLiveOpsData";
import { cardShadow, colors, tones, type StatusTone } from "../../theme/colors";
import { radius } from "../../theme/spacing";
import { formatNumber } from "../../utils/formatters";

type PriorityItem = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: StatusTone;
  title: string;
  description: string;
  onPress: () => void;
};

export default function AlertsScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { snapshot, loading, refreshing, error, reloadSnapshot } = useMobileOpsSnapshot();

  const priorities = useMemo<PriorityItem[]>(() => {
    const items: PriorityItem[] = [];

    if (snapshot.endpoints.offline > 0) {
      items.push({
        id: "offline",
        icon: "cloud-offline",
        tone: "red",
        title: `${formatNumber(snapshot.endpoints.offline)} devices offline`,
        description: "Not connected right now — check power, network, or agent status.",
        onPress: () => navigation.navigate("ActiveDeviceList", { status: "offline" }),
      });
    }

    if (snapshot.tickets.slaExceeded > 0) {
      items.push({
        id: "sla",
        icon: "alert-circle",
        tone: "amber",
        title: `${formatNumber(snapshot.tickets.slaExceeded)} tickets exceeded SLA`,
        description: "Requires escalation or an owner update.",
        onPress: () => navigation.navigate("TicketSummary"),
      });
    }

    if (snapshot.endpoints.stale > 0) {
      items.push({
        id: "stale",
        icon: "time",
        tone: "amber",
        title: `${formatNumber(snapshot.endpoints.stale)} devices no check-in 7+ days`,
        description: "May be idle, offline, or not syncing telemetry.",
        onPress: () => navigation.navigate("ActiveDeviceList", { status: "stale" }),
      });
    }

    if (snapshot.patch.missingPatchDevices > 0) {
      items.push({
        id: "patch",
        icon: "download",
        tone: "cyan",
        title: `${formatNumber(snapshot.patch.missingPatchDevices)} device(s) need patching`,
        description: `${snapshot.patch.complianceRate}% patch compliance across ${formatNumber(snapshot.patch.scannedDevices)} scanned devices.`,
        onPress: () => navigation.navigate("ActiveDeviceList", { status: "all" }),
      });
    }

    return items;
  }, [navigation, snapshot]);

  return (
    <View style={styles.page}>
      <View style={{ height: insets.top, backgroundColor: colors.background }} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 18, paddingTop: 16, paddingBottom: Math.max(insets.bottom, 24) }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => reloadSnapshot({ silent: true })}
            tintColor={colors.blueBright}
            colors={[colors.blueBright]}
          />
        }
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Alerts</Text>
            <Text style={styles.subtitle}>Live · as of {snapshot.generatedAt}</Text>
          </View>
          {loading || refreshing ? <ActivityIndicator size="small" color={colors.blueBright} /> : null}
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <Ionicons name="warning" size={16} color={colors.red} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {priorities.length === 0 && !loading ? (
          <View style={styles.emptyCard}>
            <Ionicons name="checkmark-circle" size={28} color={colors.green} />
            <Text style={styles.emptyTitle}>All clear</Text>
            <Text style={styles.emptyText}>No open priorities right now — endpoints, tickets and patches are within normal range.</Text>
          </View>
        ) : (
          priorities.map((item) => {
            const t = tones[item.tone];
            return (
              <TouchableOpacity key={item.id} style={styles.priorityRow} activeOpacity={0.85} onPress={item.onPress}>
                <View style={[styles.priorityIcon, { backgroundColor: t.bg, borderColor: t.border }]}>
                  <Ionicons name={item.icon} size={19} color={t.text} />
                </View>
                <View style={styles.priorityTextWrap}>
                  <Text style={styles.priorityTitle}>{item.title}</Text>
                  <Text style={styles.priorityDesc} numberOfLines={2}>{item.description}</Text>
                </View>
                <Ionicons name="chevron-forward" size={17} color={colors.muted} />
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  title: { color: colors.text, fontSize: 27, fontWeight: "800", letterSpacing: -0.8 },
  subtitle: { color: colors.textSoft, fontSize: 12, fontWeight: "500", marginTop: 4 },
  errorCard: { flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: "rgba(220, 38, 38, 0.10)", borderWidth: 1, borderColor: "rgba(220, 38, 38, 0.26)", borderRadius: radius.lg, padding: 14, marginBottom: 14 },
  errorText: { flex: 1, color: colors.textSoft, fontSize: 11.5, fontWeight: "500" },
  emptyCard: { alignItems: "center", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft, borderRadius: radius.xl, padding: 28, ...cardShadow },
  emptyTitle: { color: colors.text, fontSize: 15, fontWeight: "700", marginTop: 10 },
  emptyText: { color: colors.textSoft, fontSize: 12, fontWeight: "500", textAlign: "center", marginTop: 6, lineHeight: 18 },
  priorityRow: { flexDirection: "row", alignItems: "center", backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderSoft, borderRadius: radius.lg, padding: 14, marginBottom: 10, ...cardShadow },
  priorityIcon: { width: 42, height: 42, borderRadius: radius.md, borderWidth: 1, alignItems: "center", justifyContent: "center", marginRight: 12 },
  priorityTextWrap: { flex: 1, paddingRight: 8 },
  priorityTitle: { color: colors.text, fontSize: 13.5, fontWeight: "700" },
  priorityDesc: { color: colors.textSoft, fontSize: 11.5, fontWeight: "500", marginTop: 3, lineHeight: 16 },
});
