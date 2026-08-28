// Online/managed-device counterpart to offlineAssetService.ts /
// publicOfflineAssetService.ts — backs scanning a Hardware Inventory
// device's QR sticker (see buildDeviceQrValue in the web app's
// Hardware.tsx), as opposed to an Offline Asset's QR (buildOfflineAssetQrValue
// in OfflineDevice.tsx). Both QR types are scannable from the same camera
// screens (ScanAssetScreen, GuestScanScreen) — this module only owns the
// "online" half of that.
//
// Always hits the public, unauthenticated /api/public/asset-lookup/* routes
// (same ones the web's standalone DeviceLookup.tsx page uses) rather than
// any /api/mobile/* equivalent — there isn't a session-scoped one, and this
// endpoint already returns only a minimal, non-sensitive field set, so it's
// fine to call whether or not the caller is logged in.
import { getApiBaseUrl, getApiConfigError, API_TIMEOUT_MS } from "../config/api";
import { ApiError } from "./apiClient";

export type PublicDeviceDetail = {
  agent: string;
  assetId: string;
  deviceId: string;
  name: string;
  platform: string;
  model: string;
  status: string;
  department: string;
  groupPath: string;
  ip: string;
  lastConnected: string | null;
  location: string;
};

function text(value: unknown, fallback = "-") {
  const clean = String(value ?? "").trim();
  return clean || fallback;
}

// The QR code on a Hardware Inventory device encodes a URL to the web app's
// public, no-login lookup page (.../device-lookup?agent=X&assetId=Y) — see
// buildDeviceQrValue in Hardware.tsx — not the raw id by itself.
export function parseDeviceQrValue(scannedValue: string): { agent: string; assetId: string } | null {
  const raw = String(scannedValue || "").trim();
  if (!raw) return null;

  try {
    const url = new URL(raw);
    const agent = (url.searchParams.get("agent") || "").trim().toUpperCase();
    const assetId = (url.searchParams.get("assetId") || "").trim();
    if (agent && assetId && /^\d+$/.test(assetId)) {
      return { agent, assetId };
    }
  } catch (_) {
    // Not a URL — this QR format has no bare-value fallback (unlike Offline
    // Asset's), since agent+assetId can't be inferred from a single number.
  }

  return null;
}

// Mirrors publicOfflineAssetService.ts's publicRequest() — deliberately
// bypasses apiRequest() in apiClient.ts, which always tries to attach a
// session token; wrong for a route with no login context either way.
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

export async function fetchPublicDeviceLookup(agent: string, assetId: string): Promise<PublicDeviceDetail> {
  const response: any = await publicRequest(
    `/api/public/asset-lookup/${encodeURIComponent(agent)}/${encodeURIComponent(assetId)}`
  );
  const data = response?.data || {};

  return {
    agent,
    assetId,
    deviceId: text(data.deviceId),
    name: text(data.name, "Unknown Device"),
    platform: text(data.platform, ""),
    model: text(data.model, ""),
    status: text(data.status, "Unknown"),
    department: text(data.department, ""),
    groupPath: text(data.groupPath, ""),
    ip: text(data.ip, ""),
    lastConnected: data.lastConnected || null,
    location: text(data.location, ""),
  };
}

export type PublicDeviceReportResult = {
  id: string;
  requesterName: string;
  requesterPhone: string;
  assetTag: string;
  deviceName: string;
  message: string;
};

export async function submitPublicDeviceReport(
  agent: string,
  assetId: string,
  input: { name: string; phone: string; description: string }
): Promise<PublicDeviceReportResult> {
  const response: any = await publicRequest(
    `/api/public/asset-lookup/${encodeURIComponent(agent)}/${encodeURIComponent(assetId)}/report`,
    {
      method: "POST",
      body: {
        name: input.name.trim(),
        phone: input.phone.trim(),
        description: input.description.trim(),
      },
    }
  );
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
