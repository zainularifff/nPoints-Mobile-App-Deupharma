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
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  MonitorCog,
  RefreshCcw,
  Ticket,
  Timer,
  UserRound,
} from "lucide-react-native";

import StatusPill from "../../components/StatusPill";
import {
  classifyTicketAlert,
  fetchTicketAlerts,
  type MobileTicketAlert,
} from "../../services/opsMobileService";
import { formatNumber } from "../../utils/formatters";
import { drilldownPalette } from "../../theme/colors";

const ui = drilldownPalette;

const screenConfig: any = {
  all: {
    eyebrow: "ALL OPEN TICKETS",
    title: "All Open Tickets",
    subtitle: "Every ticket currently open in the service desk queue.",
    color: ui.blue,
    icon: Ticket,
    tone: "blue" as const,
    primaryLabel: "Open",
    sectionTitle: "Open Tickets",
    sectionDesc: "All currently open tickets, newest first.",
  },
  critical: {
    eyebrow: "CRITICAL TICKETS",
    title: "Critical Tickets",
    subtitle: "Open tickets flagged as critical severity, requiring immediate follow-up.",
    color: ui.red,
    icon: AlertTriangle,
    tone: "red" as const,
    primaryLabel: "Critical",
    sectionTitle: "Critical Tickets",
    sectionDesc: "Prioritise these tickets first.",
  },
  pending: {
    eyebrow: "PENDING TICKET QUEUE",
    title: "Pending Tickets",
    subtitle: "Tickets waiting for assignment, approval, or first response.",
    color: ui.amber,
    icon: Clock3,
    tone: "amber" as const,
    primaryLabel: "Pending",
    sectionTitle: "Pending Action Items",
    sectionDesc: "Review tickets waiting for owner or approval.",
  },
  progress: {
    eyebrow: "IN PROGRESS QUEUE",
    title: "In Progress Tickets",
    subtitle: "Tickets currently being handled by support or operations team.",
    color: ui.blue,
    icon: Timer,
    tone: "blue" as const,
    primaryLabel: "In Progress",
    sectionTitle: "Tickets Being Handled",
    sectionDesc: "Monitor active support workload and owner progress.",
  },
  resolved: {
    eyebrow: "RESOLVED TICKETS",
    title: "Resolved Tickets",
    subtitle: "Ticket resolution history.",
    color: ui.green,
    icon: CheckCircle2,
    tone: "green" as const,
    primaryLabel: "Resolved",
    sectionTitle: "Resolved Today",
    sectionDesc: "Not available in the mobile view yet.",
  },
};

export default function TicketWorkloadListScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const params = route.params || {};
  const type = params.type in screenConfig ? params.type : "critical";
  const config = screenConfig[type] || screenConfig.critical;
  const Icon = config.icon;

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

  const records = useMemo(() => {
    if (type === "resolved") return [];
    if (type === "all") return alerts;
    return alerts.filter((item) => classifyTicketAlert(item) === type);
  }, [alerts, type]);

  function openTicket(record: MobileTicketAlert) {
    navigation.navigate("TicketQuickView", {
      device: record.title,
      site: record.system,
      status: record.status,
      risk: record.severity === "Critical" || record.severity === "High" ? "High" : record.severity,
      category: "Service Desk Ticket",
      action: `Ticket owner: ${record.owner}. Review this ticket in the main EMA web system for full details, comments and attachments.`,
    });
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 104 }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        type !== "resolved" ? (
          <RefreshControl refreshing={refreshing} onRefresh={() => loadAlerts(true)} />
        ) : undefined
      }
    >
      <View style={{ height: insets.top, backgroundColor: ui.navy }} />
      <LinearGradient colors={[ui.navy, ui.navy2, "#3B33C4"]} style={styles.hero}>
        <View style={styles.heroOrb} />
        <View style={styles.heroTop}>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>{config.eyebrow}</Text>
            <Text style={styles.title}>{config.title}</Text>
            <Text style={styles.meta}>{config.subtitle}</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={() => loadAlerts(true)} activeOpacity={0.85}>
            {loading || refreshing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <RefreshCcw size={18} color="#FFFFFF" strokeWidth={2.8} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.coverageCard}>
          <View>
            <Text style={styles.coverageLabel}>{config.sectionTitle}</Text>
            <Text style={styles.coverageValue}>
              {type === "resolved" ? "-" : formatNumber(records.length)}
            </Text>
            <Text style={styles.coverageHint}>{config.primaryLabel} tickets in this queue</Text>
          </View>
          <Icon size={32} color="#E0E7FF" strokeWidth={2.8} />
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
          <Text style={styles.tableTitle}>{config.sectionTitle}</Text>
          <Text style={styles.tableMeta}>{config.sectionDesc}</Text>
        </View>

        {type === "resolved" ? (
          <View style={styles.emptyBlock}>
            <CheckCircle2 size={22} color={ui.muted} strokeWidth={2.7} />
            <Text style={styles.emptyTitle}>Not available yet</Text>
            <Text style={styles.emptyText}>
              The mobile app only receives currently-open tickets from the
              service desk feed. Resolved ticket history isn't exposed here
              yet — check the main EMA web system for resolved tickets.
            </Text>
          </View>
        ) : loading && alerts.length === 0 ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="small" color={ui.cyan} />
            <Text style={styles.loadingText}>Loading ticket data...</Text>
          </View>
        ) : records.length === 0 ? (
          <View style={styles.emptyBlock}>
            <Ticket size={22} color={ui.muted} strokeWidth={2.7} />
            <Text style={styles.emptyTitle}>No tickets in this queue</Text>
            <Text style={styles.emptyText}>No open tickets currently match this category.</Text>
          </View>
        ) : (
          records.map((record, index) => (
            <TouchableOpacity
              key={record.id}
              activeOpacity={0.85}
              onPress={() => openTicket(record)}
              style={[styles.ticketRow, index === records.length - 1 && styles.ticketRowLast]}
            >
              <View style={styles.ticketCardTop}>
                <View style={styles.ticketIdentity}>
                  <View style={[styles.ticketIcon, { backgroundColor: `${config.color}18` }]}>
                    <Ticket size={18} color={config.color} strokeWidth={2.7} />
                  </View>
                  <View style={styles.ticketTitleWrap}>
                    <Text style={styles.ticketTitle}>{record.title}</Text>
                  </View>
                </View>

                <StatusPill
                  label={record.severity}
                  tone={record.severity === "Critical" || record.severity === "High" ? "red" : config.tone}
                />
              </View>

              <View style={styles.ticketInfoGrid}>
                <InfoMini icon={MonitorCog} label="System" value={record.system} />
                <InfoMini icon={UserRound} label="Owner" value={record.owner} />
              </View>

              <View style={styles.ticketFooter}>
                <Text style={styles.updatedText}>Status: {record.status}</Text>
                <Text style={[styles.openText, { color: config.color }]}>Tap for detail</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      <View style={styles.notePanel}>
        <Text style={styles.noteTitle}>Mobile scope</Text>
        <Text style={styles.noteText}>
          This screen displays open ticket previews only. Ticket comments,
          attachments, SLA audit trail and advanced filters remain in the main
          EMA web system.
        </Text>
      </View>
    </ScrollView>
  );
}

function InfoMini({ icon: Icon, label, value }: any) {
  return (
    <View style={styles.infoMini}>
      <Icon size={13} color={ui.muted} strokeWidth={2.6} />
      <View style={styles.infoMiniText}>
        <Text style={styles.infoMiniLabel}>{label}</Text>
        <Text style={styles.infoMiniValue} numberOfLines={1}>{value}</Text>
      </View>
    </View>
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
  tablePanel: { marginHorizontal: 16, marginTop: 14, backgroundColor: ui.card, borderRadius: 24, padding: 15, borderWidth: 1, borderColor: ui.line, shadowColor: "#000000", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 2 },
  tableHeader: { marginBottom: 12 },
  tableTitle: { color: ui.ink, fontSize: 16, fontWeight: "900" },
  tableMeta: { color: ui.soft, fontSize: 11, fontWeight: "700", marginTop: 3 },
  loadingBlock: { alignItems: "center", paddingVertical: 24, gap: 8 },
  loadingText: { color: ui.soft, fontSize: 11, fontWeight: "800" },
  emptyBlock: { alignItems: "center", paddingVertical: 24 },
  emptyTitle: { color: ui.ink, fontSize: 13, fontWeight: "900", marginTop: 8 },
  emptyText: { color: ui.soft, fontSize: 11, fontWeight: "700", marginTop: 4, textAlign: "center" },
  ticketRow: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 14, borderWidth: 1, borderColor: ui.line, marginBottom: 12 },
  ticketRowLast: { marginBottom: 0 },
  ticketCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 10 },
  ticketIdentity: { flex: 1, flexDirection: "row" },
  ticketIcon: { width: 42, height: 42, borderRadius: 15, alignItems: "center", justifyContent: "center", marginRight: 11 },
  ticketTitleWrap: { flex: 1 },
  ticketTitle: { color: ui.ink, fontSize: 13, fontWeight: "900", lineHeight: 17 },
  ticketInfoGrid: { marginTop: 14, backgroundColor: ui.bg, borderRadius: 18, padding: 12, gap: 10 },
  infoMini: { flexDirection: "row", alignItems: "center" },
  infoMiniText: { marginLeft: 7, flex: 1 },
  infoMiniLabel: { color: ui.muted, fontSize: 10, fontWeight: "800" },
  infoMiniValue: { color: ui.ink, fontSize: 11, fontWeight: "900", marginTop: 2 },
  ticketFooter: { marginTop: 13, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  updatedText: { color: ui.soft, fontSize: 10, fontWeight: "700" },
  openText: { fontSize: 10, fontWeight: "900" },
  notePanel: { marginHorizontal: 16, marginTop: 14, backgroundColor: ui.card, borderRadius: 24, padding: 16, borderWidth: 1, borderColor: ui.line },
  noteTitle: { color: ui.ink, fontSize: 14, fontWeight: "900" },
  noteText: { color: ui.soft, fontSize: 12, fontWeight: "700", lineHeight: 18, marginTop: 5 },
});
