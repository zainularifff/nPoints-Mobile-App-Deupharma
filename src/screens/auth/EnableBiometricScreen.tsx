import React, { useState } from "react";
import { ActivityIndicator, Alert, Platform, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  ArrowRight,
  CheckCircle2,
  Fingerprint,
  Lock,
  ScanFace,
  ShieldCheck,
  Smartphone,
} from "lucide-react-native";

import AppButton from "../../components/AppButton";
import {
  authenticateWithBiometric,
  BIOMETRIC_LABEL,
  getBiometricCapability,
} from "../../services/biometricService";
import { colors } from "../../theme/colors";

import { styles } from "./EnableBiometricScreen.styles";

// Modern iPhones have no fingerprint sensor at all — Face ID only — and
// Android's biometric UX is conventionally presented as fingerprint even
// on devices that also support face unlock. Same platform rule as
// BIOMETRIC_LABEL in biometricService.ts, applied to the icon too so the
// artwork always matches the word on screen.
const BiometricIcon = Platform.OS === "ios" ? ScanFace : Fingerprint;

type Props = {
  onComplete: (biometricEnabled: boolean) => void;
};

export default function EnableBiometricScreen({ onComplete }: Props) {
  const [loading, setLoading] = useState(false);

  async function handleEnableBiometric() {
    try {
      setLoading(true);

      const capability = await getBiometricCapability();

      if (!capability.available) {
        setLoading(false);

        Alert.alert(
          `${BIOMETRIC_LABEL} Not Available`,
          capability.reason || `${BIOMETRIC_LABEL} is not available on this device. You can continue without it.`
        );

        onComplete(false);
        return;
      }

      const result = await authenticateWithBiometric(
        `Enable ${BIOMETRIC_LABEL} login for EMA Operational Dashboard`
      );

      setLoading(false);

      if (!result.success) {
        Alert.alert(
          `${BIOMETRIC_LABEL} Not Enabled`,
          result.message || `${BIOMETRIC_LABEL} verification was cancelled. You can enable it later.`
        );

        onComplete(false);
        return;
      }

      onComplete(true);
    } catch (error) {
      setLoading(false);

      Alert.alert(
        `${BIOMETRIC_LABEL} Error`,
        `Unable to enable ${BIOMETRIC_LABEL} login. You can continue without it.`
      );

      onComplete(false);
    }
  }

  function handleSkip() {
    onComplete(false);
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.safeArea}>
      <View style={styles.page}>
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />

        <View style={styles.container}>
          <View style={styles.brandSection}>
            <View style={styles.iconRingWrap}>
              <View style={styles.iconRingOuter} pointerEvents="none" />
              <LinearGradient
                colors={["#6D63F2", "#4F46E5"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconBadge}
              >
                <BiometricIcon size={34} color={colors.white} strokeWidth={2.4} />
              </LinearGradient>
              <View style={styles.shieldBadge}>
                <ShieldCheck size={15} color={colors.green} strokeWidth={2.8} />
              </View>
            </View>

            <Text style={styles.title}>
              Enable <Text style={styles.titleAccent}>{BIOMETRIC_LABEL}</Text> Login?
            </Text>

            <Text style={styles.subtitle}>
              Use {BIOMETRIC_LABEL} for faster and more secure access to{" "}
              <Text style={styles.subtitleAccent}>EMA{" "}Dashboard.</Text>
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeaderRow}>
              <View style={styles.cardHeaderIcon}>
                <ShieldCheck size={20} color={colors.green} strokeWidth={2.6} />
              </View>
              <Text style={styles.cardTitle}>Secure this device</Text>
            </View>

            <Text style={styles.cardDescription}>
              {BIOMETRIC_LABEL} login will be used to unlock EMA Dashboard and
              verify your identity along with your password and 2FA
              verification.
            </Text>

            <View style={styles.securityList}>
              <SecurityRow
                icon={Lock}
                color={colors.blue}
                bg="rgba(79, 70, 229, 0.12)"
                title="Secure access"
                desc="Access your account securely on this device."
              />
              <View style={styles.securityDivider} />
              <SecurityRow
                icon={Smartphone}
                color={colors.cyan}
                bg="rgba(8, 145, 178, 0.12)"
                title="Device bound unlock"
                desc={`${BIOMETRIC_LABEL} is only used for this device.`}
              />
              <View style={styles.securityDivider} />
              <SecurityRow
                icon={CheckCircle2}
                color={colors.green}
                bg="rgba(22, 163, 74, 0.12)"
                title="No password stored"
                desc="Your biometric data is never stored or shared."
              />
            </View>

            <TouchableOpacity
              style={loading ? styles.buttonDisabled : undefined}
              onPress={handleEnableBiometric}
              activeOpacity={0.85}
              disabled={loading}
            >
              <LinearGradient
                colors={["#6D63F2", "#4F46E5"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.enableButton}
              >
                {loading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <View style={styles.enableButtonRow}>
                    <BiometricIcon size={18} color={colors.white} strokeWidth={2.6} />
                    <Text style={styles.enableButtonText}>Enable {BIOMETRIC_LABEL}</Text>
                    <ArrowRight size={17} color={colors.white} strokeWidth={2.6} />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <AppButton title="Skip for Now" variant="secondary" onPress={handleSkip} />
          </View>

          <View style={styles.footerRow}>
            <Lock size={12} color={colors.muted} strokeWidth={2.6} />
            <Text style={styles.footerText}>
              You can turn this on anytime later in Settings.
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function SecurityRow({
  icon: Icon,
  color,
  bg,
  title,
  desc,
}: {
  icon: any;
  color: string;
  bg: string;
  title: string;
  desc: string;
}) {
  return (
    <View style={styles.securityItem}>
      <View style={[styles.securityIcon, { backgroundColor: bg }]}>
        <Icon size={16} color={color} strokeWidth={2.6} />
      </View>

      <View style={styles.securityTextWrap}>
        <Text style={styles.securityTitle}>{title}</Text>
        <Text style={styles.securityDesc}>{desc}</Text>
      </View>
    </View>
  );
}
