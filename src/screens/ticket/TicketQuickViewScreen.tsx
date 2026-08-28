import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Clock3,
  ExternalLink,
  MapPin,
  MonitorCog,
  ShieldCheck,
} from "lucide-react-native";

import StatusPill from "../../components/StatusPill";
import { colors } from "../../theme/colors";

export default function DeviceQuickViewScreen() {
  const navigation = useNavigation();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const params = route.params || {};

  const device = params.device || "Unknown Device";
  const site = params.site || "-";
  const status = params.status || "-";
  const lastSeen = params.lastSeen || "-";
  const risk = params.risk || "Medium";
  const category = params.category || "Endpoint Issue";
  const action =
    params.action ||
    "Review this endpoint in the main EMA web system for full investigation.";

  const isHigh = risk === "High";

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={[
        styles.container,
        { paddingTop: insets.top + 24 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
        activeOpacity={0.85}
      >
        <ArrowLeft size={20} color={colors.text} strokeWidth={2.7} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.profileCard}>
        <View style={styles.profileTop}>
          <View style={styles.profileIcon}>
            <MonitorCog size={28} color={colors.white} strokeWidth={2.7} />
          </View>

          <View style={styles.badgeGroup}>
            <StatusPill label={status} tone={isHigh ? "red" : "blue"} />
            <StatusPill label={risk} tone={isHigh ? "red" : "amber"} />
          </View>
        </View>

        <Text style={styles.profileLabel}>DEVICE QUICK VIEW</Text>
        <Text style={styles.profileTitle}>{device}</Text>
        <Text style={styles.profileDesc}>
          Mobile profile view for selected endpoint. Full hardware, software,
          audit and inventory fields remain in the main EMA web system.
        </Text>

        <View style={styles.profileFooter}>
          <View>
            <Text style={styles.footerLabel}>Category</Text>
            <Text style={styles.footerValue}>{category}</Text>
          </View>

          <View style={styles.footerDivider} />

          <View>
            <Text style={styles.footerLabel}>Last Seen</Text>
            <Text style={styles.footerValue}>{lastSeen}</Text>
          </View>
        </View>
      </View>

      <View style={styles.identityPanel}>
        <Text style={styles.panelTitle}>Device Identity</Text>

        <InfoRow icon={MonitorCog} label="Device Name" value={device} />
        <InfoRow icon={MapPin} label="Site" value={site} />
        <InfoRow icon={ShieldCheck} label="Status" value={status} />
        <InfoRow icon={Clock3} label="Last Seen" value={lastSeen} />
      </View>

      <View style={styles.contextPanel}>
        <View style={styles.contextIcon}>
          <AlertTriangle
            size={20}
            color={isHigh ? colors.red : colors.amber}
            strokeWidth={2.7}
          />
        </View>

        <View style={styles.contextTextWrap}>
          <Text style={styles.contextTitle}>Operational Context</Text>
          <Text style={styles.contextText}>
            This device appears in the mobile view because it is linked to an
            endpoint monitoring condition that may require operational review.
          </Text>
        </View>
      </View>

      <View style={styles.actionPanel}>
        <View style={styles.actionIcon}>
          <CheckCircle2 size={20} color={colors.green} strokeWidth={2.7} />
        </View>

        <View style={styles.actionTextWrap}>
          <Text style={styles.actionTitle}>Recommended Action</Text>
          <Text style={styles.actionText}>{action}</Text>
        </View>
      </View>

      {/* <TouchableOpacity style={styles.webButton} activeOpacity={0.85}>
        <ExternalLink size={18} color={colors.white} strokeWidth={2.7} />
        <Text style={styles.webButtonText}>Open in Main System</Text>
      </TouchableOpacity> */}
    </ScrollView>
  );
}

function InfoRow({ icon: Icon, label, value }: any) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Icon size={18} color={colors.blue} strokeWidth={2.7} />
      </View>

      <View style={styles.infoTextWrap}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingHorizontal: 18,
    paddingBottom: 110,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginBottom: 16,
  },
  backText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "900",
    marginLeft: 6,
  },

  profileCard: {
    backgroundColor: "#3B33C4", borderWidth: 1, borderColor: "rgba(79, 70, 229, 0.18)",
    borderRadius: 30,
    padding: 20,
    marginBottom: 16,
  },
  profileTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  profileIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: colors.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeGroup: {
    alignItems: "flex-end",
    gap: 7,
  },
  profileLabel: {
    color: "#C7C2FF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
    marginTop: 20,
  },
  profileTitle: {
    color: colors.white,
    fontSize: 23,
    fontWeight: "900",
    letterSpacing: -0.6,
    marginTop: 6,
  },
  profileDesc: {
    color: "#C7C2FF",
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 18,
    marginTop: 8,
  },
  profileFooter: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
    flexDirection: "row",
    alignItems: "center",
  },
  footerLabel: {
    color: "#C7C2FF",
    fontSize: 10,
    fontWeight: "800",
  },
  footerValue: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "900",
    marginTop: 4,
  },
  footerDivider: {
    width: 1,
    height: 34,
    backgroundColor: "rgba(255,255,255,0.14)",
    marginHorizontal: 18,
  },

  identityPanel: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 16,
  },
  panelTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "900",
    paddingTop: 14,
    paddingBottom: 2,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  infoIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "rgba(79, 70, 229, 0.14)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  infoTextWrap: {
    flex: 1,
  },
  infoLabel: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: "800",
  },
  infoValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
    marginTop: 3,
  },

  contextPanel: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    marginBottom: 16,
  },
  contextIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "rgba(217, 119, 6, 0.14)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  contextTextWrap: {
    flex: 1,
  },
  contextTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
  },
  contextText: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 4,
  },

  actionPanel: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    marginBottom: 16,
  },
  actionIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "rgba(22, 163, 74, 0.14)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  actionTextWrap: {
    flex: 1,
  },
  actionTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
  },
  actionText: {
    color: colors.textSoft,
    fontSize: 12,
    fontWeight: "700",
    lineHeight: 18,
    marginTop: 4,
  },

  webButton: {
    backgroundColor: colors.blue,
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  webButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: "900",
    marginLeft: 8,
  },
});
