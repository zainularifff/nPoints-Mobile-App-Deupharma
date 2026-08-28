import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Plus,
  RefreshCcw,
  Ticket,
  Timer,
} from "lucide-react-native";

import StatusPill from "../../components/StatusPill";
import {
  classifyTicketAlert,
  fetchTicketAlerts,
  type MobileTicketAlert,
} from "../../services/opsMobileService";
import { formatNumber } from "../../utils/formatters";
import { colors, drilldownPalette } from "../../theme/colors";

const ui = drilldownPalette;

export default function TicketSummaryScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [alerts, setAlerts] = useState<MobileTicketAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadAlerts = useCallback(async (force = false) => {
    if (force) setRefreshing(true);
    else setLoading(true);

    try {
      const rows = await fetchTicketAlerts({ force });
      setAlerts(rows);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err || "Failed to load ticket data."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAlerts(false);
  }, [loadAlerts]);

  // Same classification used by the drilldown list screen, so the count
  // shown here always matches what you see after tapping in — no more two
  // different numbers for the same bucket.
  const criticalCount = useMemo(() => alerts.filter((a) => classifyTicketAlert(a) === "critical").length, [alerts]);
  const pendingCount = useMemo(() => alerts.filter((a) => classifyTicketAlert(a) === "pending").length, [alerts]);
  const progressCount = useMemo(() => alerts.filter((a) => classifyTicketAlert(a) === "progress").length, [alerts]);

  const ticketBreakdown = useMemo(
    () => [
      {
        label: "All Open Tickets",
        value: alerts.length,
        desc: "Every open ticket in the service desk queue",
        tone: "blue" as const,
        type: "all",
      },
      {
        label: "Critical Tickets",
        value: criticalCount,
        desc: "Highest severity — review first",
        tone: "red" as const,
        type: "critical",
      },
      {
        label: "Pending Assignment",
        value: pendingCount,
        desc: "Waiting for owner or first response",
        tone: "amber" as const,
        type: "pending",
      },
      {
        label: "In Progress",
        value: progressCount,
        desc: "Currently being worked on",
        tone: "blue" as const,
        type: "progress",
      },
    ],
    [alerts.length, criticalCount, pendingCount, progressCount]
  );

  function openTicketList(type: string, title: string, subtitle: string) {
    navigation.navigate("TicketWorkloadList", {
      type,
      title,
      subtitle,
    });
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 104 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadAlerts(true)} />}
    >
      <View style={{ height: insets.top, backgroundColor: ui.navy }} />
      <LinearGradient colors={[ui.navy, ui.navy2, "#3B33C4"]} style={styles.hero}>
        <View style={styles.heroOrb} />
        <View style={styles.heroTop}>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>TICKET DRILLDOWN</Text>
            <Text style={styles.title}>Ticket Workload</Text>
            <Text style={styles.meta}>Live open ticket queue from the service desk.</Text>
          </View>
          <View style={styles.heroActions}>
            <TouchableOpacity
              style={styles.newTicketButton}
              onPress={() => navigation.navigate("CreateTicket")}
              activeOpacity={0.85}
            >
              <Plus size={18} color="#FFFFFF" strokeWidth={2.8} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.refreshButton} onPress={() => loadAlerts(true)} activeOpacity={0.85}>
              {loading || refreshing ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <RefreshCcw size={18} color="#FFFFFF" strokeWidth={2.8} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.coverageCard}>
          <View>
            <Text style={styles.coverageLabel}>Open Support Workload</Text>
            <Text style={styles.coverageValue}>{formatNumber(alerts.length)}</Text>
            <Text style={styles.coverageHint}>Live ticket pressure suitable for mobile monitoring</Text>
          </View>
          <Ticket size={32} color="#E0E7FF" strokeWidth={2.8} />
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
          activeOpacity={0.86}
          onPress={() => openTicketList("critical", "Critical Tickets", "Highest severity — review first")}
        >
          <View style={[styles.summaryIcon, { backgroundColor: "rgba(220, 38, 38, 0.12)" }]}>
            <AlertTriangle size={18} color={ui.red} strokeWidth={2.8} />
          </View>
          <Text style={styles.summaryValue}>{formatNumber(criticalCount)}</Text>
          <Text style={styles.summaryTitle}>Critical</Text>
          <Text style={styles.summaryHint}>Highest severity — review first</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.summaryCard}
          activeOpacity={0.86}
          onPress={() => openTicketList("pending", "Pending Tickets", "Waiting for owner or first response")}
        >
          <View style={[styles.summaryIcon, { backgroundColor: "rgba(217, 119, 6, 0.12)" }]}>
            <Clock3 size={18} color={ui.amber} strokeWidth={2.8} />
          </View>
          <Text style={styles.summaryValue}>{formatNumber(pendingCount)}</Text>
          <Text style={styles.summaryTitle}>Pending</Text>
          <Text style={styles.summaryHint}>Waiting for owner or first response</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tablePanel}>
        <View style={styles.tableHeader}>
          <Text style={styles.tableTitle}>Ticket Queue</Text>
          <Text style={styles.tableMeta}>Tap a category to view its list</Text>
        </View>

        {ticketBreakdown.map((item, index) => (
          <TouchableOpacity
            key={item.label}
            activeOpacity={0.85}
            onPress={() => openTicketList(item.type, item.label, item.desc)}
            style={[styles.row, index === ticketBreakdown.length - 1 ? null : styles.rowDivider]}
          >
            <View style={styles.rowIcon}>
              {item.type === "critical" ? (
                <AlertTriangle size={18} color={ui.red} strokeWidth={2.7} />
              ) : item.type === "pending" ? (
                <Clock3 size={18} color={ui.amber} strokeWidth={2.7} />
              ) : item.type === "progress" ? (
                <Timer size={18} color={ui.blue} strokeWidth={2.7} />
              ) : (
                <Ticket size={18} color={ui.blue} strokeWidth={2.7} />
              )}
            </View>

            <View style={styles.rowTextWrap}>
              <Text style={styles.rowTitle}>{item.label}</Text>
              <Text style={styles.rowDesc}>{item.desc}</Text>
            </View>

            <View style={styles.rowRight}>
              <Text style={styles.rowValue}>{formatNumber(item.value)}</Text>
              <StatusPill
                label={item.type === "critical" ? "Action" : "View"}
                tone={item.tone}
              />
            </View>
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => openTicketList("resolved", "Resolved Tickets", "Ticket resolution history")}
          style={styles.row}
        >
          <View style={styles.rowIcon}>
            <CheckCircle2 size={18} color={ui.green} strokeWidth={2.7} />
          </View>

          <View style={styles.rowTextWrap}>
            <Text style={styles.rowTitle}>Resolved Today</Text>
            <Text style={styles.rowDesc}>Not available in the mobile view yet</Text>
          </View>

          <View style={styles.rowRight}>
            <Text style={styles.rowValue}>-</Text>
            <StatusPill label="View" tone="green" />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.notePanel}>
        <Text style={styles.noteTitle}>Mobile scope</Text>
        <Text style={styles.noteText}>
          This mobile view only shows support workload summary and selected
          ticket previews. Full ticket notes, attachments, history and advanced
          filters remain in the main EMA web system.
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
  heroActions: { flexDirection: "row", gap: 8 },
  newTicketButton: { width: 42, height: 42, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: colors.blue, borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
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
  tablePanel: { marginHorizontal: 16, marginTop: 14, backgroundColor: ui.card, borderRadius: 24, paddingHorizontal: 15, paddingTop: 15, paddingBottom: 4, borderWidth: 1, borderColor: ui.line, shadowColor: "#000000", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 2 },
  tableHeader: { marginBottom: 6 },
  tableTitle: { color: ui.ink, fontSize: 16, fontWeight: "900" },
  tableMeta: { color: ui.soft, fontSize: 10.5, fontWeight: "700", marginTop: 4, marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", paddingVertical: 14 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: ui.line },
  rowIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: ui.bg, borderWidth: 1, borderColor: ui.line, alignItems: "center", justifyContent: "center", marginRight: 11 },
  rowTextWrap: { flex: 1 },
  rowTitle: { color: ui.ink, fontSize: 13, fontWeight: "900" },
  rowDesc: { color: ui.soft, fontSize: 11, fontWeight: "700", marginTop: 3 },
  rowRight: { alignItems: "flex-end", gap: 6 },
  rowValue: { color: ui.ink, fontSize: 18, fontWeight: "900" },
  notePanel: { marginHorizontal: 16, marginTop: 14, backgroundColor: ui.card, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: ui.line },
  noteTitle: { color: ui.ink, fontSize: 14, fontWeight: "900" },
  noteText: { color: ui.soft, fontSize: 12, fontWeight: "700", lineHeight: 18, marginTop: 5 },
});
