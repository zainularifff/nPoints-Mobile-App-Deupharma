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

import { fetchWorklistItems, type MobileWorkItem } from "../../services/opsMobileService";
import { colors, tones, type StatusTone } from "../../theme/colors";
import { radius } from "../../theme/spacing";

const TASK_LIST_LIMIT = 500;
const PAGE_SIZE = 25;

const PRIORITY_TONE: Record<MobileWorkItem["priority"], StatusTone> = {
  High: "red",
  Medium: "amber",
  Low: "neutral",
};

const TYPE_ICON: Record<MobileWorkItem["type"], keyof typeof Ionicons.glyphMap> = {
  endpoint: "hardware-chip",
  ticket: "ticket",
  remote: "desktop",
  software: "apps",
  asset: "cube",
};

export default function TaskListScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();

  const [tasks, setTasks] = useState<MobileWorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);

  const loadTasks = useCallback(async (force = false) => {
    if (force) setRefreshing(true);
    else setLoading(true);

    try {
      const rows = await fetchWorklistItems({ force, limit: TASK_LIST_LIMIT });
      setTasks(rows);
      setPage(0);
      setError("");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err || "Failed to load job/task list."));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTasks(false);
  }, [loadTasks]);

  const pageCount = Math.max(1, Math.ceil(tasks.length / PAGE_SIZE));
  const pageTasks = tasks.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE);

  return (
    <View style={styles.page}>
      <View style={{ height: insets.top, backgroundColor: colors.background }} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: Math.max(insets.bottom, 24) + 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => loadTasks(true)}
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
            <Text style={styles.hello}>OPERATIONS</Text>
            <Text style={styles.screenTitle}>Job Task List</Text>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.blueBright} />
          </View>
        ) : error ? (
          <View style={styles.errorCard}>
            <Ionicons name="warning" size={17} color={colors.red} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : tasks.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="checkmark-done-circle" size={24} color={colors.textSoft} />
            <Text style={styles.emptyText}>No active jobs or tasks right now.</Text>
          </View>
        ) : (
          <>
            {pageTasks.map((task) => {
              const tone = tones[PRIORITY_TONE[task.priority]];

              return (
                <View key={task.id} style={styles.taskCard}>
                  <View style={styles.taskCardTop}>
                    <View style={[styles.taskIcon, { backgroundColor: tone.bg, borderColor: tone.border }]}>
                      <Ionicons name={TYPE_ICON[task.type]} size={16} color={tone.text} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.taskTitle} numberOfLines={2}>{task.title}</Text>
                      <Text style={styles.taskMeta} numberOfLines={1}>{task.source} • {task.site}</Text>
                    </View>
                    <View style={[styles.priorityPill, { backgroundColor: tone.bg }]}>
                      <Text style={[styles.priorityText, { color: tone.text }]}>{task.priority}</Text>
                    </View>
                  </View>

                  <View style={styles.taskCardBottom}>
                    <Text style={styles.taskDetailLabel}>Status</Text>
                    <Text style={styles.taskDetailValue} numberOfLines={1}>{task.status}</Text>
                  </View>
                  <View style={styles.taskCardBottom}>
                    <Text style={styles.taskDetailLabel}>Owner</Text>
                    <Text style={styles.taskDetailValue} numberOfLines={1}>{task.owner || "-"}</Text>
                  </View>
                  <View style={styles.taskCardBottom}>
                    <Text style={styles.taskDetailLabel}>Updated</Text>
                    <Text style={styles.taskDetailValue} numberOfLines={1}>{task.updated || "-"}</Text>
                  </View>
                </View>
              );
            })}

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
  headerRow: { flexDirection: "row", alignItems: "center", paddingTop: 16, marginBottom: 16, gap: 12 },
  backButton: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  hello: { color: colors.blueBright, fontSize: 11, fontWeight: "700", letterSpacing: 1.4 },
  screenTitle: { color: colors.text, fontSize: 22, fontWeight: "800", letterSpacing: -0.5, marginTop: 2 },

  pagination: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 16, paddingVertical: 12, marginTop: 4 },
  pageButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  pageButtonDisabled: { opacity: 0.4 },
  pageLabel: { color: colors.textSoft, fontSize: 12, fontWeight: "600" },

  loadingWrap: { paddingVertical: 40, alignItems: "center" },
  errorCard: { padding: 14, borderRadius: radius.lg, backgroundColor: "rgba(220, 38, 38, 0.10)", borderWidth: 1, borderColor: "rgba(220, 38, 38, 0.26)", flexDirection: "row", alignItems: "center", gap: 9 },
  errorText: { flex: 1, color: colors.textSoft, fontSize: 11.5, fontWeight: "500", lineHeight: 16 },
  emptyCard: { paddingVertical: 40, alignItems: "center", gap: 8 },
  emptyText: { color: colors.textSoft, fontSize: 12.5, fontWeight: "500" },

  taskCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.borderSoft, padding: 14, marginBottom: 10 },
  taskCardTop: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  taskIcon: { width: 32, height: 32, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  taskTitle: { color: colors.text, fontSize: 13.5, fontWeight: "700" },
  taskMeta: { color: colors.textSoft, fontSize: 11, fontWeight: "500", marginTop: 2 },
  priorityPill: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4 },
  priorityText: { fontSize: 10, fontWeight: "700" },

  taskCardBottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.borderSoft },
  taskDetailLabel: { color: colors.textSoft, fontSize: 10.5, fontWeight: "600" },
  taskDetailValue: { color: colors.text, fontSize: 11.5, fontWeight: "600", flexShrink: 1, textAlign: "right", marginLeft: 10 },
});
