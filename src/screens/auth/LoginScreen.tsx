import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import Ionicons from "@expo/vector-icons/Ionicons";
import Svg, { Circle } from "react-native-svg";

import { loginUser } from "../../services/authService";
import type { LoginResult } from "../../types/auth";
import { colors } from "../../theme/colors";
import { styles } from "./LoginScreen.styles";

type Props = {
  onLoginSuccess: (result: LoginResult) => void;
  onGuestMode: () => void;
};

// Decorative dot-grid, top-right corner — no background image, no per-
// device sizing math, purely a small SVG layer behind the brand text.
function DotPattern() {
  const cols = 7;
  const rows = 7;
  const spacing = 16;
  const dots: React.ReactNode[] = [];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      dots.push(
        <Circle
          key={`${row}-${col}`}
          cx={col * spacing}
          cy={row * spacing}
          r={1.3}
          fill="rgba(79, 70, 229, 0.22)"
        />
      );
    }
  }

  return (
    <Svg
      style={styles.dotPattern}
      width={cols * spacing}
      height={rows * spacing}
      pointerEvents="none"
    >
      {dots}
    </Svg>
  );
}

export default function LoginScreen({ onLoginSuccess, onGuestMode }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  async function handleLogin() {
    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      const message = "Please enter your email and password.";
      setLoginError(message);
      Alert.alert("Login Required", message);
      return;
    }

    try {
      setLoggingIn(true);
      setLoginError("");

      const result = await loginUser(cleanEmail, password);

      if (!result.success) {
        setLoginError(result.message);
        Alert.alert("Login Failed", result.message);
        return;
      }

      onLoginSuccess(result);
    } finally {
      setLoggingIn(false);
    }
  }

  return (
    <SafeAreaView edges={["top", "bottom"]} style={styles.page}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brandBlock}>
            <DotPattern />
            <View style={styles.logoBox}>
              <Image
                source={require("../../../assets/logo.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.brandWordmark}>EMA</Text>
            <Text style={styles.brandName}>Operational Dashboard</Text>
            <Text style={styles.brandTag}>Operations Mobile</Text>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>Welcome back! 👋</Text>
            <Text style={styles.subtitle}>
              Sign in to your operations workspace to monitor endpoints, tickets
              and reports.
            </Text>

            <Text style={styles.fieldLabel}>Email address</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="mail-outline" size={18} color={colors.muted} />
              <TextInput
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  if (loginError) setLoginError("");
                }}
                placeholder="Enter your email address"
                placeholderTextColor={colors.muted}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                style={styles.input}
                returnKeyType="next"
                editable={!loggingIn}
              />
            </View>

            <Text style={styles.fieldLabel}>Password</Text>
            <View style={styles.inputWrap}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.muted} />
              <TextInput
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  if (loginError) setLoginError("");
                }}
                placeholder="Enter your password"
                placeholderTextColor={colors.muted}
                secureTextEntry={!showPassword}
                style={styles.input}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                editable={!loggingIn}
              />
              <TouchableOpacity
                onPress={() => setShowPassword((current) => !current)}
                style={styles.eyeButton}
                activeOpacity={0.7}
                disabled={loggingIn}
              >
                <Ionicons
                  name={showPassword ? "eye-off" : "eye"}
                  size={19}
                  color={colors.textSoft}
                />
              </TouchableOpacity>
            </View>

            {loginError ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{loginError}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[loggingIn && styles.buttonDisabled]}
              onPress={handleLogin}
              activeOpacity={0.85}
              disabled={loggingIn}
            >
              <LinearGradient
                colors={["#2E6FEE", "#4E8FFF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}
              >
                {loggingIn ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <View style={styles.buttonRow}>
                    <Text style={styles.buttonText}>Sign In</Text>
                    <Ionicons name="arrow-forward" size={17} color={colors.white} />
                  </View>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity
              style={styles.guestButton}
              onPress={onGuestMode}
              activeOpacity={0.8}
              disabled={loggingIn}
            >
              <Ionicons name="grid-outline" size={15} color={colors.blue} />
              <Text style={styles.guestButtonText}>Continue as Guest — Report an Issue</Text>
            </TouchableOpacity>

            <Text style={styles.protectedLabel}>PROTECTED ACCESS</Text>
            <View style={styles.securityRow}>
              <View style={styles.securityChip}>
                <Ionicons name="lock-closed" size={12} color={colors.green} />
                <Text style={styles.securityChipText}>Encrypted</Text>
              </View>
              <View style={styles.securityChip}>
                <Ionicons name="finger-print" size={12} color={colors.blueBright} />
                <Text style={styles.securityChipText}>Biometric</Text>
              </View>
              <View style={styles.securityChip}>
                <Ionicons name="shield-checkmark" size={12} color={colors.purple} />
                <Text style={styles.securityChipText}>2FA Ready</Text>
              </View>
            </View>
          </View>

          <View style={styles.taglineBlock}>
            <Ionicons name="shield-checkmark" size={16} color={colors.blue} />
            <Text style={styles.taglineTitle}>Your security is our priority</Text>
            <Text style={styles.taglineText}>
              Activity may be monitored for security and audit purposes.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
