import { apiRequest } from "./apiClient";

export type OfflineAssetDetail = {
  id: string;
  assetTag: string;
  name: string;
  type: string;
  manufacturer: string;
  model: string;
  os: string;
  branch: string;
  department: string;
  status: string;
};

// Full record shape from GET /api/offline-assets (see oaNormalizeAssetRow in
// server.js) — backs the Offline Asset Inventory list/detail screens.
// OfflineAssetDetail (above) is the leaner subset the QR-lookup endpoint
// returns; every OfflineAssetDetail field name matches here on purpose so
// a list/detail row can be passed straight into CreateTicketScreen's
// prefillAsset param, same as a QR scan result.
export type OfflineAssetListItem = OfflineAssetDetail & {
  serialNumber: string;
  osVersion: string;
  macAddress: string;
  ipAddress: string;
  owner: string;
  condition: string;
  purchaseDate: string;
  warrantyExpiry: string;
  createdAt: string;
};

export const OFFLINE_ASSET_STATUSES = ["Active", "In Storage", "Under Repair", "Disposed"];

function text(value: unknown, fallback = "-") {
  const clean = String(value ?? "").trim();
  return clean || fallback;
}

// The QR code on an offline asset encodes a URL to the web app's public,
// no-login lookup page (.../offline-asset-lookup?id=X) — see
// buildOfflineAssetQrValue in the web app's OfflineDevice.tsx — not the raw
// id by itself. Falls back to treating the scanned value as a bare numeric
// id in case a QR ever encodes just that.
export function parseOfflineAssetId(scannedValue: string): string {
  const raw = String(scannedValue || "").trim();
  if (!raw) return "";

  try {
    const url = new URL(raw);
    const id = url.searchParams.get("id");
    if (id && id.trim()) return id.trim();
  } catch (_) {
    // Not a URL — fall through to treating the raw value as the id.
  }

  return /^\d+$/.test(raw) ? raw : "";
}

// Used only to prefill the Create Ticket form's Device Type/Asset Lookup
// section after a QR scan (see ScanAssetScreen -> CreateTicketScreen) — the
// ticket itself is always submitted through POST /api/mobile/tickets, same
// as a manually-created ticket.
export async function fetchOfflineAsset(id: string): Promise<OfflineAssetDetail> {
  const response: any = await apiRequest(`/api/mobile/offline-assets/${encodeURIComponent(id)}`);
  const data = response?.data || {};

  return {
    id: text(data.id, id),
    assetTag: text(data.assetTag),
    name: text(data.name, "Unknown Device"),
    type: text(data.type, "Other"),
    manufacturer: text(data.manufacturer),
    model: text(data.model),
    os: text(data.os, ""),
    branch: text(data.branch),
    department: text(data.department),
    status: text(data.status, "Active"),
  };
}

// Backs the Offline Asset Inventory screen — same endpoint the web console
// and the Create Ticket form's Asset Lookup (assetLookupService.ts) already
// use; no new backend route needed. No server-side search/pagination on
// this endpoint (small dataset by nature — manually catalogued devices),
// so the list/filter/paginate all happen client-side, same as the web page.
export async function fetchOfflineAssetInventory(): Promise<OfflineAssetListItem[]> {
  const response: any = await apiRequest("/api/offline-assets");
  const rows = Array.isArray(response?.data) ? response.data : [];

  return rows.map((row: any, index: number) => ({
    id: text(row.id, `offline-${index + 1}`),
    assetTag: text(row.assetTag),
    name: text(row.name, "Unknown Device"),
    type: text(row.type, "Other"),
    manufacturer: text(row.manufacturer),
    model: text(row.model),
    os: text(row.os, ""),
    branch: text(row.branch),
    department: text(row.department),
    status: text(row.status, "Active"),
    serialNumber: text(row.serialNumber, ""),
    osVersion: text(row.osVersion, ""),
    macAddress: text(row.macAddress, ""),
    ipAddress: text(row.ipAddress, ""),
    owner: text(row.owner, ""),
    condition: text(row.condition, ""),
    purchaseDate: text(row.purchaseDate, ""),
    warrantyExpiry: text(row.warrantyExpiry, ""),
    createdAt: text(row.createdAt, ""),
  }));
}
