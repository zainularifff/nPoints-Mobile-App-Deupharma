import Constants from "expo-constants";

// /api/dashboard/it-operations can take 20s+ to build on a large tenant
// fleet (large software-inventory scan, remote DB) — give it real headroom
// instead of aborting a request the backend was still going to finish.
export const API_TIMEOUT_MS = 45000;

const expoExtra =
  ((Constants.expoConfig?.extra || (Constants as any).manifest?.extra || {}) as Record<string, unknown>);

const envBaseUrl = (globalThis as any)?.process?.env?.EXPO_PUBLIC_API_BASE_URL as
  | string
  | undefined;

export function normalizeConfiguredBaseUrl(value?: string) {
  const cleanValue = String(value || "").trim();

  if (!cleanValue) return "";

  const withProtocol = /^https?:\/\//i.test(cleanValue)
    ? cleanValue
    : `http://${cleanValue}`;

  return withProtocol.replace(/\/+$/, "");
}

// Single shared backend for every client/tenant — the backend resolves which
// client database to use per request (via EMA_Control), so the app only ever
// needs this one URL, set from .env (local dev) or eas.json / EAS secrets
// (preview & production builds).
const activeApiBaseUrl = normalizeConfiguredBaseUrl(
  envBaseUrl || (expoExtra.apiBaseUrl as string | undefined)
);

export function getApiBaseUrl() {
  return activeApiBaseUrl;
}

export function getApiConfigError() {
  return !activeApiBaseUrl ? "Server is not configured. Please contact IT." : "";
}
