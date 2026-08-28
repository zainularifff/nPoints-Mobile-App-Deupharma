import { apiRequest } from "./apiClient";

// Backs the Create Ticket form's "Asset Lookup" field — mirrors the web
// console's Service Desk form, which searches two separate sources and
// merges them into one dropdown: Hardware Inventory (managed/monitored
// endpoints) and Offline Assets (unmanaged devices logged manually or via
// QR — see offlineAssetService.ts). Same two backend endpoints the web page
// uses (/api/hardware-inventory/assets, /api/offline-assets); no new
// mobile-only route needed for either.
export type AssetLookupResult = {
  id: string;
  label: string;
  deviceType: string;
  brand: string;
  model: string;
  os: string;
  meta: string;
  isOfflineAsset: boolean;
};

function text(value: unknown, fallback = "") {
  const clean = String(value ?? "").trim();
  return clean || fallback;
}

function getRows(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.rows)) return payload.rows;
  return [];
}

function normalizeHardwareAsset(row: any, index: number): AssetLookupResult {
  const label = text(
    row?.Object_DeviceID || row?.DeviceID || row?.ComputerName || row?.DeviceName || row?.assetTag,
    `device-${index + 1}`
  );

  return {
    id: `hw-${row?._Idn ?? row?.id ?? label}`,
    label,
    deviceType: text(row?.deviceType || row?.DeviceType, ""),
    brand: text(row?.brand || row?.Brand || row?.manufacturer || row?.Manufacturer, ""),
    model: text(row?.Model || row?.DeviceModelName || row?.model, ""),
    os: text(row?.PlatformType || row?.OS || row?.os, ""),
    meta: [text(row?.Object_Full_Name || row?.Object_Rel_Name, ""), text(row?.Model || row?.DeviceModelName, "")]
      .filter(Boolean)
      .join(" • "),
    isOfflineAsset: false,
  };
}

function normalizeOfflineAsset(row: any): AssetLookupResult {
  return {
    id: `offline-${row.id}`,
    label: text(row.assetTag, row.name || row.id),
    deviceType: text(row.type, "Other"),
    brand: text(row.manufacturer, ""),
    model: text(row.model, ""),
    os: text(row.os, ""),
    meta: [text(row.name, ""), text(row.model, "")].filter(Boolean).join(" • "),
    isOfflineAsset: true,
  };
}

function searchText(asset: AssetLookupResult) {
  return [asset.label, asset.brand, asset.model, asset.os, asset.deviceType, asset.meta]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

// Server-side search (Hardware Inventory has no "list everything" mode
// worth pulling to a mobile client — it's the same fleet ActiveDeviceList
// already paginates). Only fires once the keyword is meaningful.
export async function searchHardwareAssets(keyword: string): Promise<AssetLookupResult[]> {
  const term = keyword.trim();
  if (term.length < 2) return [];

  const response: any = await apiRequest(
    `/api/hardware-inventory/assets?search=${encodeURIComponent(term)}&limit=25`
  );
  return getRows(response).map(normalizeHardwareAsset);
}

// Offline Assets has no server-side search param — the web page pulls the
// whole list once and filters client-side, same approach here. Call once
// per form session (e.g. on mount) and keep the result to filter locally
// as the user types, rather than refetching per keystroke.
export async function fetchOfflineAssetsForLookup(): Promise<AssetLookupResult[]> {
  const response: any = await apiRequest("/api/offline-assets");
  return getRows(response).map(normalizeOfflineAsset);
}

export function filterAssetLookupResults(assets: AssetLookupResult[], keyword: string): AssetLookupResult[] {
  const term = keyword.trim().toLowerCase();
  if (!term) return assets;
  return assets.filter((asset) => searchText(asset).includes(term));
}
