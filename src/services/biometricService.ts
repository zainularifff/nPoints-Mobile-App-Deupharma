import { Platform } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";

export type BiometricCapability = {
  available: boolean;
  hasHardware: boolean;
  isEnrolled: boolean;
  label: string;
  reason: string;
};

// Labeled by platform, not by querying which auth types the device
// reports — modern iPhones no longer have a fingerprint sensor at all (Face
// ID only), and Android's LocalAuthentication API/UX is conventionally
// presented as "Fingerprint" even on devices that also support face
// unlock. This keeps the label matching what the user actually expects to
// see on their platform, not an accurate-but-confusing hardware readout.
export const BIOMETRIC_LABEL = Platform.OS === "ios" ? "Face ID" : "Fingerprint";

export type BiometricAuthResult = {
  success: boolean;
  error?: string;
  message?: string;
  cancelled?: boolean;
};

export async function getBiometricCapability(): Promise<BiometricCapability> {
  try {
    const [hasHardware, isEnrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);

    const label = BIOMETRIC_LABEL;

    let reason = "";

    if (!hasHardware) {
      reason = `This device does not have ${label} hardware.`;
    } else if (!isEnrolled) {
      reason = `No ${label} is set up on this device yet. Add one in device Settings, then try again.`;
    }

    return {
      available: hasHardware && isEnrolled,
      hasHardware,
      isEnrolled,
      label,
      reason,
    };
  } catch (error) {
    return {
      available: false,
      hasHardware: false,
      isEnrolled: false,
      label: BIOMETRIC_LABEL,
      reason: "Unable to check biometric capability on this device.",
    };
  }
}

export async function isBiometricAvailable() {
  const capability = await getBiometricCapability();
  return capability.available;
}

function isCancelError(code: string) {
  return code === "user_cancel" || code === "app_cancel" || code === "system_cancel";
}

function describeAuthError(code: string) {
  if (isCancelError(code)) {
    return "Biometric verification was cancelled.";
  }

  switch (code) {
    case "lockout":
      return "Too many failed attempts. Biometric is temporarily locked — unlock the device with PIN/pattern first, then try again.";
    case "not_enrolled":
      return `No ${BIOMETRIC_LABEL} is set up on this device. Add one in device Settings first.`;
    case "not_available":
      return `${BIOMETRIC_LABEL} is not available on this device.`;
    case "passcode_not_set":
      return "Device screen lock is not set. Set a PIN/pattern in device Settings first.";
    case "authentication_failed":
      return `${BIOMETRIC_LABEL} was not recognised. Please try again.`;
    default:
      return "Biometric verification failed. Please try again.";
  }
}

export async function authenticateWithBiometric(
  message: string
): Promise<BiometricAuthResult> {
  try {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: message,
      fallbackLabel: "Use device passcode",
      cancelLabel: "Cancel",
      disableDeviceFallback: false,
      requireConfirmation: false,
    });

    if (result.success) {
      return { success: true };
    }

    const code = String(result.error || "");

    return {
      success: false,
      error: code,
      message: describeAuthError(code),
      cancelled: isCancelError(code),
    };
  } catch (error) {
    return {
      success: false,
      error: "unknown",
      message: "Biometric verification failed. Please try again.",
    };
  }
}
