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
import Svg, { Circle, Defs, LinearGradient, Stop } from "react-native-svg";
import { LinearGradient as CardGradient } from "expo-linear-gradient";

import { useMobileOpsSnapshot } from "../../hooks/useLiveOpsData";
import {
  fetchDeviceAging,
  fetchGeolocationSummary,
  type MobileDeviceAgingSummary,
} from "../../services/opsMobileService";
import { fetchMyTickets, type MyTicket } from "../../services/ticketService";
import { getCurrentUser } from "../../services/authService";
import { formatNumber } from "../../utils/formatters";
import { accentGlow, cardShadow, colors, tones, type StatusTone } from "../../theme/colors";
import { radius } from "../../theme/spacing";

const emptyDeviceAging: MobileDeviceAgingSummary = {
  totalDevices: 0,
  agingDevices: 0,
  monitorDevices: 0,
  healthyDevices: 0,
  unknownAgeDevices: 0,
  agingMinYears: 5,
  devices: [],
};

const TICKET_STATUS_TONE: Record<string, StatusTone> = {
  Awaiting: "amber",
  "In Progress": "blue",
  Resolved: "green",
  "Re-open": "red",
  Closed: "neutral",
};

// Personalized greeting, same idea as the neobank/finance reference UIs
// ("Good morning, Terry") instead of a static "IT Operations" title.
function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "U";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}

function pct(value: number, total: number) {
  if (!total) return 0;
  return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
}

// snapshot.generatedAt is a full "Mon DD, YYYY, H:MM AM/PM" string — too long
// for the compact status bar, and the date is redundant since a sync is
// almost always "today". Keep just the time segment.
function shortSyncTime(value: string) {
  if (!value || value === "-") return "-";
  const parts = value.split(", ");
  return parts[parts.length - 1] || value;
}

export default function OverviewHomeScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { snapshot, loading, refreshing, error, reloadSnapshot } = useMobileOpsSnapshot();
  const [aging, setAging] = useState<MobileDeviceAgingSummary>(emptyDeviceAging);
  const [myTickets, setMyTickets] = useState<MyTicket[]>([]);
  const [geoDetected, setGeoDetected] = useState(0);
  const [tenantName, setTenantName] = useState("");
  const [userName, setUserName] = useState("");

  useEffect(() => {
    let isMounted = true;

    getCurrentUser()
      .then((user) => {
        if (!isMounted) return;
        setTenantName(user?.tenantName || "");
        setUserName(user?.name || user?.username || "");
      })
      .catch((err) => {
        // Header simply falls back to a generic greeting if this fails —
        // logged so a stuck/wrong name is diagnosable from Metro output
        // instead of failing invisibly.
        console.warn("OverviewHomeScreen: getCurrentUser() failed:", err?.message || err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const loadAging = useCallback(async (force = false) => {
    try {
      const result = await fetchDeviceAging({ force });
      setAging(result);
    } catch (_) {
      // Critical Risk KPI simply shows zero if this fetch fails — the main
      // snapshot error banner already surfaces connectivity problems.
    }
  }, []);

  const loadMyTickets = useCallback(async () => {
    try {
      const result = await fetchMyTickets();
      setMyTickets(result);
    } catch (_) {
      // My Recent Tickets card simply shows empty if this fetch fails — the
      // main snapshot error banner already surfaces connectivity problems.
    }
  }, []);

  const loadGeo = useCallback(async (force = false) => {
    try {
      // Same fetch the Geolocation screen uses — matched against the actual
      // device inventory, not just distinct devices in the location feed —
      // so this KPI's number always agrees with that screen's "Detected".
      const result = await fetchGeolocationSummary({ endpointLimit: 1000, locationLimit: 3000, force });
      setGeoDetected(result.detectedCount);
    } catch (_) {
      // Geo Detected KPI simply shows zero if this fetch fails — the main
      // snapshot error banner already surfaces connectivity problems.
    }
  }, []);

  useEffect(() => {
    loadAging(false);
    loadMyTickets();
    loadGeo(false);
  }, [loadAging, loadMyTickets, loadGeo]);

  const attention =
    snapshot.endpoints.offline + snapshot.endpoints.stale + snapshot.tickets.slaExceeded;
  const onlineRate = pct(snapshot.endpoints.online, snapshot.endpoints.total);

  const openDevices = (status: "all" | "online" | "offline" | "stale") =>
    navigation.navigate("ActiveDeviceList", { status });
  const refresh = () => {
    reloadSnapshot({ silent: true });
    loadAging(true);
    loadMyTickets();
    loadGeo(true);
  };

  return (
    <View style={styles.page}>
      <View style={{ height: insets.top, backgroundColor: colors.background }} />
      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: Math.max(insets.bottom, 24) }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor={colors.blueBright}
            colors={[colors.blueBright]}
            progressBackgroundColor={colors.surfaceSoft}
          />
        }
      >
        <View style={styles.headerRow}>
          <View style={styles.headerIdentity}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(userName)}</Text>
            </View>
            <View style={styles.headerLeft}>
              <Text style={styles.hello}>{getGreeting()}{userName ? `, ${userName.split(" ")[0]}` : ""}</Text>
              <Text style={styles.screenTitle}>Fleet Overview</Text>
              {tenantName ? (
                <View style={styles.tenantBadge}>
                  <Ionicons name="business" size={11} color={colors.blueBright} />
                  <Text style={styles.tenantBadgeText}>{tenantName}</Text>
                </View>
              ) : null}
            </View>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.circleButton} onPress={refresh} activeOpacity={0.85}>
              {loading || refreshing ? (
                <ActivityIndicator size="small" color={colors.blueBright} />
              ) : (
                <Ionicons name="refresh" size={19} color={colors.textSoft} />
              )}
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statusBar}>
          <View style={styles.statusBarLeft}>
            <View style={styles.liveDot} />
            <Text style={styles.statusBarLive}>LIVE</Text>
            <Text style={styles.statusBarText} numberOfLines={1}>
              {attention === 0 ? "All systems operational" : `${formatNumber(attention)} item(s) need attention`}
            </Text>
          </View>
          <View style={styles.statusBarRight}>
            <Text style={styles.statusBarText} numberOfLines={1}>Synced {shortSyncTime(snapshot.generatedAt)}</Text>
            <Ionicons name="checkmark-circle" size={15} color={colors.green} />
          </View>
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <Ionicons name="warning" size={17} color={colors.red} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <TouchableOpacity
          style={styles.healthCard}
          activeOpacity={0.85}
          onPress={() => openDevices("all")}
        >
          <CardGradient
            colors={["#6D63F2", "#4F46E5", "#3B33C4"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.healthGlowOne} pointerEvents="none" />
          <View style={styles.healthGlowTwo} pointerEvents="none" />

          <View style={styles.healthLeft}>
            <View style={styles.healthLabelRow}>
              <Ionicons name="pulse" size={15} color="rgba(255,255,255,0.85)" />
              <Text style={styles.healthLabel}>System Health</Text>
            </View>
            <View style={styles.healthValueRow}>
              <Text style={styles.healthValue}>{formatNumber(snapshot.endpoints.total)}</Text>
              <Text style={styles.healthValueMax}>devices</Text>
            </View>

            <View style={styles.healthStatsRow}>
              <View style={styles.healthStatItem}>
                <Text style={styles.healthStatValue}>{formatNumber(snapshot.endpoints.online)}</Text>
                <Text style={styles.healthStatLabel}>Online</Text>
              </View>
              <View style={styles.healthStatDivider} />
              <View style={styles.healthStatItem}>
                <Text style={styles.healthStatValue}>{formatNumber(snapshot.endpoints.offline)}</Text>
                <Text style={styles.healthStatLabel}>Offline</Text>
              </View>
            </View>
          </View>

          <HealthRing percent={onlineRate} />
        </TouchableOpacity>

        {/* One horizontal-scrolling row: real KPI numbers first (Open
            Tickets/PC Aging/Geo Detected/Compliance), then icon-only
            shortcut cards for screens with no cheap live count to show
            (Alerts/Device Risk/Software) — same row, same card height, so
            it reads as one strip instead of stacked sections. Devices,
            Reports, Scan Asset and Asset Inventory live on their own tabs
            (Assets/Reports) and New Ticket is the "+" tab, so they're not
            repeated here. */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.kpiRow}
        >
          <KpiCard
            icon="ticket"
            tone="cyan"
            value={snapshot.tickets.open}
            label="Open Tickets"
            caption={`${formatNumber(snapshot.tickets.slaExceeded)} SLA exceeded`}
            onPress={() => navigation.navigate("TicketSummary")}
          />
          <KpiCard
            icon="time"
            tone="red"
            value={aging.agingDevices}
            label="PC Aging"
            caption={`Aging past ${aging.agingMinYears}y`}
            onPress={() => navigation.navigate("AgingDevices")}
          />
          <KpiCard
            icon="location"
            tone="green"
            value={geoDetected}
            label="Geo Detected"
            caption={`${pct(geoDetected, snapshot.endpoints.total)}% of total`}
            onPress={() => navigation.navigate("GeolocationSummary")}
          />
          <KpiCard
            icon="shield-checkmark"
            tone="purple"
            value={snapshot.patch.complianceRate}
            valueLabel={`${Math.round(snapshot.patch.complianceRate)}%`}
            label="Compliance"
            caption={`${formatNumber(snapshot.patch.missingPatchDevices)} need patching`}
            onPress={() => navigation.navigate("PatchCompliance")}
          />
          <ShortcutCard
            icon="warning"
            tone="amber"
            label="Device Risk"
            onPress={() => navigation.navigate("DeviceRisk")}
          />
          <ShortcutCard
            icon="apps"
            tone="blue"
            label="Software"
            onPress={() => navigation.navigate("SoftwareOverview")}
          />
        </ScrollView>

        <View style={styles.card}>
          <View style={styles.taskListHeader}>
            <Text style={styles.cardTitle}>My Recent Tickets</Text>
            <TouchableOpacity onPress={() => navigation.navigate("TicketSummary")} activeOpacity={0.7}>
              <Text style={styles.viewDetailsLink}>View All</Text>
            </TouchableOpacity>
          </View>

          {myTickets.length === 0 ? (
            <Text style={styles.taskListEmpty}>You haven't created any tickets yet.</Text>
          ) : (
            myTickets.map((ticket) => {
              const tone = TICKET_STATUS_TONE[ticket.status] || "neutral";
              return (
                <TouchableOpacity
                  key={ticket.id}
                  style={styles.taskRow}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate("TicketSummary")}
                >
                  <View style={[styles.taskIcon, { backgroundColor: tones[tone].bg, borderColor: tones[tone].border }]}>
                    <Ionicons name="ticket" size={15} color={tones[tone].text} />
                  </View>
                  <View style={styles.taskInfo}>
                    <Text style={styles.taskTitle} numberOfLines={1}>{ticket.title}</Text>
                    <Text style={styles.taskMeta} numberOfLines={1}>{ticket.id} • {ticket.createdAt}</Text>
                  </View>
                  <View style={[styles.taskStatusPill, { backgroundColor: tones[tone].bg }]}>
                    <Text style={[styles.taskStatusText, { color: tones[tone].text }]} numberOfLines={1}>
                      {ticket.status}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

      </ScrollView>
    </View>
  );
}

function HealthRing({ percent, size = 104, strokeWidth = 10 }: { percent: number; size?: number; strokeWidth?: number }) {
  const ringRadius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * ringRadius;
  const progress = Math.max(0, Math.min(percent, 100)) / 100;
  const dashOffset = circumference * (1 - progress);

  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size}>
        <Defs>
          <LinearGradient id="healthRingGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <Stop offset="0" stopColor="#FFFFFF" />
            <Stop offset="1" stopColor="#BAE6FD" />
          </LinearGradient>
        </Defs>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={ringRadius}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={ringRadius}
          stroke="url(#healthRingGradient)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={StyleSheet.absoluteFillObject}>
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Text style={{ color: colors.white, fontSize: 22, fontWeight: "800", letterSpacing: -0.5 }}>{percent}%</Text>
          <Text style={{ color: "rgba(255,255,255,0.72)", fontSize: 9, fontWeight: "700", marginTop: 1 }}>ONLINE</Text>
        </View>
      </View>
    </View>
  );
}

function KpiCard({
  icon,
  tone,
  value,
  valueLabel,
  label,
  caption,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tone: StatusTone;
  value: number;
  valueLabel?: string;
  label: string;
  caption?: string;
  onPress?: () => void;
}) {
  const t = tones[tone];
  const Wrapper: any = onPress ? TouchableOpacity : View;

  return (
    <Wrapper style={styles.kpiCard} activeOpacity={0.85} onPress={onPress}>
      <View style={[styles.kpiIcon, { backgroundColor: t.bg, borderColor: t.border }]}>
        <Ionicons name={icon} size={15} color={t.text} />
      </View>
      <Text style={styles.kpiValue} numberOfLines={1} adjustsFontSizeToFit>
        {valueLabel ?? formatNumber(value)}
      </Text>
      <Text style={styles.kpiLabel} numberOfLines={1}>{label}</Text>
      {caption ? (
        <Text style={[styles.kpiCaption, { color: t.text }]} numberOfLines={1}>
          {caption}
        </Text>
      ) : null}
    </Wrapper>
  );
}


// Same footprint as KpiCard (fixed width, same height) but for screens with
// no cheap live number to show — icon + label only, so it still reads as
// part of the same horizontal-scrolling strip instead of a mismatched tile.
function ShortcutCard({
  icon,
  tone,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tone: StatusTone;
  label: string;
  onPress: () => void;
}) {
  const t = tones[tone];

  return (
    <TouchableOpacity style={styles.shortcutCard} activeOpacity={0.85} onPress={onPress}>
      <View style={[styles.kpiIcon, { backgroundColor: t.bg, borderColor: t.border }]}>
        <Ionicons name={icon} size={15} color={t.text} />
      </View>
      <Text style={styles.shortcutLabel} numberOfLines={2}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },

  headerRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", paddingTop: 16, marginBottom: 14 },
  headerIdentity: { flex: 1, flexDirection: "row", alignItems: "center", paddingRight: 12 },
  avatar: { width: 46, height: 46, borderRadius: 16, backgroundColor: colors.blue, alignItems: "center", justifyContent: "center", marginRight: 12, ...accentGlow },
  avatarText: { color: colors.white, fontSize: 15, fontWeight: "800" },
  headerLeft: { flex: 1 },
  hello: { color: colors.textSoft, fontSize: 12.5, fontWeight: "600" },
  screenTitle: { color: colors.text, fontSize: 20, fontWeight: "800", letterSpacing: -0.5, marginTop: 2 },
  tenantBadge: { flexDirection: "row", alignItems: "center", gap: 5, alignSelf: "flex-start", backgroundColor: tones.blue.bg, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, marginTop: 6 },
  tenantBadgeText: { color: colors.blueBright, fontSize: 11, fontWeight: "700" },
  headerActions: { flexDirection: "row", gap: 8 },
  circleButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  headerBadge: { position: "absolute", top: 5, right: 5, minWidth: 15, height: 15, borderRadius: 8, backgroundColor: colors.red, alignItems: "center", justifyContent: "center", paddingHorizontal: 3 },
  headerBadgeText: { color: colors.white, fontSize: 9, fontWeight: "700" },

  statusBar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.surfaceSoft, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 14, gap: 10 },
  statusBarLeft: { flexDirection: "row", alignItems: "center", flex: 1, flexShrink: 1, gap: 6 },
  statusBarRight: { flexDirection: "row", alignItems: "center", flexShrink: 0, gap: 6 },
  liveDot: { width: 6, height: 6, borderRadius: 6, backgroundColor: colors.green },
  statusBarLive: { color: colors.green, fontSize: 10.5, fontWeight: "800", letterSpacing: 0.6 },
  statusBarText: { color: colors.textSoft, fontSize: 11, fontWeight: "600", flexShrink: 1 },

  errorCard: { marginBottom: 14, padding: 14, borderRadius: radius.lg, backgroundColor: "rgba(220, 38, 38, 0.10)", borderWidth: 1, borderColor: "rgba(220, 38, 38, 0.26)", flexDirection: "row", alignItems: "center", gap: 9 },
  errorText: { flex: 1, color: colors.textSoft, fontSize: 11.5, fontWeight: "500", lineHeight: 16 },

  healthCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: radius.xl, borderWidth: 1, borderColor: "rgba(79, 70, 229, 0.22)", padding: 18, marginBottom: 14, overflow: "hidden", shadowColor: "#3B33C4", shadowOffset: { width: 0, height: 14 }, shadowOpacity: 0.3, shadowRadius: 24, elevation: 6 },
  healthGlowOne: { position: "absolute", width: 160, height: 160, borderRadius: 160, backgroundColor: "rgba(79, 70, 229, 0.14)", right: -50, top: -60 },
  healthGlowTwo: { position: "absolute", width: 120, height: 120, borderRadius: 120, backgroundColor: "rgba(8, 145, 178, 0.10)", left: -40, bottom: -50 },
  healthLeft: { flex: 1, paddingRight: 12 },
  healthLabelRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  healthLabel: { color: "rgba(255,255,255,0.82)", fontSize: 11.5, fontWeight: "600" },
  healthValueRow: { flexDirection: "row", alignItems: "flex-end", marginTop: 8 },
  healthValue: { color: colors.white, fontSize: 36, fontWeight: "800", letterSpacing: -1 },
  healthValueMax: { color: "rgba(255,255,255,0.68)", fontSize: 15, fontWeight: "700", marginBottom: 4, marginLeft: 2 },
  healthStatsRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  healthStatItem: { alignItems: "flex-start" },
  healthStatValue: { color: colors.white, fontSize: 15, fontWeight: "800" },
  healthStatLabel: { color: "rgba(255,255,255,0.68)", fontSize: 10, fontWeight: "600", marginTop: 2 },
  healthStatDivider: { width: 1, height: 22, backgroundColor: "rgba(255,255,255,0.18)", marginHorizontal: 12 },

  kpiRow: { flexDirection: "row", gap: 8, paddingRight: 4, marginBottom: 14 },
  kpiCard: { width: 118, backgroundColor: colors.surfaceSoft, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 10, paddingVertical: 12, ...cardShadow },
  shortcutCard: { width: 118, backgroundColor: colors.surfaceSoft, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 10, paddingVertical: 12, justifyContent: "center", ...cardShadow },
  shortcutLabel: { color: colors.text, fontSize: 11.5, fontWeight: "700", marginTop: 4, lineHeight: 15 },
  kpiIcon: { width: 26, height: 26, borderRadius: 9, borderWidth: 1, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  kpiValue: { color: colors.text, fontSize: 18, fontWeight: "800", letterSpacing: -0.5 },
  kpiLabel: { color: colors.textSoft, fontSize: 9.5, fontWeight: "500", marginTop: 3 },
  kpiCaption: { fontSize: 8.5, fontWeight: "700", marginTop: 4 },

  card: { backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.borderSoft, padding: 18, marginBottom: 14, ...cardShadow },
  cardTitle: { color: colors.text, fontSize: 16.5, fontWeight: "700", letterSpacing: -0.3 },
  viewDetailsLink: { color: colors.blueBright, fontSize: 12, fontWeight: "700" },

  taskListHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  taskListEmpty: { color: colors.textSoft, fontSize: 12, fontWeight: "500", paddingVertical: 8 },
  taskRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  taskIcon: { width: 30, height: 30, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  taskInfo: { flex: 1 },
  taskTitle: { color: colors.text, fontSize: 12.5, fontWeight: "700" },
  taskMeta: { color: colors.textSoft, fontSize: 10.5, fontWeight: "500", marginTop: 2 },
  taskStatusPill: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 4, maxWidth: 96 },
  taskStatusText: { fontSize: 9.5, fontWeight: "700" },


});
