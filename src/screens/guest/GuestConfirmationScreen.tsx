import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { CommonActions, useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CheckCircle2, Phone, QrCode, User } from "lucide-react-native";

import AppButton from "../../components/AppButton";
import { colors } from "../../theme/colors";
import type { PublicOfflineAssetReportResult } from "../../services/publicOfflineAssetService";

type Props = { onExit: () => void };

export default function GuestConfirmationScreen({ onExit }: Props) {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const result: PublicOfflineAssetReportResult = route.params?.result || {};

  function scanAnother() {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "GuestScan" }],
      })
    );
  }

  return (
    <ScrollView
      style={styles.page}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + 40 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.successIcon}>
        <CheckCircle2 size={44} color={colors.white} strokeWidth={2.4} />
      </View>

      <Text style={styles.title}>Ticket Created</Text>
      <Text style={styles.subtitle}>Your report has been submitted to the Service Desk.</Text>

      <View style={styles.ticketCard}>
        <Text style={styles.ticketLabel}>TICKET NUMBER</Text>
        <Text style={styles.ticketNumber}>{result.id || "-"}</Text>
      </View>

      <View style={styles.detailPanel}>
        <DetailRow icon={QrCode} label="Asset" value={`${result.deviceName || "-"} (${result.assetTag || "-"})`} />
        <DetailRow icon={User} label="Reported By" value={result.requesterName || "-"} />
        <DetailRow icon={Phone} label="Phone" value={result.requesterPhone || "-"} />
      </View>

      <AppButton title="Scan Another Asset" onPress={scanAnother} />
      <AppButton title="Exit Guest Mode" onPress={onExit} variant="secondary" />
    </ScrollView>
  );
}

function DetailRow({ icon: Icon, label, value }: any) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>
        <Icon size={18} color={colors.blue} strokeWidth={2.7} />
      </View>
      <View style={styles.detailTextWrap}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: colors.background },
  container: { paddingHorizontal: 24, paddingBottom: 40, alignItems: "center" },
  successIcon: {
    width: 84,
    height: 84,
    borderRadius: 28,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  title: { color: colors.text, fontSize: 22, fontWeight: "900", letterSpacing: -0.4 },
  subtitle: { color: colors.textSoft, fontSize: 13, fontWeight: "600", textAlign: "center", marginTop: 6, marginBottom: 24 },
  ticketCard: {
    width: "100%",
    backgroundColor: colors.blueDeep,
    borderRadius: 24,
    paddingVertical: 22,
    alignItems: "center",
    marginBottom: 16,
  },
  ticketLabel: { color: "#C7C2FF", fontSize: 10, fontWeight: "900", letterSpacing: 1.2 },
  ticketNumber: { color: colors.white, fontSize: 28, fontWeight: "900", letterSpacing: -0.5, marginTop: 6 },
  detailPanel: {
    width: "100%",
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingTop: 4,
    marginBottom: 8,
  },
  detailRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderTopWidth: 1, borderTopColor: colors.border },
  detailIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "rgba(79, 70, 229, 0.14)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  detailTextWrap: { flex: 1 },
  detailLabel: { color: colors.textSoft, fontSize: 11, fontWeight: "800" },
  detailValue: { color: colors.text, fontSize: 13, fontWeight: "900", marginTop: 3 },
});
