import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ArrowLeft,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react-native";

import AppButton from "../../components/AppButton";
import { verifyTwoFactor } from "../../services/authService";
import { colors } from "../../theme/colors";
import type { TwoFactorChallenge } from "../../types/auth";
import { styles } from "./TwoFactorScreen.styles";

type Props = {
  challenge: TwoFactorChallenge | null;
  onVerifySuccess: () => void;
  onBack?: () => void;
};

export default function TwoFactorScreen({
  challenge,
  onVerifySuccess,
  onBack,
}: Props) {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const inputRef = useRef<TextInput>(null);

  function handleChange(value: string) {
    const cleaned = value.replace(/[^0-9]/g, "").slice(0, 6);
    setCode(cleaned);
    setError("");
  }

  async function handleVerify() {
    Keyboard.dismiss();

    if (!challenge) {
      setError("Verification session is missing. Please sign in again.");
      return;
    }

    if (code.length < 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    try {
      setVerifying(true);
      setError("");

      const result = await verifyTwoFactor(code, challenge);

      if (!result.success) {
        setError(result.message);
        return;
      }

      onVerifySuccess();
    } finally {
      setVerifying(false);
    }
  }

  return (
    <SafeAreaView edges={["top"]} style={styles.safeArea}>
      <View style={styles.page}>
        <View style={styles.glowTop} />
        <View style={styles.glowBottom} />

        <View style={styles.container}>
          {onBack ? (
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.backButton}
              onPress={onBack}
              disabled={verifying}
            >
              <ArrowLeft size={18} color={colors.text} strokeWidth={2.7} />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          ) : null}

          <View style={styles.brandSection}>
            <View style={styles.logoBox}>
              <ShieldCheck size={34} color={colors.white} strokeWidth={2.6} />
            </View>

            <Text style={styles.title}>Two-Factor Verification</Text>

            <Text style={styles.subtitle}>
              Enter the 6-digit verification code to continue.
            </Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardHeaderIcon}>
              <LockKeyhole size={22} color={colors.blueBright} strokeWidth={2.6} />
            </View>

            <Text style={styles.cardTitle}>Secure login</Text>

            <Text style={styles.cardDescription}>
              This step confirms your identity before accessing OPS Mobile.
            </Text>

            {challenge?.setupRequired ? (
              <View>
                {challenge.qrCode ? (
                  <Image
                    source={{ uri: challenge.qrCode }}
                    style={{ width: 150, height: 150, alignSelf: "center", marginBottom: 12 }}
                    resizeMode="contain"
                  />
                ) : null}

                {challenge.secret ? (
                  <Text style={styles.noteText}>
                    Setup key: {challenge.secret}
                  </Text>
                ) : null}
              </View>
            ) : null}

            <TouchableOpacity
              activeOpacity={0.95}
              style={styles.codeBox}
              onPress={() => inputRef.current?.focus()}
              disabled={verifying}
            >
              <Text style={styles.codeText}>{formatCodeDisplay(code)}</Text>
            </TouchableOpacity>

            <TextInput
              ref={inputRef}
              value={code}
              onChangeText={handleChange}
              keyboardType="number-pad"
              maxLength={6}
              style={styles.hiddenInput}
              autoFocus
              editable={!verifying}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            {verifying ? (
              <ActivityIndicator color={colors.blue} />
            ) : (
              <AppButton title="Verify Code" onPress={handleVerify} />
            )}

            <Text style={styles.noteText}>
              Use the code from your authenticator app.
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function formatCodeDisplay(code: string) {
  const padded = code.padEnd(6, "•");
  return padded.split("").join("  ");
}
