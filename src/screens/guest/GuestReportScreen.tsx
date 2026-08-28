import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, Building2, Cpu, Layers, MapPin, Tag, User, Phone as PhoneIcon } from "lucide-react-native";

import StatusPill from "../../components/StatusPill";
import AppButton from "../../components/AppButton";
import { colors } from "../../theme/colors";
import { ApiError } from "../../services/apiClient";
import {
  submitPublicOfflineAssetReport,
  type PublicOfflineAssetDetail,
} from "../../services/publicOfflineAssetService";
import { submitPublicDeviceReport } from "../../services/deviceLookupService";

const STATUS_TONE: Record<string, "green" | "amber" | "red" | "neutral"> = {
  active: "green",
  "in storage": "neutral",
  "under repair": "amber",
  disposed: "red",
};

export default function GuestReportScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  // "offline" = Offline Asset (EMA_Offline_Asset), "online" = a monitored
  // Hardware Inventory device — see GuestScanScreen for how each QR format
  // resolves to this. Defaults to "offline" so any existing navigation call
  // that predates this param still works unchanged.
  const kind: "offline" | "online" = route.params?.kind || "offline";
  const assetId: string = route.params?.assetId;
  const agent: string | undefined = route.params?.agent;
  const asset: PublicOfflineAssetDetail = route.params?.asset;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const statusTone = STATUS_TONE[String(asset?.status || "").toLowerCase()] || "neutral";
  const canSubmit = name.trim() && phone.trim() && description.trim() && !submitting;

  async function handleSubmit() {
    if (!name.trim()) {
      Alert.alert("Name Required", "Please enter your name.");
      return;
    }
    if (!phone.trim()) {
      Alert.alert("Phone Required", "Please enter your phone number.");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Issue Description Required", "Please describe the issue before submitting.");
      return;
    }

    setSubmitting(true);
    try {
      const input = { name: name.trim(), phone: phone.trim(), description: description.trim() };
      const result =
        kind === "online" && agent
          ? await submitPublicDeviceReport(agent, assetId, input)
          : await submitPublicOfflineAssetReport(assetId, input);
      navigation.replace("GuestConfirmation", { result });
    } catch (error: any) {
      const message =
        error instanceof ApiError ? error.message : "Failed to submit report. Please try again.";
      Alert.alert("Submit Failed", message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        contentContainerStyle={[styles.container, { paddingTop: insets.top + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.85}>
          <ArrowLeft size={20} color={colors.text} strokeWidth={2.7} />
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>

        <View style={styles.profileCard}>
          <View style={styles.profileTop}>
            <View style={styles.profileIcon}>
              <Cpu size={28} color={colors.white} strokeWidth={2.7} />
            </View>
            <StatusPill label={asset?.status || "-"} tone={statusTone} />
          </View>

          <Text style={styles.profileLabel}>{kind === "online" ? "DEVICE" : "OFFLINE ASSET"} · GUEST REPORT</Text>
          <Text style={styles.profileTitle}>{asset?.name || "Unknown Device"}</Text>
          <Text style={styles.profileDesc}>Asset Tag: {asset?.assetTag || "-"}</Text>
        </View>

        <View style={styles.identityPanel}>
          <Text style={styles.panelTitle}>Asset Details</Text>
          <InfoRow icon={Tag} label="Type" value={asset?.type} />
          <InfoRow icon={Layers} label="Manufacturer / Model" value={`${asset?.manufacturer || "-"} ${asset?.model || ""}`.trim()} />
          <InfoRow icon={MapPin} label="Branch" value={asset?.branch} />
          <InfoRow icon={Building2} label="Department" value={asset?.department} />
        </View>

        <View style={styles.formPanel}>
          <Text style={styles.panelTitle}>Your Details</Text>
          <Text style={styles.formHint}>
            No account needed — just tell us who's reporting this so we can follow up if needed.
          </Text>

          <View style={styles.inputRow}>
            <User size={16} color={colors.blue} strokeWidth={2.6} />
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.muted}
              style={styles.inputField}
            />
          </View>

          <View style={styles.inputRow}>
            <PhoneIcon size={16} color={colors.blue} strokeWidth={2.6} />
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Phone number"
              placeholderTextColor={colors.muted}
              keyboardType="phone-pad"
              style={styles.inputField}
            />
          </View>

          <Text style={[styles.panelTitle, { marginTop: 14 }]}>Issue Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="e.g. Screen is cracked and device won't power on..."
            placeholderTextColor={colors.muted}
            style={styles.textarea}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        </View>

        <AppButton title="Submit Report" onPress={handleSubmit} loading={submitting} disabled={!canSubmit} />
      </ScrollView>
    </KeyboardAvoidingView>
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

  identityPanel: {
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

  formPanel: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
    marginBottom: 8,
  },
  formHint: { color: colors.textSoft, fontSize: 12, fontWeight: "600", lineHeight: 18, marginTop: 4, marginBottom: 12 },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 10,
  },
  inputField: { flex: 1, marginLeft: 10, color: colors.text, fontSize: 14, fontWeight: "600" },
  textarea: {
    minHeight: 130,
    borderRadius: 16,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
    marginTop: 8,
  },
});
