// Unauthenticated counterpart to offlineAssetService.ts — backs the
// "Guest" flow (Login screen -> Continue as Guest -> scan QR -> report
// only, no dashboard access). Hits /api/public/offline-assets/* instead
// of /api/mobile/offline-assets/*, so these calls never attach a session
// token (there isn't one) and never touch tenant-scoped mobile auth.
import { getApiBaseUrl, getApiConfigError, API_TIMEOUT_MS } from "../config/api";
import { ApiError } from "./apiClient";

export type PublicOfflineAssetDetail = {
  assetTag: string;
  name: string;
  type: string;
  manufacturer: string;
  model: string;
  serialNumber: string;
  branch: string;
  department: string;
  owner: string;
  status: string;
};

export type PublicOfflineAssetReportResult = {
  id: string;
  requesterName: string;
  requesterPhone: string;
  assetTag: string;
  deviceName: string;
  message: string;
};

function text(value: unknown, fallback = "-") {
  const clean = String(value ?? "").trim();
  return clean || fallback;
}

// Deliberately bypasses apiRequest() in apiClient.ts — that helper always
// tries to attach a session token when one exists, which is wrong for a
// public/guest endpoint (nothing here is scoped to a logged-in identity).
async function publicRequest<T = any>(endpoint: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const configError = getApiConfigError();
  if (configError) {
    throw new ApiError(configError, 0, { code: "API_CONFIG_MISSING", endpoint });
  }

  const url = `${getApiBaseUrl()}${endpoint}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method || "GET",
      headers: {
        Accept: "application/json",
        ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
  } catch (error: any) {
    throw new ApiError(
      error?.name === "AbortError"
        ? "Connection timed out. Please check your network and try again."
        : "Cannot connect to the server. Please check your network connection and try again.",
      0,
      { code: error?.name === "AbortError" ? "API_TIMEOUT" : "API_CONNECTION_FAILED", endpoint }
    );
  } finally {
    clearTimeout(timeout);
  }

  const responseText = await response.text();
  const payload = responseText ? JSON.parse(responseText) : null;

  if (!response.ok || payload?.success === false) {
    const message = payload?.message || payload?.error || `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status, { code: payload?.code || `HTTP_${response.status}`, endpoint, payload });
  }

  return payload as T;
}

export async function fetchPublicOfflineAsset(id: string): Promise<PublicOfflineAssetDetail> {
  const response: any = await publicRequest(`/api/public/offline-assets/${encodeURIComponent(id)}`);
  const data = response?.data || {};

  return {
    assetTag: text(data.assetTag),
    name: text(data.name, "Unknown Device"),
    type: text(data.type, "Other"),
    manufacturer: text(data.manufacturer),
    model: text(data.model),
    serialNumber: text(data.serialNumber),
    branch: text(data.branch),
    department: text(data.department),
    owner: text(data.owner),
    status: text(data.status, "Active"),
  };
}

export async function submitPublicOfflineAssetReport(
  id: string,
  input: { name: string; phone: string; description: string }
): Promise<PublicOfflineAssetReportResult> {
  const response: any = await publicRequest(`/api/public/offline-assets/${encodeURIComponent(id)}/report`, {
    method: "POST",
    body: {
      name: input.name.trim(),
      phone: input.phone.trim(),
      description: input.description.trim(),
    },
  });
  const data = response?.data || {};

  return {
    id: text(data.id, ""),
    requesterName: text(data.requesterName),
    requesterPhone: text(data.requesterPhone),
    assetTag: text(data.assetTag),
    deviceName: text(data.deviceName),
    message: text(response?.message, "Ticket created."),
  };
}
