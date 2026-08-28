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
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AlertTriangle,
  Box,
  Boxes,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Search,
  Wrench,
} from "lucide-react-native";

import StatusPill from "../../components/StatusPill";
import {
  fetchOfflineAssetInventory,
  OFFLINE_ASSET_STATUSES,
  type OfflineAssetListItem,
} from "../../services/offlineAssetService";
import { ApiError } from "../../services/apiClient";
import { formatNumber } from "../../utils/formatters";
import { drilldownPalette, type StatusTone } from "../../theme/colors";

const ui = drilldownPalette;
const PAGE_SIZE = 10;
const ALL_STATUS = "__all__";

const STATUS_TONE: Record<string, StatusTone> = {
  Active: "green",
  "In Storage": "neutral",
  "Under Repair": "amber",
  Disposed: "red",
};

function matchesSearch(record: OfflineAssetListItem, query: string) {
  const keyword = query.trim().toLowerCase();
  if (!keyword) return true;

  return [record.assetTag, record.name, record.type, record.manufacturer, record.model, record.branch, record.department]
    .join(" ")
    .toLowerCase()
    .includes(keyword);
}

export default function OfflineAssetInventoryScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [records, setRecords] = useState<OfflineAssetListItem[]>([]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState(ALL_STATUS);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const activeCount = useMemo(() => records.filter((r) => r.status === "Active").length, [records]);
  const attentionCount = useMemo(
    () => records.filter((r) => r.status === "Under Repair" || r.status === "Disposed").length,
    [records]
  );

  const statusFilteredRecords = useMemo(() => {
    if (statusFilter === ALL_STATUS) return records;
    return records.filter((record) => record.status === statusFilter);
  }, [records, statusFilter]);

  const filteredRecords = useMemo(
    () => statusFilteredRecords.filter((record) => matchesSearch(record, searchText)),
    [statusFilteredRecords, searchText]
  );

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageStart = filteredRecords.length === 0 ? 0 : (safePage - 1) * PAGE_SIZE + 1;
  const pageEnd = Math.min(safePage * PAGE_SIZE, filteredRecords.length);

  const visibleRecords = useMemo(() => {
    const start = (safePage - 1) * PAGE_SIZE;
    return filteredRecords.slice(start, start + PAGE_SIZE);
  }, [filteredRecords, safePage]);

  const loadAssets = useCallback(async (force = false) => {
    if (force) setRefreshing(true);
    else setLoading(true);

    try {
      const rows = await fetchOfflineAssetInventory();
      setRecords(rows);
      setError("");
    } catch (err: any) {
      setError(err instanceof ApiError ? err.message : "Failed to load offline asset inventory.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAssets(false);
  }, [loadAssets]);

  useEffect(() => {
    setPage(1);
  }, [statusFilter, searchText]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  function openAsset(record: OfflineAssetListItem) {
    navigation.navigate("OfflineAssetDetail", { asset: record });
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 104 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadAssets(true)} />}
    >
      <View style={{ height: insets.top, backgroundColor: ui.navy }} />
      <LinearGradient colors={[ui.navy, ui.navy2, "#3B33C4"]} style={styles.hero}>
        <View style={styles.heroOrb} />
        <View style={styles.heroTop}>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>ASSET MANAGEMENT</Text>
            <Text style={styles.title}>Offline Asset Inventory</Text>
            <Text style={styles.meta}>Manually catalogued devices without a monitoring agent.</Text>
          </View>
        </View>

        <View style={styles.coverageCard}>
          <View>
            <Text style={styles.coverageLabel}>Total offline assets</Text>
            <Text style={styles.coverageValue}>{formatNumber(records.length)}</Text>
            <Text style={styles.coverageHint}>Scan a QR code to log an issue against one</Text>
          </View>
          <Boxes size={32} color="#E0E7FF" strokeWidth={2.8} />
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
          style={[styles.summaryCard, statusFilter === "Active" && { borderColor: ui.green }]}
          activeOpacity={0.86}
          onPress={() => setStatusFilter(statusFilter === "Active" ? ALL_STATUS : "Active")}
        >
          <View style={[styles.summaryIcon, { backgroundColor: "rgba(22, 163, 74, 0.12)" }]}>
            <Box size={18} color={ui.green} strokeWidth={2.8} />
          </View>
          <Text style={styles.summaryValue}>{formatNumber(activeCount)}</Text>
          <Text style={styles.summaryTitle}>Active</Text>
          <Text style={styles.summaryHint}>In service right now</Text>
        </TouchableOpacity>

        <View style={styles.summaryCard}>
          <View style={[styles.summaryIcon, { backgroundColor: "rgba(217, 119, 6, 0.12)" }]}>
            <Wrench size={18} color={ui.amber} strokeWidth={2.8} />
          </View>
          <Text style={styles.summaryValue}>{formatNumber(attentionCount)}</Text>
          <Text style={styles.summaryTitle}>Needs Attention</Text>
          <Text style={styles.summaryHint}>Under repair or disposed</Text>
        </View>
      </View>

      <View style={styles.filterPanel}>
        <View style={styles.searchBox}>
          <Search size={16} color={ui.muted} strokeWidth={2.7} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search asset tag, brand, model, branch..."
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

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.statusChipRow}>
          {[{ label: "All Status", value: ALL_STATUS }, ...OFFLINE_ASSET_STATUSES.map((s) => ({ label: s, value: s }))].map(
            (option) => {
              const isActive = statusFilter === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  activeOpacity={0.85}
                  onPress={() => setStatusFilter(option.value)}
                  style={[styles.statusChip, isActive && { backgroundColor: ui.blue, borderColor: ui.blue }]}
                >
                  <Text style={[styles.statusChipText, isActive && styles.statusChipTextActive]} numberOfLines={1}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            }
          )}
        </ScrollView>
      </View>

      <View style={styles.listPanel}>
        <View style={styles.listToolbar}>
          <View>
            <Text style={styles.listTitle}>Asset Records</Text>
            <Text style={styles.listMeta}>
              Showing {formatNumber(pageStart)}-{formatNumber(pageEnd)} of {formatNumber(filteredRecords.length)}
            </Text>
          </View>
          <Text style={styles.pageBadge}>Page {safePage}/{totalPages}</Text>
        </View>

        {loading && records.length === 0 ? (
          <View style={styles.loadingBlock}>
            <ActivityIndicator size="small" color={ui.cyan} />
            <Text style={styles.loadingText}>Loading offline assets...</Text>
          </View>
        ) : filteredRecords.length === 0 ? (
          <View style={styles.emptyBlock}>
            <Boxes size={22} color={ui.muted} strokeWidth={2.7} />
            <Text style={styles.emptyTitle}>No assets found</Text>
            <Text style={styles.emptyText}>No offline asset matched this search or status filter.</Text>
          </View>
        ) : (
          visibleRecords.map((record, index) => {
            const tone = STATUS_TONE[record.status] || "neutral";
            return (
              <TouchableOpacity
                key={record.id}
                style={[styles.assetRow, index === visibleRecords.length - 1 && styles.rowLast]}
                activeOpacity={0.85}
                onPress={() => openAsset(record)}
              >
                <View style={[styles.assetIcon, { backgroundColor: "rgba(79, 70, 229, 0.12)" }]}>
                  <Box size={18} color={ui.blue} strokeWidth={2.7} />
                </View>

                <View style={styles.assetTextWrap}>
                  <View style={styles.nameRow}>
                    <Text style={styles.assetName} numberOfLines={1}>{record.name}</Text>
                    <StatusPill label={record.status} tone={tone} />
                  </View>

                  <Text style={styles.assetTag} numberOfLines={1}>Tag: {record.assetTag}</Text>

                  <View style={styles.metaRow}>
                    <MapPin size={12} color={ui.muted} strokeWidth={2.6} />
                    <Text style={styles.assetMeta} numberOfLines={1}>
                      {[record.branch, record.department].filter(Boolean).join(" · ") || "Unassigned"}
                    </Text>
                  </View>

                  <Text style={styles.assetTechnical} numberOfLines={1}>
                    {[record.type, record.manufacturer, record.model].filter(Boolean).join(" · ")}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <View style={styles.paginationBar}>
          <TouchableOpacity
            style={[styles.pageButton, safePage <= 1 && styles.pageButtonDisabled]}
            activeOpacity={0.82}
            disabled={safePage <= 1}
            onPress={() => setPage((current) => Math.max(1, current - 1))}
          >
            <ChevronLeft size={16} color={safePage <= 1 ? ui.muted : ui.ink} strokeWidth={2.8} />
            <Text style={[styles.pageButtonText, safePage <= 1 && styles.pageButtonTextDisabled]}>Previous</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.pageButton, safePage >= totalPages && styles.pageButtonDisabled]}
            activeOpacity={0.82}
            disabled={safePage >= totalPages}
            onPress={() => setPage((current) => Math.min(totalPages, current + 1))}
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
  title: { color: "#FFFFFF", fontSize: 25, fontWeight: "900", letterSpacing: -1, marginTop: 6 },
  meta: { color: "#B5C7DE", fontSize: 11.5, fontWeight: "700", marginTop: 8, lineHeight: 16 },
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
  statusChipRow: { gap: 8, paddingRight: 4, marginTop: 12 },
  statusChip: { minHeight: 36, flexDirection: "row", alignItems: "center", paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: ui.line },
  statusChipText: { color: ui.soft, fontSize: 10.5, fontWeight: "900" },
  statusChipTextActive: { color: "#FFFFFF" },
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
  assetRow: { flexDirection: "row", alignItems: "flex-start", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: ui.line },
  rowLast: { borderBottomWidth: 0 },
  assetIcon: { width: 42, height: 42, borderRadius: 16, alignItems: "center", justifyContent: "center", marginRight: 12 },
  assetTextWrap: { flex: 1 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  assetName: { flex: 1, color: ui.ink, fontSize: 13, fontWeight: "900" },
  assetTag: { color: ui.soft, fontSize: 10.5, fontWeight: "700", marginTop: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 5 },
  assetMeta: { flex: 1, color: ui.soft, fontSize: 10.5, fontWeight: "700" },
  assetTechnical: { color: ui.muted, fontSize: 10, fontWeight: "700", marginTop: 5 },
  paginationBar: { flexDirection: "row", justifyContent: "space-between", gap: 10, paddingTop: 14, borderTopWidth: 1, borderTopColor: ui.line, marginTop: 4 },
  pageButton: { flex: 1, height: 42, borderRadius: 14, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E4E7F2", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  pageButtonDisabled: { opacity: 0.5 },
  pageButtonText: { color: ui.ink, fontSize: 11, fontWeight: "900" },
  pageButtonTextDisabled: { color: ui.muted },
});
