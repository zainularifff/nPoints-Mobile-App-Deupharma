import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";

import LoginScreen from "./src/screens/auth/LoginScreen";
import TwoFactorScreen from "./src/screens/auth/TwoFactorScreen";
import EnableBiometricScreen from "./src/screens/auth/EnableBiometricScreen";
import BiometricUnlockScreen from "./src/screens/auth/BiometricUnlockScreen";
import MainTabs from "./src/navigation/MainTabs";
import GuestStack from "./src/navigation/GuestStack";

import {
  clearSessionToken,
  getBiometricEnabled,
  getSessionToken,
  setBiometricEnabled,
} from "./src/services/secureStorage";
import { onSessionExpired } from "./src/services/apiClient";
import { clearOpsMobileCache } from "./src/services/opsMobileService";

import { colors } from "./src/theme/colors";
import type { LoginResult, TwoFactorChallenge } from "./src/types/auth";

type AppStep =
  | "loading"
  | "login"
  | "twoFactor"
  | "enableBiometric"
  | "biometricUnlock"
  | "dashboard"
  | "guest";

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.blue,
    background: colors.background,
    card: colors.surface,
    text: colors.text,
    border: colors.border,
  },
};

export default function App() {
  const [step, setStep] = useState<AppStep>("loading");
  const [twoFactorChallenge, setTwoFactorChallenge] =
    useState<TwoFactorChallenge | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fallbackTimer = setTimeout(() => {
      if (isMounted) {
        setStep((currentStep) =>
          currentStep === "loading" ? "login" : currentStep
        );
      }
    }, 1500);

    async function initialiseApp() {
      try {
        const token = await getSessionToken();
        const biometricEnabled = await getBiometricEnabled();

        if (!isMounted) return;

        clearTimeout(fallbackTimer);

        if (token && biometricEnabled) {
          setStep("biometricUnlock");
          return;
        }

        if (token) {
          setStep("dashboard");
          return;
        }

        setStep("login");
      } catch (error) {
        if (!isMounted) return;

        clearTimeout(fallbackTimer);
        setStep("login");
      }
    }

    initialiseApp();

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
    };
  }, []);

  useEffect(() => {
    // Return to login when the backend rejects the saved session token.
    return onSessionExpired(() => {
      clearOpsMobileCache();
      setTwoFactorChallenge(null);
      setStep((currentStep) =>
        currentStep === "dashboard" || currentStep === "biometricUnlock"
          ? "login"
          : currentStep
      );
    });
  }, []);

  async function handleLoginSuccess(result: LoginResult) {
    if (!result.success) return;

    if (result.twoFactorRequired) {
      setTwoFactorChallenge(result.challenge);
      setStep("twoFactor");
      return;
    }

    setTwoFactorChallenge(null);
    await goToDashboardOrBiometricPrompt();
  }

  // Only ask to enable biometric login once — if this device already has it
  // on from a previous session, a fresh login should go straight to the
  // dashboard instead of asking again every time.
  async function goToDashboardOrBiometricPrompt() {
    try {
      const alreadyEnabled = await getBiometricEnabled();
      if (alreadyEnabled) {
        clearOpsMobileCache();
        setStep("dashboard");
        return;
      }
    } catch (error) {
      // If the read fails, fall through to asking — same as a fresh device.
    }

    setStep("enableBiometric");
  }

  async function completeLogin(biometricEnabled: boolean) {
    // A fresh sign-in may belong to a different tenant than whatever is
    // still sitting in the ops data cache from a previous session — never
    // let another client's dashboard/ticket/risk data leak across logins.
    clearOpsMobileCache();

    try {
      await setBiometricEnabled(biometricEnabled);
      setStep("dashboard");
    } catch (error) {
      setStep("dashboard");
    }
  }

  async function handleUsePasswordInstead() {
    // Falling back to password for this one unlock shouldn't turn off
    // biometric login for next time — only drop the session token.
    try {
      await clearSessionToken();
    } catch (error) {
      // Ignore storage error
    }

    clearOpsMobileCache();
    setTwoFactorChallenge(null);
    setStep("login");
  }

  async function handleLogout() {
    // Biometric login preference is a per-device setting, not tied to a
    // session — logging out must only clear the session token, otherwise
    // biometric login silently turns itself off every time someone logs out.
    try {
      await clearSessionToken();
    } catch (error) {
      // Ignore storage error
    }

    clearOpsMobileCache();
    setTwoFactorChallenge(null);
    setStep("login");
  }

  function renderScreen() {
    if (step === "loading") {
      return (
        <SafeAreaView edges={["top", "bottom"]} style={styles.loadingPage}>
          <View style={styles.loadingGlow} />
          <View style={styles.loadingLogo}>
            <ActivityIndicator size="large" color={colors.blueBright} />
          </View>
          <Text style={styles.loadingBrand}>EMA OPS</Text>
          <Text style={styles.loadingText}>Preparing your workspace...</Text>
        </SafeAreaView>
      );
    }

    if (step === "login") {
      return (
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          onGuestMode={() => setStep("guest")}
        />
      );
    }

    if (step === "guest") {
      return (
        <NavigationContainer theme={navigationTheme}>
          <GuestStack onExit={() => setStep("login")} />
        </NavigationContainer>
      );
    }

    if (step === "twoFactor") {
      return (
        <TwoFactorScreen
          challenge={twoFactorChallenge}
          onVerifySuccess={() => {
            setTwoFactorChallenge(null);
            goToDashboardOrBiometricPrompt();
          }}
          onBack={() => {
            setTwoFactorChallenge(null);
            setStep("login");
          }}
        />
      );
    }

    if (step === "enableBiometric") {
      return <EnableBiometricScreen onComplete={completeLogin} />;
    }

    if (step === "biometricUnlock") {
      return (
        <BiometricUnlockScreen
          onUnlockSuccess={() => setStep("dashboard")}
          onUsePassword={handleUsePasswordInstead}
        />
      );
    }

    return (
      <NavigationContainer theme={navigationTheme}>
        <MainTabs onLogout={handleLogout} />
      </NavigationContainer>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      {renderScreen()}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingPage: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingGlow: {
    position: "absolute",
    top: "28%",
    width: 260,
    height: 260,
    borderRadius: 260,
    backgroundColor: "rgba(79, 70, 229, 0.14)",
  },
  loadingLogo: {
    width: 84,
    height: 84,
    borderRadius: 28,
    backgroundColor: colors.surfaceSoft,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  loadingBrand: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 4,
  },
  loadingText: {
    color: colors.textSoft,
    marginTop: 8,
    fontSize: 13,
    fontWeight: "500",
  },
});
