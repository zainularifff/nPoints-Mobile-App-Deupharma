import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ArrowLeft,
  Boxes,
  Building2,
  Calendar,
  Cpu,
  MapPin,
  Network,
  Shield,
  ShieldCheck,
  Tag,
  Ticket,
  User,
  Wrench,
} from "lucide-react-native";

import StatusPill from "../../components/StatusPill";
import { colors, type StatusTone } from "../../theme/colors";
import type { OfflineAssetListItem } from "../../services/offlineAssetService";

const STATUS_TONE: Record<string, StatusTone> = {
  Active: "green",
  "In Storage": "neutral",
  "Under Repair": "amber",
  Disposed: "red",
};

export default function OfflineAssetDetailScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const asset: OfflineAssetListItem = route.params?.asset || {};
  const tone = STATUS_TONE[asset.status] || "neutral";

  function reportIssue() {
    // Same prefill mechanism a QR scan uses — field names on
    // OfflineAssetListItem match OfflineAssetDetail on purpose.
    navigation.navigate("CreateTicket", { prefillAsset: asset });
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 24 }]}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.85}>
        <ArrowLeft size={20} color={colors.text} strokeWidth={2.7} />
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.profileCard}>
        <View style={styles.profileTop}>
          <View style={styles.profileIcon}>
            <Boxes size={28} color={colors.white} strokeWidth={2.7} />
          </View>
          <StatusPill label={asset.status || "-"} tone={tone} />
        </View>

        <Text style={styles.profileLabel}>OFFLINE ASSET</Text>
        <Text style={styles.profileTitle}>{asset.name || "Unknown Device"}</Text>
        <Text style={styles.profileDesc}>Asset Tag: {asset.assetTag || "-"}</Text>

        <View style={styles.profileFooter}>
          <View>
            <Text style={styles.footerLabel}>Type</Text>
            <Text style={styles.footerValue}>{asset.type || "-"}</Text>
          </View>
          <View style={styles.footerDivider} />
          <View>
            <Text style={styles.footerLabel}>Owner</Text>
            <Text style={styles.footerValue}>{asset.owner || "-"}</Text>
          </View>
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Identity</Text>
        <InfoRow icon={Tag} label="Manufacturer / Model" value={[asset.manufacturer, asset.model].filter(Boolean).join(" ") || "-"} />
        <InfoRow icon={Cpu} label="Serial Number" value={asset.serialNumber} />
        <InfoRow icon={Shield} label="Operating System" value={[asset.os, asset.osVersion].filter(Boolean).join(" ") || "-"} />
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Location</Text>
        <InfoRow icon={MapPin} label="Branch" value={asset.branch} />
        <InfoRow icon={Building2} label="Department" value={asset.department} />
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Network</Text>
        <InfoRow icon={Network} label="MAC Address" value={asset.macAddress} />
        <InfoRow icon={Network} label="IP Address" value={asset.ipAddress} />
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Lifecycle</Text>
        <InfoRow icon={Wrench} label="Condition" value={asset.condition} />
        <InfoRow icon={Calendar} label="Purchase Date" value={asset.purchaseDate} />
        <InfoRow icon={ShieldCheck} label="Warranty Expiry" value={asset.warrantyExpiry} />
        <InfoRow icon={User} label="Logged By / Created" value={asset.createdAt} />
      </View>

      <TouchableOpacity style={styles.actionButton} activeOpacity={0.85} onPress={reportIssue}>
        <Ticket size={18} color={colors.white} strokeWidth={2.7} />
        <Text style={styles.actionButtonText}>Report Issue / Create Ticket</Text>
      </TouchableOpacity>
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
        <Text style={styles.infoValue}>{value || "-"}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  container: { paddingHorizontal: 18, paddingBottom: 40 },
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
  backText: { color: colors.text, fontSize: 12, fontWeight: "900", marginLeft: 6 },

  profileCard: {
    backgroundColor: colors.blueDeep,
    borderWidth: 1,
    borderColor: "rgba(79, 70, 229, 0.18)",
    borderRadius: 30,
    padding: 20,
    marginBottom: 16,
  },
  profileTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  profileIcon: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: colors.blue,
    alignItems: "center",
    justifyContent: "center",
  },
  profileLabel: { color: "#C7C2FF", fontSize: 10, fontWeight: "900", letterSpacing: 1.2, marginTop: 20 },
  profileTitle: { color: colors.white, fontSize: 21, fontWeight: "900", letterSpacing: -0.5, marginTop: 6 },
  profileDesc: { color: "#C7C2FF", fontSize: 12, fontWeight: "700", marginTop: 8 },
  profileFooter: {
    marginTop: 18,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.12)",
    flexDirection: "row",
    alignItems: "center",
  },
  footerLabel: { color: "#C7C2FF", fontSize: 10, fontWeight: "800" },
  footerValue: { color: colors.white, fontSize: 13, fontWeight: "900", marginTop: 4 },
  footerDivider: { width: 1, height: 34, backgroundColor: "rgba(255,255,255,0.14)", marginHorizontal: 18 },

  panel: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 4,
    marginBottom: 16,
  },
  panelTitle: { color: colors.text, fontSize: 15, fontWeight: "900", paddingTop: 14, paddingBottom: 2 },
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
  infoTextWrap: { flex: 1 },
  infoLabel: { color: colors.textSoft, fontSize: 11, fontWeight: "800" },
  infoValue: { color: colors.text, fontSize: 13, fontWeight: "900", marginTop: 3 },

  actionButton: {
    backgroundColor: colors.blue,
    borderRadius: 18,
    paddingVertical: 15,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 4,
  },
  actionButtonText: { color: colors.white, fontSize: 13, fontWeight: "900", marginLeft: 8 },
});
