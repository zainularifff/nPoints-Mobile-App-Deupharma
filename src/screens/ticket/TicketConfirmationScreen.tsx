import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { CommonActions, useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CheckCircle2, Cpu, Layers, Phone, Tag, User } from "lucide-react-native";

import AppButton from "../../components/AppButton";
import StatusPill from "../../components/StatusPill";
import { colors, type StatusTone } from "../../theme/colors";
import type { CreateTicketResult, TicketPriority } from "../../services/ticketService";

const PRIORITY_TONE: Record<TicketPriority, StatusTone> = {
  Critical: "red",
  High: "amber",
  Medium: "blue",
  Low: "neutral",
};

export default function TicketConfirmationScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const result: CreateTicketResult = route.params?.result || {};
  const priorityTone = PRIORITY_TONE[result.priority] || "neutral";

  function createAnother() {
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: "CreateTicket" }],
      })
    );
  }

  function done() {
    // Pops to whichever screen this stack actually starts with (Overview
    // Home or Assets Home, depending which tab's stack this ticket was
    // created from) rather than a hardcoded route name that only exists in
    // one of them.
    navigation.popToTop();
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
      <Text style={styles.subtitle}>Your ticket has been submitted to the Service Desk.</Text>

      <View style={styles.ticketCard}>
        <Text style={styles.ticketLabel}>TICKET NUMBER</Text>
        <Text style={styles.ticketNumber}>{result.id || "-"}</Text>
        <View style={{ marginTop: 10 }}>
          <StatusPill label={result.priority || "-"} tone={priorityTone} />
        </View>
      </View>

      <View style={styles.detailPanel}>
        <DetailRow icon={Tag} label="Title" value={result.title || "-"} />
        <DetailRow
          icon={Layers}
          label="Category"
          value={[result.category, result.subcategory, result.incidentDetail].filter(Boolean).join(" / ") || "-"}
        />
        <DetailRow
          icon={Cpu}
          label="Asset"
          value={[result.deviceType, result.assetId].filter(Boolean).join(" — ") || "-"}
        />
        <DetailRow icon={User} label="Requester" value={result.requesterName || "-"} />
        <DetailRow icon={Phone} label="Phone" value={result.requesterPhone || "-"} />
      </View>

      <AppButton title="Create Another Ticket" onPress={createAnother} />
      <AppButton title="Done" onPress={done} variant="secondary" />
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
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    alignItems: "center",
  },
  successIcon: {
    width: 84,
    height: 84,
    borderRadius: 28,
    backgroundColor: colors.green,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  title: {
    color: colors.text,
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -0.4,
  },
  subtitle: {
    color: colors.textSoft,
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 6,
    marginBottom: 24,
  },
  ticketCard: {
    width: "100%",
    backgroundColor: colors.blueDeep,
    borderRadius: 24,
    paddingVertical: 22,
    alignItems: "center",
    marginBottom: 16,
  },
  ticketLabel: {
    color: "#C7C2FF",
    fontSize: 10,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  ticketNumber: {
    color: colors.white,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -0.5,
    marginTop: 6,
  },
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
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  detailIcon: {
    width: 42,
    height: 42,
    borderRadius: 15,
    backgroundColor: "rgba(79, 70, 229, 0.14)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  detailTextWrap: {
    flex: 1,
  },
  detailLabel: {
    color: colors.textSoft,
    fontSize: 11,
    fontWeight: "800",
  },
  detailValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
    marginTop: 3,
  },
});
