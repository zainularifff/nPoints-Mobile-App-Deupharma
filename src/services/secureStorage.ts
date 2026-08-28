import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "ops_access_token";
const BIOMETRIC_KEY = "ops_biometric_enabled";
const REMEMBERED_EMAIL_KEY = "ops_remembered_email";

// Keep secrets on this device only and readable only while it is unlocked.
const secureStoreOptions: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

function webSetItem(key: string, value: string) {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(key, value);
  }
}

function webGetItem(key: string) {
  if (typeof window !== "undefined") {
    return window.localStorage.getItem(key);
  }

  return null;
}

function webDeleteItem(key: string) {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(key);
  }
}

export async function saveSessionToken(token: string) {
  if (Platform.OS === "web") {
    webSetItem(TOKEN_KEY, token);
    return;
  }

  await SecureStore.setItemAsync(TOKEN_KEY, token, secureStoreOptions);
}

export async function getSessionToken() {
  if (Platform.OS === "web") {
    return webGetItem(TOKEN_KEY);
  }

  return await SecureStore.getItemAsync(TOKEN_KEY, secureStoreOptions);
}

export async function clearSessionToken() {
  if (Platform.OS === "web") {
    webDeleteItem(TOKEN_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(TOKEN_KEY, secureStoreOptions);
}

export async function setBiometricEnabled(enabled: boolean) {
  if (Platform.OS === "web") {
    webSetItem(BIOMETRIC_KEY, enabled ? "true" : "false");
    return;
  }

  await SecureStore.setItemAsync(BIOMETRIC_KEY, enabled ? "true" : "false", secureStoreOptions);
}

export async function getBiometricEnabled() {
  let value: string | null = null;

  if (Platform.OS === "web") {
    value = webGetItem(BIOMETRIC_KEY);
  } else {
    value = await SecureStore.getItemAsync(BIOMETRIC_KEY, secureStoreOptions);
  }

  return value === "true";
}

export async function clearBiometricSetting() {
  if (Platform.OS === "web") {
    webDeleteItem(BIOMETRIC_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(BIOMETRIC_KEY, secureStoreOptions);
}

// Backs the Login screen's "Remember me" checkbox — just prefills the
// email field next launch, not tied to session length or token expiry
// (that's controlled server-side). Not a secret, but stored the same way
// as everything else here for consistency.
export async function setRememberedEmail(email: string) {
  if (Platform.OS === "web") {
    webSetItem(REMEMBERED_EMAIL_KEY, email);
    return;
  }

  await SecureStore.setItemAsync(REMEMBERED_EMAIL_KEY, email, secureStoreOptions);
}

export async function getRememberedEmail() {
  if (Platform.OS === "web") {
    return webGetItem(REMEMBERED_EMAIL_KEY);
  }

  return await SecureStore.getItemAsync(REMEMBERED_EMAIL_KEY, secureStoreOptions);
}

export async function clearRememberedEmail() {
  if (Platform.OS === "web") {
    webDeleteItem(REMEMBERED_EMAIL_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(REMEMBERED_EMAIL_KEY, secureStoreOptions);
}

export async function clearAuthStorage() {
  await clearSessionToken();
  await clearBiometricSetting();
}