import React, { useEffect, useRef, useState } from "react";
import { Alert, Platform, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Fingerprint,
  LockKeyhole,
  ScanFace,
  ShieldCheck,
  UserRound,
} from "lucide-react-native";
import AppButton from "../../components/AppButton";
import {
  authenticateWithBiometric,
  BIOMETRIC_LABEL,
  getBiometricCapability,
} from "../../services/biometricService";
import { colors } from "../../theme/colors";

// Same platform rule as EnableBiometricScreen — modern iPhones are Face ID
// only, Android's biometric UX is conventionally "Fingerprint".
const BiometricIcon = Platform.OS === "ios" ? ScanFace : Fingerprint;

type Props = {
  onUnlockSuccess: () => void;
  onUsePassword: () => void;
};

export default function BiometricUnlockScreen({
  onUnlockSuccess,
  onUsePassword,
}: Props) {
  const [loading, setLoading] = useState(false);
  const unlockInProgress = useRef(false);

  async function handleUnlock(isAutoPrompt = false) {
    if (unlockInProgress.current) return;
    unlockInProgress.current = true;
    setLoading(true);

    try {
      const capability = await getBiometricCapability();

      if (!capability.available) {
        Alert.alert(
          `${BIOMETRIC_LABEL} Not Available`,
          capability.reason || `${BIOMETRIC_LABEL} is not available on this device. Please login using password.`
        );

        onUsePassword();
        return;
      }

      const result = await authenticateWithBiometric("Unlock OPS Mobile");

      if (result.success) {
        onUnlockSuccess();
        return;
      }

      // If the auto prompt was cancelled, stay quiet and let the user
      // choose the button or password fallback.
      if (!(isAutoPrompt && result.cancelled)) {
        Alert.alert(
          "Unlock Failed",
          result.message || `${BIOMETRIC_LABEL} verification was cancelled or failed.`
        );
      }
    } finally {
      unlockInProgress.current = false;
      setLoading(false);
    }
  }

  useEffect(() => {
    // Trigger the fingerprint prompt automatically when the screen opens.
    // The short delay lets the screen finish rendering first (Android needs
    // this before BiometricPrompt can attach).
    const timer = setTimeout(() => {
      handleUnlock(true);
    }, 600);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.page}>
      <View style={styles.glowTop} />
      <View style={styles.glowBottom} />

      <View style={styles.container}>
        <View style={styles.brandSection}>
          <View style={styles.logoBox}>
            <BiometricIcon size={36} color={colors.white} strokeWidth={2.6} />
          </View>

          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            Unlock OPS Mobile using {BIOMETRIC_LABEL}.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.profileCircle}>
            <UserRound size={28} color={colors.blueBright} strokeWidth={2.6} />
          </View>

          <Text style={styles.cardTitle}>Secure unlock required</Text>
          <Text style={styles.cardDescription}>
            Your session is available on this device. Please verify your identity
            before accessing the dashboard.
          </Text>

          <View style={styles.securityPanel}>
            <View style={styles.securityRow}>
              <LockKeyhole size={16} color={colors.blueBright} strokeWidth={2.6} />
              <Text style={styles.securityText}>Session protected</Text>
            </View>

            <View style={styles.securityRow}>
              <ShieldCheck size={16} color={colors.green} strokeWidth={2.6} />
              <Text style={styles.securityText}>Authorized access only</Text>
            </View>
          </View>

          <AppButton
            title={`Unlock with ${BIOMETRIC_LABEL}`}
            onPress={() => handleUnlock()}
            loading={loading}
          />

          <AppButton
            title="Use Password Instead"
            variant="secondary"
            onPress={onUsePassword}
          />

          <Text style={styles.noteText}>
            Password fallback will clear the saved session and return to normal
            login.
          </Text>
        </View>

        <Text style={styles.footerText}>
          Activity may be monitored for security and audit purposes.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  glowTop: {
    position: "absolute",
    top: -120,
    right: -100,
    width: 280,
    height: 280,
    borderRadius: 280,
    backgroundColor: "rgba(79, 70, 229, 0.16)",
  },
  glowBottom: {
    position: "absolute",
    bottom: -150,
    left: -120,
    width: 280,
    height: 280,
    borderRadius: 280,
    backgroundColor: "rgba(22, 163, 74, 0.10)",
  },
  brandSection: {
    alignItems: "center",
    marginBottom: 28,
  },
  logoBox: {
    width: 76,
    height: 76,
    borderRadius: 26,
    backgroundColor: colors.blue,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: colors.blue,
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 8,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: "800",
    letterSpacing: -0.6,
    textAlign: "center",
  },
  subtitle: {
    color: colors.textSoft,
    marginTop: 8,
    fontSize: 13,
    fontWeight: "500",
    textAlign: "center",
    lineHeight: 19,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    padding: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 4,
  },
  profileCircle: {
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: "rgba(79, 70, 229, 0.14)",
    borderWidth: 1,
    borderColor: "rgba(79, 70, 229, 0.28)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  cardTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.4,
  },
  cardDescription: {
    color: colors.textSoft,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 8,
    marginBottom: 18,
  },
  securityPanel: {
    backgroundColor: colors.surfaceSoft,
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  securityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  securityText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "600",
    marginLeft: 8,
  },
  noteText: {
    color: colors.muted,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "500",
    marginTop: 14,
    lineHeight: 16,
  },
  footerText: {
    color: colors.muted,
    fontSize: 11,
    textAlign: "center",
    marginTop: 22,
  },
});
