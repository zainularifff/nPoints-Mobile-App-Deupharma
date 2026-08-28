import React, { useEffect, useState } from "react";
import {
  Modal,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import Ionicons from "@expo/vector-icons/Ionicons";

import StatusPill from "../../components/StatusPill";
import {
  clearSessionToken,
  getBiometricEnabled,
  setBiometricEnabled,
} from "../../services/secureStorage";
import {
  getCurrentUser,
  getTwoFactorStatus,
  logoutUser,
  updateTwoFactorStatus,
} from "../../services/authService";
import {
  authenticateWithBiometric,
  getBiometricCapability,
} from "../../services/biometricService";
import { getAppBuildNumber, getAppEnvironment, getAppVersion } from "../../utils/appInfo";
import { colors } from "../../theme/colors";

import {
  dialogIconStyle,
  primaryButtonStyle,
  settingIconDynamicStyle,
  styles,
} from "./SettingsScreen.styles";

type SettingsScreenProps = {
  onLogout?: () => void;
};

type DialogType = "success" | "danger" | "info";

type DialogState = {
  visible: boolean;
  type: DialogType;
  title: string;
  message: string;
  primaryText: string;
  secondaryText?: string;
  onPrimary?: () => void | Promise<void>;
};

function getErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message || fallback;
  return String(error || fallback);
}

export default function SettingsScreen({ onLogout }: SettingsScreenProps) {
  const navigation = useNavigation<any>();

  const [profileName, setProfileName] = useState("");
  const [profileSubtitle, setProfileSubtitle] = useState("EMA Mobile User");
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [twoFactorLoading, setTwoFactorLoading] = useState(true);
  const [twoFactorAvailable, setTwoFactorAvailable] = useState(true);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);

  const appVersion = getAppVersion();
  const buildNumber = getAppBuildNumber();
  const appEnvironment = getAppEnvironment();

  const appVersionLabel = buildNumber
    ? `v${appVersion} (${buildNumber})`
    : `v${appVersion}`;

  const [dialog, setDialog] = useState<DialogState>({
    visible: false,
    type: "info",
    title: "",
    message: "",
    primaryText: "OK",
  });

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const user = await getCurrentUser();
      setProfileName(user?.name || user?.username || "EMA Mobile User");
      setProfileSubtitle(user?.email || user?.role || "EMA Mobile User");
    } catch (error) {
      // Keep the generic fallback if the profile call fails.
    }

    try {
      const biometric = await getBiometricEnabled();
      setBiometricEnabledState(Boolean(biometric));
    } catch (error) {
      setBiometricEnabledState(false);
    }

    try {
      setTwoFactorLoading(true);
      const status = await getTwoFactorStatus();
      setTwoFactorEnabled(Boolean(status.enabled));
      setTwoFactorAvailable(status.available !== false);
    } catch (error) {
      setTwoFactorEnabled(false);
      setTwoFactorAvailable(false);
    } finally {
      setTwoFactorLoading(false);
    }
  }

  function closeDialog() {
    setDialog((current) => ({
      ...current,
      visible: false,
    }));
  }

  function showDialog(payload: Omit<DialogState, "visible">) {
    setDialog({
      visible: true,
      ...payload,
    });
  }

  async function handleTwoFactorToggle(value: boolean) {
    if (twoFactorLoading) return;

    const previousValue = twoFactorEnabled;
    setTwoFactorEnabled(value);
    setTwoFactorLoading(true);

    try {
      const status = await updateTwoFactorStatus(value);
      const nowEnabled = Boolean(status.enabled);
      setTwoFactorEnabled(nowEnabled);
      setTwoFactorAvailable(status.available !== false);

      // 2FA and biometric are mutually exclusive — biometric login bypasses
      // the second verification step, which would defeat the point of 2FA.
      let biometricWasTurnedOff = false;
      if (nowEnabled && biometricEnabled) {
        await setBiometricEnabled(false);
        setBiometricEnabledState(false);
        biometricWasTurnedOff = true;
      }

      showDialog({
        type: value ? "success" : "info",
        title: "2FA Verification",
        message:
          status.message ||
          (value
            ? `2FA verification has been enabled for your account. Future login will require the second verification step.${biometricWasTurnedOff ? " Biometric login has been disabled since it bypasses this step." : ""}`
            : "2FA verification has been disabled for your account."),
        primaryText: "Done",
      });
    } catch (error) {
      setTwoFactorEnabled(previousValue);

      showDialog({
        type: "danger",
        title: "2FA Update Failed",
        message: getErrorMessage(error, "Unable to update 2FA setting. Please try again."),
        primaryText: "OK",
      });
    } finally {
      setTwoFactorLoading(false);
    }
  }

  async function handleBiometricToggle(value: boolean) {
    if (biometricLoading) return;

    const previousValue = biometricEnabled;
    setBiometricLoading(true);

    try {
      if (!value) {
        await setBiometricEnabled(false);
        setBiometricEnabledState(false);

        showDialog({
          type: "info",
          title: "Biometric Login",
          message: "Biometric login has been disabled for this device.",
          primaryText: "Done",
        });
        return;
      }

      if (twoFactorEnabled) {
        setBiometricEnabledState(false);
        showDialog({
          type: "info",
          title: "2FA Verification is On",
          message: "Biometric login can't be enabled while 2FA verification is on, since it would bypass that step. Disable 2FA first.",
          primaryText: "OK",
        });
        return;
      }

      const capability = await getBiometricCapability();

      if (!capability.available) {
        setBiometricEnabledState(false);
        showDialog({
          type: "danger",
          title: "Biometric Not Available",
          message: capability.reason || "Fingerprint or face unlock is not available or not enrolled on this device. Set it up in Android/iOS settings first.",
          primaryText: "OK",
        });
        return;
      }

      const result = await authenticateWithBiometric("Enable biometric login for OPS Mobile");

      if (!result.success) {
        setBiometricEnabledState(previousValue);
        showDialog({
          type: "info",
          title: "Biometric Not Enabled",
          message: result.message || "Biometric verification was cancelled. The setting was not changed.",
          primaryText: "OK",
        });
        return;
      }

      await setBiometricEnabled(true);
      setBiometricEnabledState(true);

      showDialog({
        type: "success",
        title: "Biometric Login",
        message: "Biometric login has been verified and enabled for this device.",
        primaryText: "Done",
      });
    } catch (error) {
      setBiometricEnabledState(previousValue);

      showDialog({
        type: "danger",
        title: "Update Failed",
        message: "Unable to update biometric setting. Please try again.",
        primaryText: "OK",
      });
    } finally {
      setBiometricLoading(false);
    }
  }

  function confirmLogout() {
    showDialog({
      type: "danger",
      title: "Logout",
      message: "Are you sure you want to logout from EMA Operational Dashboard?",
      primaryText: "Logout",
      secondaryText: "Cancel",
      onPrimary: async () => {
        // Invalidate the session server-side and clear the session token
        // only — biometric login preference is a per-device setting, not
        // tied to a login session, so it must survive logout/login. Each
        // step is independently guarded so a network hiccup or storage
        // error can never block the actual sign-out — the user must always
        // land back on the login screen when they tap Logout.
        try {
          await logoutUser();
        } catch (error) {
          console.warn("logoutUser() failed, continuing local sign-out:", (error as any)?.message || error);
        }
        try {
          await clearSessionToken();
        } catch (error) {
          console.warn("clearSessionToken() failed:", (error as any)?.message || error);
        }
        closeDialog();

        if (onLogout) {
          onLogout();
          return;
        }

        navigation.reset({
          index: 0,
          routes: [{ name: "Login" }],
        });
      },
    });
  }

  return (
    <>
      <SafeAreaView edges={["top"]} style={styles.safeArea}>
        <ScrollView
          style={styles.page}
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.header}>
            <Text style={styles.eyebrow}>EMA OPERATIONAL DASHBOARD</Text>
            <Text style={styles.title}>Settings</Text>
            <Text style={styles.subtitle}>
              Manage account access and mobile app preferences.
            </Text>
          </View>

          <View style={styles.profileCard}>
            <View style={styles.profileIcon}>
              <Ionicons name="person" size={22} color={colors.white} />
            </View>

            <View style={styles.profileTextWrap}>
              <Text style={styles.profileName}>{profileName || "EMA Mobile User"}</Text>
              <Text style={styles.profileEmail}>{profileSubtitle}</Text>
            </View>

            <StatusPill label="Signed In" tone="green" />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security</Text>

            <ToggleSettingRow
              icon="shield-checkmark"
              title="2FA Verification"
              description={
                twoFactorLoading
                  ? "Checking 2FA status..."
                  : !twoFactorAvailable
                    ? "2FA setting endpoint is unavailable"
                    : twoFactorEnabled
                      ? "Second verification is enabled during login"
                      : "Second verification is currently disabled"
              }
              value={twoFactorEnabled}
              onValueChange={handleTwoFactorToggle}
              tintColor={colors.blueBright}
              activeTrackColor="rgba(79, 70, 229, 0.35)"
              disabled={twoFactorLoading || !twoFactorAvailable}
            />

            <ToggleSettingRow
              icon="finger-print"
              title="Biometric Login"
              description={
                biometricLoading
                  ? "Verifying biometric setting..."
                  : twoFactorEnabled
                    ? "Disabled while 2FA verification is on"
                    : biometricEnabled
                      ? "Fingerprint or face unlock is enabled"
                      : "Fingerprint or face unlock is disabled"
              }
              value={biometricEnabled}
              onValueChange={handleBiometricToggle}
              tintColor={colors.green}
              activeTrackColor="rgba(22, 163, 74, 0.35)"
              disabled={biometricLoading || twoFactorEnabled}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App Info</Text>

            <StaticSettingRow
              icon="server"
              title="Environment"
              description="Current mobile app environment"
              status={appEnvironment}
              tone="blue"
              tintColor={colors.blue}
            />

            <StaticSettingRow
              icon="cube"
              title="App Version"
              description="EMA Operational Dashboard application build"
              status={appVersionLabel}
              tone="blue"
              tintColor={colors.green}
            />
          </View>

          <TouchableOpacity
            style={styles.logoutButton}
            activeOpacity={0.85}
            onPress={confirmLogout}
          >
            <Ionicons name="log-out" size={19} color={colors.red} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>

          <Text style={styles.footerText}>
            Logging out will clear the current session and return to the login
            page.
          </Text>
        </ScrollView>
      </SafeAreaView>

      <ModernDialog
        visible={dialog.visible}
        type={dialog.type}
        title={dialog.title}
        message={dialog.message}
        primaryText={dialog.primaryText}
        secondaryText={dialog.secondaryText}
        onClose={closeDialog}
        onPrimary={dialog.onPrimary}
      />
    </>
  );
}

function StaticSettingRow({
  icon,
  title,
  description,
  status,
  tone,
  tintColor = colors.blue,
}: any) {
  return (
    <View style={styles.settingRow}>
      <View style={[styles.settingIcon, settingIconDynamicStyle(tintColor)]}>
        <Ionicons name={icon} size={18} color={tintColor} />
      </View>

      <View style={styles.settingTextWrap}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDesc}>{description}</Text>
      </View>

      <StatusPill label={status} tone={tone} />
    </View>
  );
}

function ToggleSettingRow({
  icon,
  title,
  description,
  value,
  onValueChange,
  tintColor = colors.blue,
  activeTrackColor = "rgba(79, 70, 229, 0.35)",
  disabled = false,
}: any) {
  return (
    <View style={[styles.settingRow, disabled && { opacity: 0.62 }]}>
      <View style={[styles.settingIcon, settingIconDynamicStyle(tintColor)]}>
        <Ionicons name={icon} size={18} color={tintColor} />
      </View>

      <View style={styles.settingTextWrap}>
        <Text style={styles.settingTitle}>{title}</Text>
        <Text style={styles.settingDesc}>{description}</Text>
      </View>

      <Switch
        value={value}
        disabled={disabled}
        onValueChange={onValueChange}
        trackColor={{
          false: colors.surfaceHigh,
          true: activeTrackColor,
        }}
        thumbColor={value ? tintColor : colors.textSoft}
      />
    </View>
  );
}

function ModernDialog({
  visible,
  type,
  title,
  message,
  primaryText,
  secondaryText,
  onClose,
  onPrimary,
}: {
  visible: boolean;
  type: DialogType;
  title: string;
  message: string;
  primaryText: string;
  secondaryText?: string;
  onClose: () => void;
  onPrimary?: () => void | Promise<void>;
}) {
  const iconColor =
    type === "success"
      ? colors.green
      : type === "danger"
        ? colors.red
        : colors.blue;

  const iconBg =
    type === "success"
      ? "rgba(22, 163, 74, 0.14)"
      : type === "danger"
        ? "rgba(220, 38, 38, 0.14)"
        : "rgba(79, 70, 229, 0.14)";

  const primaryBg =
    type === "danger"
      ? colors.red
      : type === "success"
        ? colors.green
        : colors.blue;

  async function handlePrimary() {
    if (onPrimary) {
      try {
        await onPrimary();
      } catch (error) {
        // An action throwing must never leave the dialog stuck open with an
        // unresponsive button — close it so the user isn't blocked.
        console.warn("Dialog onPrimary failed:", (error as any)?.message || error);
        onClose();
      }
      return;
    }

    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.dialogCard}>
          <TouchableOpacity
            style={styles.dialogCloseButton}
            activeOpacity={0.85}
            onPress={onClose}
          >
            <Ionicons name="close" size={18} color={colors.textSoft} />
          </TouchableOpacity>

          <View style={[styles.dialogIcon, dialogIconStyle(iconBg)]}>
            <Ionicons
              name={type === "danger" ? "alert-circle" : "checkmark-circle"}
              size={30}
              color={iconColor}
            />
          </View>

          <Text style={styles.dialogTitle}>{title}</Text>
          <Text style={styles.dialogMessage}>{message}</Text>

          <View style={styles.dialogButtonRow}>
            {secondaryText ? (
              <TouchableOpacity
                style={styles.secondaryButton}
                activeOpacity={0.85}
                onPress={onClose}
              >
                <Text style={styles.secondaryButtonText}>{secondaryText}</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={[styles.primaryButton, primaryButtonStyle(primaryBg)]}
              activeOpacity={0.85}
              onPress={handlePrimary}
            >
              <Text style={styles.primaryButtonText}>{primaryText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
