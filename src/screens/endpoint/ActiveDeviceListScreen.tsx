import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  MapPin,
  MonitorCog,
  RefreshCcw,
  Search,
  WifiOff,
} from "lucide-react-native";

import StatusPill from "../../components/StatusPill";
import {
  fetchEndpointDevices,
  type EndpointDeviceStatusFilter,
  type MobileEndpointDevice,
} from "../../services/opsMobileService";
import { formatNumber } from "../../utils/formatters";
import { drilldownPalette } from "../../theme/colors";

const PAGE_SIZE = 10;
// Was 500 — silently truncated the device list (and the "All inventory
// devices" total, since that reads records.length) below the real fleet
// size on any tenant with more than 500 endpoints. Raised well past
// realistic fleet sizes; list rendering itself is already paginated
// client-side (PAGE_SIZE above), so this only affects the one-time fetch.
const DEVICE_FETCH_LIMIT = 5000;
const ALL_BRANCHES = "__all_branches__";

const ui = drilldownPalette;

const titleMap: Record<EndpointDeviceStatusFilter, { title: string; subtitle: string; scopeLabel: string }> = {
  all: {
    title: "Managed Endpoints",
    subtitle: "All live endpoint records from hardware inventory.",
    scopeLabel: "All inventory devices",
  },
  online: {
    title: "Online Devices",
    subtitle: "Devices currently reporting as online.",
    scopeLabel: "Online records only",
  },
  offline: {
    title: "Offline Devices",
    subtitle: "Devices currently not reporting or disconnected.",
    scopeLabel: "Offline records only",
  },
  stale: {
    title: "No Check-in 7+ Days",
    subtitle: "Devices that haven't reported in over a week - may be idle, offline, or not syncing.",
    scopeLabel: "No recent check-in",
  },
};

function resolveFilter(value: unknown): EndpointDeviceStatusFilter {
  const text = String(value || "all").toLowerCase();
  if (text === "online" || text === "today") return "online";
  if (text === "offline") return "offline";
  if (text === "stale") return "stale";
  return "all";
}

function getBranchName(value: unknown) {
  const text = String(value || "").trim();
  return text || "Unassigned Branch";
}

function matchesStatus(record: MobileEndpointDevice, filter: EndpointDeviceStatusFilter) {
  if (filter === "online") return record.isOnline;
  if (filter === "offline") return !record.isOnline;
  if (filter === "stale") return record.isStale;
  return true;
}

function matchesBranch(record: MobileEndpointDevice, selectedBranch: string) {
  if (selectedBranch === ALL_BRANCHES) return true;
  return getBranchName(record.branch) === selectedBranch;
}

function matchesSearch(record: MobileEndpointDevice, query: string) {
  const keyword = query.trim().toLowerCase();
  if (!keyword) return true;

  return [
    record.deviceName,
    record.deviceId,
    record.branch,
    record.status,
    record.platform,
    record.model,
    record.ipAddress,
    record.source,
  ]
    .join(" ")
    .toLowerCase()
    .includes(keyword);
}

export default function ActiveDeviceListScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const [statusFilter, setStatusFilter] = useState<EndpointDeviceStatusFilter>(() =>
    resolveFilter(route.params?.status || route.params?.filter)
  );
  const config = titleMap[statusFilter];

  const [records, setRecords] = useState<MobileEndpointDevice[]>([]);
  const [searchText, setSearchText] = useState("");
  const [selectedBranch, setSelectedBranch] = useState(ALL_BRANCHES);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  // Online/Offline is a clean binary partition of the whole fleet, so these
  // counts always come from the full record set — not whichever filter is
  // currently active — the same way Geolocation's detected/not-detected
  // counts never depend on which tab is selected.
  const onlineCount = useMemo(() => records.filter((record) => record.isOnline).length, [records]);
  const offlineCount = useMemo(() => records.filter((record) => !record.isOnline).length, [records]);

  const scopedRecords = useMemo(() => {
    return records.filter((record) => matchesStatus(record, statusFilter));
  }, [statusFilter, records]);

  const branchOptions = useMemo(() => {
    const counts = new Map<string, number>();

    scopedRecords.forEach((record) => {
      const branch = getBranchName(record.branch);
      counts.set(branch, (counts.get(branch) || 0) + 1);
    });

    const options = Array.from(counts.entries())
      .map(([name, count]) => ({ name, count, value: name }))
      .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

    return [{ name: "All Branches", count: scopedRecords.length, value: ALL_BRANCHES }, ...options];
  }, [scopedRecords]);

  const branchFilteredRecords = useMemo(() => {
    return scopedRecords.filter((record) => matchesBranch(record, selectedBranch));
  }, [scopedRecords, selectedBranch]);

  const filteredRecords = useMemo(() => {
    return branchFilteredRecords.filter((record) => matchesSearch(record, searchText));
  }, [branchFilteredRecords, searchText]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = filteredRecords.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(safePage * PAGE_SIZE, filteredRecords.length);

  const visibleRecords = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredRecords.slice(start, start + PAGE_SIZE);
  }, [filteredRecords, safePage]);

  const loadDevices = useCallback(async (force = false) => {
    if (force) setRefreshing(true);
    else setLoading(true);

    try {
      const liveDevices = await fetchEndpointDevices({ status: "all", limit: DEVICE_FETCH_LIMIT, force });
      setRecords(liveDevices);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err || "Failed to load endpoint devices."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDevices(false);
  }, [loadDevices]);

  useEffect(() => {
    setSelectedBranch(ALL_BRANCHES);
  }, [statusFilter]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, selectedBranch, searchText]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  function openDevice(record: MobileEndpointDevice) {
    navigation.navigate("DeviceQuickView", {
      device: record.deviceName,
      site: record.branch,
      status: record.isStale ? "Stale" : record.status,
      lastSeen: record.lastSeen,
      risk: record.isOnline && !record.isStale ? "Low" : record.isStale ? "Medium" : "High",
      category: config.title,
      action: `Source: ${record.source} · ${record.platform} · ${record.model} · IP ${record.ipAddress}`,
    });
  }

  function goPrevious() {
    setPage((current) => Math.max(1, current - 1));
  }

  function goNext() {
    setPage((current) => Math.min(totalPages, current + 1));
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 104 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadDevices(true)} />}
    >
      <View style={{ height: insets.top, backgroundColor: ui.navy }} />
      <LinearGradient colors={[ui.navy, ui.navy2, "#3B33C4"]} style={styles.hero}>
        <View style={styles.heroOrb} />
        <View style={styles.heroTop}>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>ENDPOINT MANAGEMENT</Text>
            <Text style={styles.title}>{config.title}</Text>
            <Text style={styles.meta}>{config.subtitle}</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={() => loadDevices(true)} activeOpacity={0.85}>
            {loading || refreshing ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <RefreshCcw size={18} color="#FFFFFF" strokeWidth={2.8} />
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.coverageCard}>
          <View>
            <Text style={styles.coverageLabel}>{config.scopeLabel}</Text>
            <Text style={styles.coverageValue}>{formatNumber(scopedRecords.length)}</Text>
            <Text style={styles.coverageHint}>From {formatNumber(records.length)} hardware inventory assets</Text>
          </View>
          <MonitorCog size={32} color="#E0E7FF" strokeWidth={2.8} />
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
          style={[styles.summaryCard, statusFilter === "online" && { borderColor: ui.green }]}
          activeOpacity={0.86}
          onPress={() => setStatusFilter("online")}
        >
          <View style={[styles.summaryIcon, { backgroundColor: "rgba(22, 163, 74, 0.12)" }]}>
            <CheckCircle2 size={18} color={ui.green} strokeWidth={2.8} />
          </View>
          <Text style={styles.summaryValue}>{formatNumber(onlineCount)}</Text>
          <Text style={styles.summaryTitle}>Online</Text>
          <Text style={styles.summaryHint}>Currently reporting online</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.summaryCard, statusFilter === "offline" && { borderColor: ui.red }]}
          activeOpacity={0.86}
          onPress={() => setStatusFilter("offline")}
        >
          <View style={[styles.summaryIcon, { backgroundColor: "rgba(220, 38, 38, 0.12)" }]}>
            <WifiOff size={18} color={ui.red} strokeWidth={2.8} />
          </View>
          <Text style={styles.summaryValue}>{formatNumber(offlineCount)}</Text>
          <Text style={styles.summaryTitle}>Offline</Text>
          <Text style={styles.summaryHint}>Not reporting or disconnected</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterPanel}>
        <View style={styles.searchBox}>
          <Search size={16} color={ui.muted} strokeWidth={2.7} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search device, branch, model, IP..."
            placeholderTextColor={ui.muted}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.searchInput}
          />
          {searchText ? (
            <TouchableOpacity onPress={() => setSearchText("")} activeOpacity={0.75}>
              <Text style={styles.clearSearch}>Clear</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.branchHeaderRow}>
          <View style={styles.branchTitleRow}>
            <MapPin size={13} color={ui.soft} strokeWidth={2.8} />
            <Text style={styles.branchTitle}>Filter by Branch</Text>
          </View>
          <Text style={styles.branchCount}>{formatNumber(branchOptions.length - 1)} branches</Text>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.branchChipRow}>
          {branchOptions.map((branch) => {
            const isActive = selectedBranch === branch.value;
            const tone = statusFilter === "offline" ? ui.red : statusFilter === "stale" ? ui.amber : ui.blue;
            return (
              <TouchableOpacity
                key={branch.value}
                activeOpacity={0.85}
                onPress={() => setSelectedBranch(branch.value)}
                style={[styles.branchChip, isActive && { backgroundColor: tone, borderColor: tone }]}
              >
                <Text style={[styles.branchChipText, isActive && styles.branchChipTextActive]} numberOfLines={1}>
                  {branch.name}
                </Text>
                <Text style={[styles.branchChipCount, isActive && styles.branchChipCountActive]}>
                  {formatNumber(branch.count)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={styles.listPanel}>
        <View style={styles.listToolbar}>
          <View>
            <Text style={styles.listTitle}>Device Records</Text>
            <Text style={styles.listMeta}>
              Showing {formatNumber(pageStart)}-{formatNumber(pageEnd)} of {formatNumber(filteredRecords.length)}
            </Text>
          </View>
          <Text style={styles.pageBadge}>Page {safePage}/{totalPages}</Text>
        </View>

        {loading && records.length === 0 ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="small" color={ui.cyan} />
            <Text style={styles.loadingText}>Loading live devices...</Text>
          </View>
        ) : filteredRecords.length === 0 ? (
          <View style={styles.emptyBlock}>
            <MonitorCog size={22} color={ui.muted} strokeWidth={2.7} />
            <Text style={styles.emptyTitle}>No device records found</Text>
            <Text style={styles.emptyText}>No live endpoint matched this selected category or branch.</Text>
          </View>
        ) : (
          visibleRecords.map((record, index) => (
            <TouchableOpacity
              key={record.id}
              style={[styles.deviceRow, index === visibleRecords.length - 1 && styles.rowLast]}
              activeOpacity={0.85}
              onPress={() => openDevice(record)}
            >
              <View style={[styles.deviceIcon, { backgroundColor: record.isOnline ? "rgba(22, 163, 74, 0.12)" : "rgba(220, 38, 38, 0.12)" }]}>
                {record.isOnline ? (
                  <CheckCircle2 size={18} color={ui.green} strokeWidth={2.7} />
                ) : (
                  <WifiOff size={18} color={ui.red} strokeWidth={2.7} />
                )}
              </View>

              <View style={styles.deviceTextWrap}>
                <View style={styles.nameRow}>
                  <Text style={styles.deviceName} numberOfLines={1}>{record.deviceName}</Text>
                  <StatusPill
                    label={record.isStale ? "Stale" : record.status}
                    tone={record.isOnline && !record.isStale ? "green" : record.isStale ? "amber" : "red"}
                  />
                </View>

                <View style={styles.metaRow}>
                  <MapPin size={12} color={ui.muted} strokeWidth={2.6} />
                  <Text style={styles.deviceMeta} numberOfLines={1}>{record.branch}</Text>
                </View>

                <View style={styles.metaRow}>
                  <Clock3 size={12} color={ui.muted} strokeWidth={2.6} />
                  <Text style={styles.lastSeen} numberOfLines={1}>Last seen: {record.lastSeen}</Text>
                </View>

                <Text style={styles.deviceTechnical} numberOfLines={1}>
                  {record.platform} · {record.model} · {record.ipAddress}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        <View style={styles.paginationBar}>
          <TouchableOpacity
            style={[styles.pageButton, safePage <= 1 && styles.pageButtonDisabled]}
            activeOpacity={0.82}
            disabled={safePage <= 1}
            onPress={goPrevious}
          >
            <ChevronLeft size={16} color={safePage <= 1 ? ui.muted : ui.ink} strokeWidth={2.8} />
            <Text style={[styles.pageButtonText, safePage <= 1 && styles.pageButtonTextDisabled]}>Previous</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pageButton, safePage >= totalPages && styles.pageButtonDisabled]}
            activeOpacity={0.82}
            disabled={safePage >= totalPages}
            onPress={goNext}
          >
            <Text style={[styles.pageButtonText, safePage >= totalPages && styles.pageButtonTextDisabled]}>Next</Text>
            <ChevronRight size={16} color={safePage >= totalPages ? ui.muted : ui.ink} strokeWidth={2.8} />
          </TouchableOpacity>
        </View>
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
  filterPanel: { marginHorizontal: 16, marginTop: 14, backgroundColor: ui.card, borderRadius: 22, padding: 13, borderWidth: 1, borderColor: ui.line },
  searchBox: { minHeight: 44, borderRadius: 15, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E4E7F2", flexDirection: "row", alignItems: "center", paddingHorizontal: 12, gap: 8 },
  searchInput: { flex: 1, color: ui.ink, fontSize: 12, fontWeight: "700", paddingVertical: 8 },
  clearSearch: { color: ui.blue, fontSize: 11, fontWeight: "900" },
  branchHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12, marginBottom: 9 },
  branchTitleRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  branchTitle: { color: ui.ink, fontSize: 11, fontWeight: "900" },
  branchCount: { color: ui.soft, fontSize: 10.5, fontWeight: "800" },
  branchChipRow: { gap: 8, paddingRight: 4 },
  branchChip: { maxWidth: 180, minHeight: 36, flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: ui.line },
  branchChipText: { maxWidth: 120, color: ui.soft, fontSize: 10.5, fontWeight: "900" },
  branchChipTextActive: { color: "#FFFFFF" },
  branchChipCount: { color: ui.soft, fontSize: 10, fontWeight: "900", backgroundColor: "#EEF0FF", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 999, overflow: "hidden" },
  branchChipCountActive: { color: ui.ink, backgroundColor: "rgba(255,255,255,0.92)" },
  listPanel: { marginHorizontal: 16, marginTop: 14, backgroundColor: ui.card, borderRadius: 24, padding: 15, borderWidth: 1, borderColor: ui.line, shadowColor: "#000000", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.08, shadowRadius: 20, elevation: 2 },
  listToolbar: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 },
  listTitle: { color: ui.ink, fontSize: 16, fontWeight: "900" },
  listMeta: { color: ui.soft, fontSize: 10.5, fontWeight: "700", marginTop: 4 },
  pageBadge: { color: ui.blue, fontSize: 10, fontWeight: "900", backgroundColor: "rgba(79, 70, 229, 0.14)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  loadingBlock: { alignItems: "center", paddingVertical: 24, gap: 8 },
  loadingText: { color: ui.soft, fontSize: 11, fontWeight: "800" },
  emptyBlock: { alignItems: "center", paddingVertical: 24 },
  emptyTitle: { color: ui.ink, fontSize: 13, fontWeight: "900", marginTop: 8 },
  emptyText: { color: ui.soft, fontSize: 11, fontWeight: "700", marginTop: 4 },
  deviceRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#16223A" },
  rowLast: { borderBottomWidth: 0 },
  deviceIcon: { width: 42, height: 42, borderRadius: 16, alignItems: "center", justifyContent: "center", marginRight: 12 },
  deviceTextWrap: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  deviceName: { flex: 1, color: ui.ink, fontSize: 13, fontWeight: "900" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 5 },
  deviceMeta: { flex: 1, color: ui.soft, fontSize: 10.5, fontWeight: "700" },
  lastSeen: { color: ui.muted, fontSize: 10.5, fontWeight: "700" },
  deviceTechnical: { color: ui.muted, fontSize: 10, fontWeight: "700", marginTop: 5 },
  paginationBar: { flexDirection: "row", justifyContent: "space-between", gap: 10, paddingTop: 14, borderTopWidth: 1, borderTopColor: "#16223A", marginTop: 4 },
  pageButton: { flex: 1, height: 42, borderRadius: 14, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E4E7F2", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  pageButtonDisabled: { opacity: 0.5 },
  pageButtonText: { color: ui.ink, fontSize: 11, fontWeight: "900" },
  pageButtonTextDisabled: { color: ui.muted },
});
