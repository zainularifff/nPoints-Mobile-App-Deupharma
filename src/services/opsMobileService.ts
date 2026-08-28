import type { DashboardSummary } from "../types/dashboard";
import type { StatusTone } from "../theme/colors";
import { apiRequest } from "./apiClient";

export type MobileWorkItem = {
  id: string;
  type: "endpoint" | "ticket" | "remote" | "software" | "asset";
  title: string;
  source: string;
  site: string;
  priority: "Low" | "Medium" | "High";
  status: string;
  due: string;
  updated: string;
  owner: string;
  reason: string;
  action: string;
};

export type MobilePatchDepartment = {
  name: string;
  percent: number;
};

export type MobilePatchMissingDevice = {
  id: string;
  deviceName: string;
  department: string;
  applicablePatches: number;
  installedPatches: number;
  missingPatchCount: number;
  percent: number;
  lastScanTime: string;
};

export type PatchDeviceListOptions = FetchOptions & {
  onlyMissing?: boolean;
  department?: string;
};

export type MobileRiskBreakdownRow = {
  name: string;
  value: number;
  percent: number;
  tone: StatusTone;
};

export type MobileRiskSummary = {
  totalCritical: number;
  totalHigh: number;
  totalMedium: number;
  unsupportedOsDevices: number;
  outdatedOsDevices: number;
  severityBreakdown: MobileRiskBreakdownRow[];
  categoryBreakdown: MobileRiskBreakdownRow[];
};

export type MobileRiskDevice = {
  id: string;
  deviceName: string;
  platform: string;
  model: string;
  department: string;
  lastSeen: string;
  riskScore: number;
  severity: string;
  reasons: string;
};

export type MobileAgingDevice = {
  id: string;
  deviceName: string;
  model: string;
  platform: string;
  department: string;
  status: string;
  lastSeen: string;
  ageYears: number;
};

export type MobileDeviceAgingSummary = {
  totalDevices: number;
  agingDevices: number;
  monitorDevices: number;
  healthyDevices: number;
  unknownAgeDevices: number;
  agingMinYears: number;
  devices: MobileAgingDevice[];
};

export type MobileSoftwareBreakdownRow = {
  name: string;
  value: number;
  percent: number;
};

export type MobileSoftwareLifecycleItem = {
  name: string;
  vendor: string;
  installs: number;
  uniqueTitles: number;
  lifecycleStatus: string;
  supportStatus: string;
  eolDate: string;
  eosDate: string;
};

export type MobileSoftwareSummary = {
  totalInstallations: number;
  uniqueSoftware: number;
  devicesWithSoftware: number;
  unclassifiedSoftware: number;
  latestScan: string;
  topCategories: MobileSoftwareBreakdownRow[];
  classificationBreakdown: MobileSoftwareBreakdownRow[];
  lifecycleWatch: MobileSoftwareLifecycleItem[];
  businessSoftware: number;
  remoteControlSoftware: number;
  antivirusSoftware: number;
  browserSoftware: number;
  gamingSoftware: number;
  eolApplications: number;
  eosApplications: number;
  unsupportedApplications: number;
};

export type MobileTicketAlertSeverity = "Critical" | "High" | "Medium" | "Low";
export type MobileTicketAlertTone = "green" | "red" | "amber" | "blue" | "neutral";

export type MobileTicketAlert = {
  id: string;
  severity: MobileTicketAlertSeverity;
  title: string;
  system: string;
  owner: string;
  status: string;
  tone: MobileTicketAlertTone;
};

export type MobileTicketBucket = "critical" | "pending" | "progress";

// Single source of truth for classifying an open ticket into a bucket —
// every screen that shows a per-bucket count or list must call this so the
// numbers can never drift apart between screens.
export function classifyTicketAlert(alert: MobileTicketAlert): MobileTicketBucket {
  const status = alert.status.toLowerCase();

  if (alert.severity === "Critical" || alert.tone === "red") return "critical";
  if (alert.tone === "blue" || status.includes("progress") || status.includes("investigat")) return "progress";
  return "pending";
}

export type MobileReportItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  type?: string;
  source?: string;
  outputs?: string[];
  status?: string;
  tone?: "red" | "amber" | "blue" | "green" | "purple";
  pages?: number;
  frequency?: string;
  lastGenerated?: string;
};

export type MobileEndpointSnapshot = {
  total: number;
  online: number;
  offline: number;
  stale: number;
};

export type MobileTicketSnapshot = {
  total: number;
  open: number;
  closed: number;
  slaExceeded: number;
  slaAchievement: number;
};

export type MobileDeviceLocation = {
  id: string;
  deviceId: string;
  deviceName: string;
  username: string;
  model: string;
  address: string;
  latitude: string;
  longitude: string;
  time: string;
  rawTime: string;
};

export type MobileEndpointDevice = {
  id: string;
  deviceId: string;
  deviceName: string;
  branch: string;
  status: "Online" | "Offline" | "Unknown";
  isOnline: boolean;
  isStale: boolean;
  lastSeen: string;
  rawLastSeen: string;
  model: string;
  platform: string;
  ipAddress: string;
  source: string;
};

export type EndpointDeviceStatusFilter = "all" | "online" | "offline" | "stale";

export type MobileGeolocationDevice = MobileEndpointDevice & {
  hasLocation: boolean;
  hasAnyLocation: boolean;
  isStaleLocation: boolean;
  latestLocation: MobileDeviceLocation | null;
  locationCount: number;
};

export type MobileGeolocationSummary = {
  generatedAt: string;
  totalDevices: number;
  detectedCount: number;
  notDetectedCount: number;
  detectedDevices: MobileGeolocationDevice[];
  notDetectedDevices: MobileGeolocationDevice[];
};

export type GeolocationDeviceFilter = "detected" | "notDetected";

export type MobilePatchSnapshot = {
  complianceRate: number;
  scannedDevices: number;
  missingPatches: number;
  missingPatchDevices: number;
  criticalVulnerabilities: number;
  lastScanTime: string;
};

export type MobileOpsSnapshot = {
  generatedAt: string;
  rangeLabel: string;
  endpoints: MobileEndpointSnapshot;
  tickets: MobileTicketSnapshot;
  patch: MobilePatchSnapshot;
  latestReport: MobileReportItem | null;
  locations: MobileDeviceLocation[];
  locationTotal: number;
};

type FetchOptions = {
  force?: boolean;
};

type WorklistFetchOptions = FetchOptions & {
  limit?: number;
};

type EndpointDeviceFetchOptions = FetchOptions & {
  limit?: number;
  status?: EndpointDeviceStatusFilter;
};

type GeolocationFetchOptions = FetchOptions & {
  endpointLimit?: number;
  locationLimit?: number;
};

type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const SNAPSHOT_CACHE_KEY = "mobile-ops-snapshot";
// Lean, mobile-only endpoint (/api/mobile/dashboard/overview) — replaces the
// old shared pull from the web's all-in-one /api/dashboard/it-operations.
const OVERVIEW_CACHE_KEY = "mobile-dashboard-overview";
const OVERVIEW_CACHE_TTL_MS = 20 * 1000;
const GEO_SUMMARY_TOTALS_CACHE_KEY = "mobile-dashboard-geo-summary";
const GEO_SUMMARY_TOTALS_CACHE_TTL_MS = 45 * 1000;
const SUMMARY_CACHE_KEY = "operations-summary";
const TICKET_ALERTS_CACHE_KEY = "ticket-active-alerts";
const TICKET_ALERTS_CACHE_TTL_MS = 45 * 1000;
const PATCH_DEPARTMENTS_CACHE_KEY = "patch-departments";
const PATCH_DEPARTMENTS_CACHE_TTL_MS = 60 * 1000;
const PATCH_MISSING_DEVICES_CACHE_KEY = "patch-missing-devices";
const PATCH_MISSING_DEVICES_CACHE_TTL_MS = 60 * 1000;
const RISK_SUMMARY_CACHE_KEY = "risk-summary";
const RISK_SUMMARY_CACHE_TTL_MS = 60 * 1000;
const DEVICE_AGING_CACHE_KEY = "device-aging-summary";
const DEVICE_AGING_CACHE_TTL_MS = 60 * 1000;
const SOFTWARE_SUMMARY_CACHE_KEY = "software-summary";
const SOFTWARE_SUMMARY_CACHE_TTL_MS = 60 * 1000;
const REPORTS_CACHE_KEY = "report-catalog";
const GEOLOCATION_SUMMARY_CACHE_KEY = "mobile-geolocation-summary";
const SUMMARY_CACHE_TTL_MS = 60 * 1000;
const SNAPSHOT_CACHE_TTL_MS = 45 * 1000;
const WORKLIST_CACHE_TTL_MS = 30 * 1000;
const REPORTS_CACHE_TTL_MS = 5 * 60 * 1000;
const ENDPOINT_DEVICES_CACHE_TTL_MS = 45 * 1000;
const GEOLOCATION_CACHE_TTL_MS = 45 * 1000;
const DEFAULT_WORKLIST_LIMIT = 25;
const DEFAULT_ENDPOINT_DEVICE_LIMIT = 300;
const GEOLOCATION_REQUEST_LIMIT = 1000;
const GEOLOCATION_DISPLAY_LIMIT = 30;
const DEVICE_LOCATION_HISTORY_LIMIT = 10;
const STALE_THRESHOLD_MS = 7 * 24 * 60 * 60 * 1000;

const liveDataCache = new Map<string, CacheEntry<unknown>>();
const liveDataInFlight = new Map<string, Promise<unknown>>();

function worklistCacheKey(limit: number) {
  return `worklist-${limit}`;
}

function endpointDeviceCacheKey(limit: number) {
  return `endpoint-devices-${limit}`;
}

function geolocationSummaryCacheKey(endpointLimit: number, locationLimit: number) {
  return `${GEOLOCATION_SUMMARY_CACHE_KEY}-${endpointLimit}-${locationLimit}`;
}

function locationHistoryCacheKey(deviceKey: string, locationLimit: number) {
  return `location-history-${deviceKey}-${locationLimit}`;
}

function clampWorklistLimit(value?: number) {
  const parsed = Number(value || DEFAULT_WORKLIST_LIMIT);
  if (!Number.isFinite(parsed)) return DEFAULT_WORKLIST_LIMIT;
  return Math.max(1, Math.min(Math.round(parsed), 100));
}

function clampEndpointDeviceLimit(value?: number) {
  const parsed = Number(value || DEFAULT_ENDPOINT_DEVICE_LIMIT);
  if (!Number.isFinite(parsed)) return DEFAULT_ENDPOINT_DEVICE_LIMIT;
  // Was capped at 1000 — undercounted real fleets already past that size
  // (e.g. a 1,018-device tenant silently showed 1000/truncated "500" from
  // the screen's own lower request limit on top of this). Backend itself
  // supports up to 50000 (see getAllHardwareInventoryAssets), so 5000 here
  // is a mobile-side safety ceiling, not a real-world constraint.
  return Math.max(1, Math.min(Math.round(parsed), 5000));
}

function clampGeolocationLimit(value?: number) {
  const parsed = Number(value || GEOLOCATION_REQUEST_LIMIT);
  if (!Number.isFinite(parsed)) return GEOLOCATION_REQUEST_LIMIT;
  return Math.max(1, Math.min(Math.round(parsed), 3000));
}

function getCachedValue<T>(key: string): T | null {
  const cached = liveDataCache.get(key) as CacheEntry<T> | undefined;
  if (!cached) return null;

  if (Date.now() > cached.expiresAt) {
    liveDataCache.delete(key);
    return null;
  }

  return cached.value;
}

function setCachedValue<T>(key: string, value: T, ttlMs: number) {
  liveDataCache.set(key, {
    expiresAt: Date.now() + ttlMs,
    value,
  });
}

async function fetchWithCache<T>(
  key: string,
  ttlMs: number,
  requestFactory: () => Promise<T>,
  options: FetchOptions = {}
): Promise<T> {
  if (!options.force) {
    const cached = getCachedValue<T>(key);
    if (cached !== null) return cached;
  }

  const activeRequest = liveDataInFlight.get(key) as Promise<T> | undefined;
  if (activeRequest) return activeRequest;

  const request = requestFactory()
    .then((value) => {
      setCachedValue(key, value, ttlMs);
      return value;
    })
    .finally(() => {
      if (liveDataInFlight.get(key) === request) {
        liveDataInFlight.delete(key);
      }
    });

  liveDataInFlight.set(key, request);
  return request;
}

export function clearOpsMobileCache(prefix?: string) {
  if (!prefix) {
    liveDataCache.clear();
    liveDataInFlight.clear();
    return;
  }

  for (const key of liveDataCache.keys()) {
    if (key.startsWith(prefix)) liveDataCache.delete(key);
  }

  for (const key of liveDataInFlight.keys()) {
    if (key.startsWith(prefix)) liveDataInFlight.delete(key);
  }
}

export function getCachedMobileOpsSnapshot() {
  return getCachedValue<MobileOpsSnapshot>(SNAPSHOT_CACHE_KEY);
}

export function getCachedOperationsSummary() {
  return getCachedValue<DashboardSummary>(SUMMARY_CACHE_KEY);
}

export function getCachedWorklistItems(limit = DEFAULT_WORKLIST_LIMIT) {
  return getCachedValue<MobileWorkItem[]>(worklistCacheKey(clampWorklistLimit(limit)));
}

export function getCachedEndpointDevices(limit = DEFAULT_ENDPOINT_DEVICE_LIMIT) {
  return getCachedValue<MobileEndpointDevice[]>(endpointDeviceCacheKey(clampEndpointDeviceLimit(limit)));
}

export function getCachedReportCatalog() {
  return getCachedValue<MobileReportItem[]>(REPORTS_CACHE_KEY);
}

export function getCachedGeolocationSummary(endpointLimit = DEFAULT_ENDPOINT_DEVICE_LIMIT, locationLimit = GEOLOCATION_REQUEST_LIMIT) {
  return getCachedValue<MobileGeolocationSummary>(geolocationSummaryCacheKey(clampEndpointDeviceLimit(endpointLimit), clampGeolocationLimit(locationLimit)));
}

function cleanText(value: unknown, fallback = "-") {
  const text = String(value ?? "").trim();
  if (!text || text.toLowerCase() === "null" || text.toLowerCase() === "undefined") return fallback;
  return text;
}

function asNumber(value: unknown, fallback = 0) {
  if (typeof value === "number") return Number.isFinite(value) ? value : fallback;

  const parsed = Number(String(value ?? "").replace(/[^0-9.-]/g, ""));
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeKeyPart(value: unknown, fallback = "item") {
  return cleanText(value, fallback)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function uniqueKey(baseValue: unknown, index: number, fallback = "item") {
  const base = normalizeKeyPart(baseValue, `${fallback}-${index + 1}`);
  return `${base || fallback}-${index + 1}`;
}

function hiddenKeySuffix(index: number) {
  return "\u200B".repeat((index % 20) + 1);
}

function readPatchSnapshot(data: any = {}): MobilePatchSnapshot {
  // Per-patch-record numbers (installed vs applicable), scoped to devices
  // that have actually been scanned — there is no per-device "fully
  // patched y/n" rollup available from this endpoint (the web app's
  // "Scan Coverage by Branch" view is a separate, more detailed report).
  const patch = data?.patchSummary || {};

  return {
    complianceRate: asNumber(patch.complianceRate, 0),
    scannedDevices: asNumber(patch.scannedDevices, 0),
    missingPatches: asNumber(patch.missingPatches, 0),
    // Distinct devices with >=1 missing patch — same "Need Patching"
    // definition the web Dashboard uses, unlike missingPatches above (a
    // per-patch-record count that can disagree with this one).
    missingPatchDevices: asNumber(patch.missingPatchDevices, 0),
    criticalVulnerabilities: asNumber(patch.criticalVulnerabilities, 0),
    lastScanTime: cleanText(patch.lastScanTime, "-"),
  };
}

function formatDateTime(value: unknown) {
  const raw = cleanText(value, "");
  if (!raw) return "-";

  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return raw;

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getDateSortValue(value: unknown) {
  const raw = cleanText(value, "");
  if (!raw) return 0;

  const date = new Date(raw);
  const time = date.getTime();
  return Number.isNaN(time) ? 0 : time;
}

function isStaleTimestamp(value: unknown) {
  const time = getDateSortValue(value);
  if (!time) return false;
  return Date.now() - time > STALE_THRESHOLD_MS;
}

function getRows(payload: any): any[] {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.records)) return payload.records;
  if (Array.isArray(payload?.rows)) return payload.rows;
  if (Array.isArray(payload?.data?.rows)) return payload.data.rows;
  if (Array.isArray(payload?.data?.records)) return payload.data.records;
  return [];
}

function pickLatestReport(reports: MobileReportItem[]) {
  if (!reports.length) return null;

  return [...reports].sort((a, b) => {
    return getDateSortValue(b.lastGenerated) - getDateSortValue(a.lastGenerated);
  })[0];
}

function getLocationDeviceKey(row: any, index: number) {
  return cleanText(
    row?.DeviceID ||
      row?.deviceID ||
      row?.DeviceId ||
      row?.Object_DeviceID ||
      row?.ComputerName ||
      row?.DeviceName ||
      row?.Object_Client_Name ||
      row?.HostName ||
      row?.SerialNumber,
    `device-${index + 1}`
  );
}

function getLocationRawTime(row: any) {
  return cleanText(
    row?.Time ||
      row?.DateTime ||
      row?.LastSeenAt ||
      row?.UpdatedAt ||
      row?.DeviceTimeStamp ||
      row?.CreatedAt,
    ""
  );
}

function mapDeviceLocation(row: any, index: number): MobileDeviceLocation {
  const deviceId = getLocationDeviceKey(row, index);
  const rawTime = getLocationRawTime(row);

  return {
    id: uniqueKey(`${deviceId}-${rawTime}`, index, "location"),
    deviceId,
    deviceName: cleanText(row?.DeviceName || row?.ComputerName || row?.Object_Client_Name || row?.HostName, deviceId),
    username: cleanText(row?.LastLoggedInUser || row?.Username || row?.UserName || row?.UserID),
    model: cleanText(row?.DeviceModelName || row?.Model || row?.PlatformType),
    address: cleanText(row?.LocationName || row?.Address || row?.FormattedAddress || row?.City || row?.Object_Full_Name),
    latitude: cleanText(row?.Latitude || row?.latitude || row?.Lat),
    longitude: cleanText(row?.Longitude || row?.longitude || row?.Lng || row?.Long),
    time: formatDateTime(rawTime),
    rawTime,
  };
}

function mapLatestDeviceLocations(rows: any[], displayLimit = GEOLOCATION_DISPLAY_LIMIT): { locations: MobileDeviceLocation[]; total: number } {
  const latestByDevice = new Map<string, { row: any; index: number; time: number }>();

  rows.forEach((row, index) => {
    const key = normalizeKeyPart(getLocationDeviceKey(row, index), `device-${index + 1}`);
    const time = getDateSortValue(getLocationRawTime(row));
    const current = latestByDevice.get(key);

    if (!current || time >= current.time) {
      latestByDevice.set(key, { row, index, time });
    }
  });

  // Same "detected" definition as mapGeolocationSummary/the backend's
  // trackedDevices field — a location record older than 7 days doesn't
  // tell us where the device is *now*, so it doesn't count. Without this
  // filter, this total would silently disagree with the Geolocation
  // screen's "Detected" count.
  const locations = Array.from(latestByDevice.values())
    .filter((item) => item.time && Date.now() - item.time <= STALE_THRESHOLD_MS)
    .sort((a, b) => b.time - a.time)
    .map((item, index) => mapDeviceLocation(item.row, index));

  return {
    locations: locations.slice(0, displayLimit),
    total: locations.length,
  };
}

function isOnlineStatus(value: unknown) {
  const text = cleanText(value, "").toLowerCase();
  return text === "1" || text === "online" || text === "true" || text === "connected";
}

function getEndpointDeviceId(row: any, index: number) {
  return cleanText(
    row?._Idn || row?.id || row?.assetId || row?.Object_DeviceID || row?.DeviceID || row?.ComputerName || row?.DeviceName,
    `endpoint-${index + 1}`
  );
}

function getEndpointDeviceName(row: any, fallback: string) {
  return cleanText(row?.ComputerName || row?.DeviceName || row?.Object_DeviceID || row?.DeviceID || row?.name || row?.assetTag, fallback);
}

function getEndpointRawLastSeen(row: any) {
  return cleanText(row?.ConnectionTime || row?.DeviceTimeStamp || row?.LastSeenAt || row?.UpdatedAt || row?.CreatedAt, "");
}

function mapEndpointDevice(row: any, index: number): MobileEndpointDevice {
  const deviceId = getEndpointDeviceId(row, index);
  const rawLastSeen = getEndpointRawLastSeen(row);
  const isOnline = isOnlineStatus(row?.ConnectionStatus || row?.status || row?.StatusLabel);
  const isStale = isStaleTimestamp(rawLastSeen);

  return {
    id: uniqueKey(`${row?.Object_Agent || row?.source || "endpoint"}-${deviceId}`, index, "endpoint"),
    deviceId,
    deviceName: getEndpointDeviceName(row, deviceId),
    branch: cleanText(row?.Object_Full_Name || row?.Object_Rel_Name || row?.department || row?.requesterName),
    status: isOnline ? "Online" : cleanText(row?.ConnectionStatus || row?.status || row?.StatusLabel, "Unknown") === "Unknown" ? "Unknown" : "Offline",
    isOnline,
    isStale,
    lastSeen: formatDateTime(rawLastSeen),
    rawLastSeen,
    model: cleanText(row?.Model || row?.DeviceModelName || row?.model),
    platform: cleanText(row?.PlatformType || row?.OS || row?.os || row?.deviceType),
    ipAddress: cleanText(row?.IP || row?.ipAddress || row?.DeviceIPAddress || row?.DeviceLocalIPAddress),
    source: cleanText(row?.Object_Agent || row?.source),
  };
}

function filterEndpointDevices(devices: MobileEndpointDevice[], status: EndpointDeviceStatusFilter) {
  if (status === "online") return devices.filter((item) => item.isOnline);
  if (status === "offline") return devices.filter((item) => !item.isOnline);
  if (status === "stale") return devices.filter((item) => item.isStale);
  return devices;
}

function getEndpointMatchKeys(device: MobileEndpointDevice) {
  return [
    device.deviceId,
    device.deviceName,
    device.id,
  ]
    .map((value) => normalizeKeyPart(value, ""))
    .filter(Boolean);
}

function getLocationMatchKeys(location: MobileDeviceLocation) {
  return [
    location.deviceId,
    location.deviceName,
  ]
    .map((value) => normalizeKeyPart(value, ""))
    .filter(Boolean);
}

function locationMatchesDevice(location: MobileDeviceLocation, device: MobileEndpointDevice) {
  const endpointKeys = new Set(getEndpointMatchKeys(device));
  return getLocationMatchKeys(location).some((key) => endpointKeys.has(key));
}

function mapGeolocationSummary(devices: MobileEndpointDevice[], locationRows: any[]): MobileGeolocationSummary {
  const allLocations = locationRows
    .map((row, index) => mapDeviceLocation(row, index))
    .sort((a, b) => getDateSortValue(b.rawTime) - getDateSortValue(a.rawTime));

  const historyByDeviceKey = new Map<string, MobileDeviceLocation[]>();
  allLocations.forEach((location) => {
    getLocationMatchKeys(location).forEach((key) => {
      if (!historyByDeviceKey.has(key)) historyByDeviceKey.set(key, []);
      historyByDeviceKey.get(key)?.push(location);
    });
  });

  const mappedDevices = devices.map((device) => {
    const keys = getEndpointMatchKeys(device);
    const seenLocationIds = new Set<string>();
    const deviceLocations: MobileDeviceLocation[] = [];

    keys.forEach((key) => {
      const rows = historyByDeviceKey.get(key) || [];
      rows.forEach((row) => {
        if (!seenLocationIds.has(row.id)) {
          seenLocationIds.add(row.id);
          deviceLocations.push(row);
        }
      });
    });

    deviceLocations.sort((a, b) => getDateSortValue(b.rawTime) - getDateSortValue(a.rawTime));

    const latestLocation = deviceLocations[0] || null;
    // "Detected" = device reported a GPS position within the last 7 days —
    // matches the backend's own trackedDevices/staleLocations split (see
    // getItOpsGeoSummary: status "Tracked" = ≤7 days, "Stale" = >7 days,
    // tracked from stale as SEPARATE, non-overlapping buckets). A device
    // with only an old position on file is "Not Detected" here, same as
    // one with none — neither tells us where it is *now*.
    const hasAnyLocation = deviceLocations.length > 0;
    const isStaleLocation = hasAnyLocation && isStaleTimestamp(latestLocation!.rawTime);
    const hasRecentLocation = hasAnyLocation && !isStaleLocation;

    return {
      ...device,
      hasLocation: hasRecentLocation,
      hasAnyLocation,
      isStaleLocation,
      latestLocation,
      locationCount: deviceLocations.length,
    };
  });

  return {
    generatedAt: formatDateTime(new Date().toISOString()),
    totalDevices: mappedDevices.length,
    detectedCount: mappedDevices.filter((item) => item.hasLocation).length,
    notDetectedCount: mappedDevices.filter((item) => !item.hasLocation).length,
    detectedDevices: mappedDevices.filter((item) => item.hasLocation),
    notDetectedDevices: mappedDevices.filter((item) => !item.hasLocation),
  };
}

function mapTaskType(task: any): MobileWorkItem["type"] {
  const value = `${task?.classification || ""} ${task?.taskType || ""} ${task?.commandType || ""} ${task?.description || ""}`.toLowerCase();

  if (value.includes("software") || value.includes("package")) return "software";
  if (value.includes("remote") || value.includes("control")) return "remote";
  if (value.includes("asset") || value.includes("hardware")) return "asset";
  if (value.includes("ticket") || value.includes("incident")) return "ticket";
  return "endpoint";
}

function mapTaskPriority(task: any): MobileWorkItem["priority"] {
  const status = String(task?.state || "").toLowerCase();

  if (status.includes("fail") || status.includes("cancel") || status.includes("stop")) {
    return "High";
  }

  if (status.includes("run") || status.includes("progress") || status.includes("pending")) {
    return "Medium";
  }

  return "Low";
}

// Backs Overview/Alerts/Reports/PatchCompliance's snapshot, which can all
// mount within the same burst — cache the payload briefly so they share
// one network round trip. Hits the lean mobile-only
// /api/mobile/dashboard/overview endpoint (hardware + serviceDesk + patch
// numbers, 3 backend queries) instead of the web's all-in-one
// /api/dashboard/it-operations (8 queries, plus software/network/risk/
// department data the mobile app never reads).
async function requestMobileOverview(options: FetchOptions = {}): Promise<any> {
  return fetchWithCache(
    OVERVIEW_CACHE_KEY,
    OVERVIEW_CACHE_TTL_MS,
    async () => {
      const response: any = await apiRequest("/api/mobile/dashboard/overview");
      return response?.data || response || {};
    },
    options
  );
}

// Lean geolocation headline counts (/api/mobile/dashboard/geo-summary) —
// just totalDevices/trackedDevices/staleLocations, used to seed the
// Geolocation screens' "Detected" totals without pulling anything else.
async function requestGeoSummaryTotals(
  options: FetchOptions = {}
): Promise<{ totalDevices: number; trackedDevices: number; staleLocations: number }> {
  return fetchWithCache(
    GEO_SUMMARY_TOTALS_CACHE_KEY,
    GEO_SUMMARY_TOTALS_CACHE_TTL_MS,
    async () => {
      const response: any = await apiRequest("/api/mobile/dashboard/geo-summary");
      const data = response?.data || response || {};
      return {
        totalDevices: asNumber(data.totalDevices, 0),
        trackedDevices: asNumber(data.trackedDevices, 0),
        staleLocations: asNumber(data.staleLocations, 0),
      };
    },
    options
  );
}

// Not consumed by any screen directly today (kept for API stability) — a
// composed view over the same lean mobile endpoints the screens use, not
// the old shared mega-dashboard call.
async function requestOperationsSummary(options: FetchOptions = {}): Promise<DashboardSummary> {
  const [overview, riskResult, geo] = await Promise.all([
    requestMobileOverview(options),
    fetchRiskSummary(options),
    requestGeoSummaryTotals(options),
  ]);

  const totalEndpoints = asNumber(overview?.hardware?.totalDevices, 0);
  const activeDevices = asNumber(overview?.hardware?.onlineDevices, 0);

  return {
    totalEndpoints,
    activeDevices,
    offlineDevices: asNumber(
      overview?.hardware?.offlineDevices,
      Math.max(totalEndpoints - activeDevices, 0)
    ),
    openTickets: asNumber(overview?.serviceDesk?.pendingTickets, 0),
    highRiskExceptions: asNumber(riskResult?.summary?.totalCritical, 0),
    // Same fields the web Dashboard's geolocation widget uses — devices
    // with ANY known GPS position (including stale) and the stale subset
    // of those. Trustworthy server-side counts, unlike the mobile-side
    // device/location key matching below.
    trackedDevices: asNumber(geo?.trackedDevices, 0),
    staleLocations: asNumber(geo?.staleLocations, 0),
  };
}

export async function fetchOperationsSummary(
  options: FetchOptions = {}
): Promise<DashboardSummary> {
  return fetchWithCache(
    SUMMARY_CACHE_KEY,
    SUMMARY_CACHE_TTL_MS,
    () => requestOperationsSummary(options),
    options
  );
}

const ALERT_TONE_MAP: Record<string, MobileTicketAlertTone> = {
  success: "green",
  info: "blue",
  danger: "red",
  warning: "amber",
  neutral: "neutral",
};

function mapTicketAlertTone(value: unknown): MobileTicketAlertTone {
  return ALERT_TONE_MAP[String(value || "").toLowerCase()] || "neutral";
}

function mapTicketAlertSeverity(value: unknown): MobileTicketAlertSeverity {
  const text = String(value || "").toLowerCase();
  if (text === "critical") return "Critical";
  if (text === "high") return "High";
  if (text === "low") return "Low";
  return "Medium";
}

async function requestTicketAlerts(options: FetchOptions = {}): Promise<MobileTicketAlert[]> {
  const response: any = await apiRequest("/api/mobile/dashboard/tickets");
  const data = response?.data || response || {};
  const rows = Array.isArray(data?.activeAlerts) ? data.activeAlerts : [];

  return rows.map((row: any, index: number) => ({
    id: uniqueKey(`${row?.system}-${row?.alert}`, index, "ticket"),
    severity: mapTicketAlertSeverity(row?.severity),
    title: cleanText(row?.alert, "Service desk ticket requires attention"),
    system: cleanText(row?.system),
    owner: cleanText(row?.owner, "Unassigned"),
    status: cleanText(row?.status, "Open"),
    tone: mapTicketAlertTone(row?.tone),
  }));
}

// Live open service desk tickets, sourced from the same dashboard endpoint
// used elsewhere. There is no per-ticket timestamp or resolved-ticket list
// available from the backend yet, so callers must not assume either exists.
export async function fetchTicketAlerts(
  options: FetchOptions = {}
): Promise<MobileTicketAlert[]> {
  return fetchWithCache(
    TICKET_ALERTS_CACHE_KEY,
    TICKET_ALERTS_CACHE_TTL_MS,
    () => requestTicketAlerts(options),
    options
  );
}

async function requestPatchDepartments(options: FetchOptions = {}): Promise<MobilePatchDepartment[]> {
  const response: any = await apiRequest("/api/mobile/dashboard/patch");
  const data = response?.data || response || {};
  const rows = Array.isArray(data?.patchDepartments) ? data.patchDepartments : [];

  return rows
    .map((row: any) => ({
      name: cleanText(row?.name, "Unassigned"),
      percent: asNumber(row?.percent, 0),
    }))
    .sort((a: MobilePatchDepartment, b: MobilePatchDepartment) => a.percent - b.percent);
}

// Real department-level patch compliance breakdown, sourced from the same
// dashboard endpoint. Sorted worst-first so departments needing attention
// surface at the top.
export async function fetchPatchDepartments(
  options: FetchOptions = {}
): Promise<MobilePatchDepartment[]> {
  return fetchWithCache(
    PATCH_DEPARTMENTS_CACHE_KEY,
    PATCH_DEPARTMENTS_CACHE_TTL_MS,
    () => requestPatchDepartments(options),
    options
  );
}

function mapPatchMissingDevice(row: any, index: number): MobilePatchMissingDevice {
  return {
    id: uniqueKey(`${row?.deviceId}-${row?.deviceName}`, index, "patch-device"),
    deviceName: cleanText(row?.deviceName, "Unknown device"),
    department: cleanText(row?.department, "Unassigned"),
    applicablePatches: asNumber(row?.applicablePatches, 0),
    installedPatches: asNumber(row?.installedPatches, 0),
    missingPatchCount: asNumber(row?.missingPatchCount, 0),
    percent: asNumber(row?.percent, 0),
    lastScanTime: cleanText(row?.lastScanTime, "-"),
  };
}

async function requestPatchDeviceList(
  options: PatchDeviceListOptions = {}
): Promise<MobilePatchMissingDevice[]> {
  const params = new URLSearchParams();
  if (options.onlyMissing === false) params.set("onlyMissing", "false");
  if (options.department) params.set("department", options.department);
  const query = params.toString();

  const response: any = await apiRequest(
    `/api/dashboard/it-operations/patch-devices${query ? `?${query}` : ""}`
  );
  const data = response?.data || response || {};
  const rows = Array.isArray(data.devices) ? data.devices : [];

  return rows.map(mapPatchMissingDevice);
}

// Device-level breakdown backing the Patch Compliance drill-downs (Need
// Patching, Devices Scanned, tap-a-department) — same IsApplicable=1 AND
// IsInstalled=0 definition as missingPatchDevices in the dashboard summary,
// so counts always agree with those cards. Defaults to "missing only" so
// existing callers that don't pass options keep today's behavior.
export async function fetchPatchMissingDevices(
  options: PatchDeviceListOptions = {}
): Promise<MobilePatchMissingDevice[]> {
  const onlyMissing = options.onlyMissing !== false;
  const department = options.department || "";
  const cacheKey = `${PATCH_MISSING_DEVICES_CACHE_KEY}-${onlyMissing}-${department}`;

  return fetchWithCache(
    cacheKey,
    PATCH_MISSING_DEVICES_CACHE_TTL_MS,
    () => requestPatchDeviceList(options),
    options
  );
}

const RISK_TONE_MAP: Record<string, StatusTone> = {
  critical: "red",
  warning: "amber",
  neutral: "neutral",
  good: "green",
};

function mapRiskTone(value: unknown): StatusTone {
  return RISK_TONE_MAP[String(value || "").toLowerCase()] || "neutral";
}

function mapRiskBreakdownRows(rows: any): MobileRiskBreakdownRow[] {
  return (Array.isArray(rows) ? rows : []).map((row: any) => ({
    name: cleanText(row?.name),
    value: asNumber(row?.value, 0),
    percent: asNumber(row?.percent, 0),
    tone: mapRiskTone(row?.tone),
  }));
}

async function requestRiskSummary(
  options: FetchOptions = {}
): Promise<{ summary: MobileRiskSummary; devices: MobileRiskDevice[] }> {
  const response: any = await apiRequest("/api/mobile/dashboard/risk");
  const data = response?.data || response || {};
  const risk = data?.risk || {};

  const devices: MobileRiskDevice[] = (Array.isArray(risk.deviceRiskRows) ? risk.deviceRiskRows : []).map(
    (row: any, index: number) => ({
      id: uniqueKey(`${row?.deviceName}-${index}`, index, "risk-device"),
      deviceName: cleanText(row?.deviceName, "Unknown Device"),
      platform: cleanText(row?.platform),
      model: cleanText(row?.model),
      department: cleanText(row?.department, "Unassigned"),
      lastSeen: cleanText(row?.lastSeen),
      riskScore: asNumber(row?.riskScore, 0),
      severity: cleanText(row?.osLifecycleSeverity, "Medium"),
      reasons: cleanText(row?.reasons),
    })
  );

  return {
    summary: {
      totalCritical: asNumber(risk.totalCritical, 0),
      totalHigh: asNumber(risk.totalHigh, 0),
      totalMedium: asNumber(risk.totalMedium, 0),
      unsupportedOsDevices: asNumber(risk.unsupportedOsDevices, 0),
      outdatedOsDevices: asNumber(risk.outdatedOsDevices, 0),
      severityBreakdown: mapRiskBreakdownRows(risk.severityBreakdown),
      categoryBreakdown: mapRiskBreakdownRows(risk.categoryBreakdown),
    },
    devices,
  };
}

// Real device risk data, scoped intentionally by the backend to Windows
// EOL/EOS lifecycle evidence and Management Policy scoring — not endpoint
// connectivity or ticket data, so this must never be confused with the
// endpoint "offline/stale" breakdown shown elsewhere.
export async function fetchRiskSummary(
  options: FetchOptions = {}
): Promise<{ summary: MobileRiskSummary; devices: MobileRiskDevice[] }> {
  return fetchWithCache(
    RISK_SUMMARY_CACHE_KEY,
    RISK_SUMMARY_CACHE_TTL_MS,
    () => requestRiskSummary(options),
    options
  );
}

function mapAgingDevice(row: any, index: number): MobileAgingDevice {
  return {
    id: uniqueKey(`${row?.deviceName}-${row?.model}`, index, "aging-device"),
    deviceName: cleanText(row?.deviceName, "Unknown device"),
    model: cleanText(row?.model, ""),
    platform: cleanText(row?.platform, ""),
    department: cleanText(row?.department, "Unassigned"),
    status: cleanText(row?.status, ""),
    lastSeen: formatDateTime(row?.lastSeen),
    ageYears: asNumber(row?.ageYears, 0),
  };
}

async function requestDeviceAging(options: FetchOptions = {}): Promise<MobileDeviceAgingSummary> {
  const response: any = await apiRequest("/api/dashboard/device-aging");
  const data = response?.data || response || {};
  const deviceRows = Array.isArray(data.agingDeviceRows) ? data.agingDeviceRows : [];

  return {
    totalDevices: asNumber(data.totalDevices, 0),
    agingDevices: asNumber(data.agingDevices, 0),
    monitorDevices: asNumber(data.monitorDevices, 0),
    healthyDevices: asNumber(data.healthyDevices, 0),
    unknownAgeDevices: asNumber(data.unknownAgeDevices, 0),
    agingMinYears: asNumber(data.agingMinYears, 5),
    devices: deviceRows.map(mapAgingDevice),
  };
}

// Hardware age, not OS/software lifecycle risk — a device counts as "aging"
// once it's older than the PC Aging Rule threshold (Settings > PC Aging
// Rule), same definition the web app's Management Dashboard uses.
export async function fetchDeviceAging(
  options: FetchOptions = {}
): Promise<MobileDeviceAgingSummary> {
  return fetchWithCache(
    DEVICE_AGING_CACHE_KEY,
    DEVICE_AGING_CACHE_TTL_MS,
    () => requestDeviceAging(options),
    options
  );
}

function mapSoftwareBreakdownRows(rows: any): MobileSoftwareBreakdownRow[] {
  return (Array.isArray(rows) ? rows : []).map((row: any) => ({
    name: cleanText(row?.name),
    value: asNumber(row?.value, 0),
    percent: asNumber(row?.percent, 0),
  }));
}

async function requestSoftwareSummary(options: FetchOptions = {}): Promise<MobileSoftwareSummary> {
  const response: any = await apiRequest("/api/mobile/dashboard/software");
  const data = response?.data || response || {};
  const software = data?.software || {};

  const lifecycleWatch: MobileSoftwareLifecycleItem[] = (Array.isArray(software.lifecycleWatch) ? software.lifecycleWatch : [])
    .filter((row: any) => cleanText(row?.name, "") !== "-")
    .map((row: any) => ({
      name: cleanText(row?.name, "Unknown"),
      vendor: cleanText(row?.vendor, ""),
      installs: asNumber(row?.installs, 0),
      uniqueTitles: asNumber(row?.uniqueTitles, 0),
      lifecycleStatus: cleanText(row?.lifecycleStatus, "Lifecycle Not Found"),
      supportStatus: cleanText(row?.supportStatus, ""),
      eolDate: cleanText(row?.eolDate, ""),
      eosDate: cleanText(row?.eosDate, ""),
    }));

  return {
    totalInstallations: asNumber(software.totalInstallations, 0),
    uniqueSoftware: asNumber(software.uniqueSoftware, 0),
    devicesWithSoftware: asNumber(software.devicesWithSoftware, 0),
    unclassifiedSoftware: asNumber(software.unclassifiedSoftware, 0),
    latestScan: cleanText(software.latestScan, "-"),
    topCategories: mapSoftwareBreakdownRows(software.topCategories),
    classificationBreakdown: mapSoftwareBreakdownRows(software.classificationBreakdown),
    lifecycleWatch,
    businessSoftware: asNumber(software.businessSoftware, 0),
    remoteControlSoftware: asNumber(software.remoteControlSoftware, 0),
    antivirusSoftware: asNumber(software.antivirusSoftware, 0),
    browserSoftware: asNumber(software.browserSoftware, 0),
    gamingSoftware: asNumber(software.gamingSoftware, 0),
    eolApplications: asNumber(software.eolApplications, 0),
    eosApplications: asNumber(software.eosApplications, 0),
    unsupportedApplications: asNumber(software.unsupportedApplications, 0),
  };
}

// Real software inventory data (classification, top categories, EOL/EOS
// lifecycle watch), sourced from the same dashboard endpoint. This is
// distinct from device risk (Windows OS lifecycle) — software lifecycle
// tracks individual applications like Office/Adobe/browsers.
export async function fetchSoftwareSummary(
  options: FetchOptions = {}
): Promise<MobileSoftwareSummary> {
  return fetchWithCache(
    SOFTWARE_SUMMARY_CACHE_KEY,
    SOFTWARE_SUMMARY_CACHE_TTL_MS,
    () => requestSoftwareSummary(options),
    options
  );
}

async function requestWorklistItems(limit: number): Promise<MobileWorkItem[]> {
  const response: any = await apiRequest(`/api/task-list?limit=${limit}`);
  const rows = getRows(response);

  return rows.map((task: any, index: number) => {
    const type = mapTaskType(task);
    const priority = mapTaskPriority(task);
    const status = cleanText(task?.state || task?.rawState);
    const title = cleanText(task?.description || task?.title || task?.name);
    const idValue =
      task?.jobId ||
      task?.id ||
      task?.Job_Idn ||
      task?.Task_ID ||
      `${task?.commandType || "task"}-${title}`;
    const source = cleanText(task?.commandType || task?.classification);

    return {
      id: uniqueKey(idValue, index, "task"),
      type,
      title,
      source: `${source}${hiddenKeySuffix(index)}`,
      site: cleanText(task?.raw?.Object_Full_Name || task?.raw?.Object_Rel_Name || task?.targetName),
      priority,
      status,
      due: cleanText(task?.scheduledTime || task?.startTime),
      updated: cleanText(task?.startTime || task?.endTime),
      owner: cleanText(task?.orderedBy),
      reason: cleanText(task?.effectiveStatusReason),
      action: cleanText(task?.action || task?.recommendedAction),
    };
  });
}

export async function fetchWorklistItems(
  options: WorklistFetchOptions = {}
): Promise<MobileWorkItem[]> {
  const limit = clampWorklistLimit(options.limit);

  return fetchWithCache(
    worklistCacheKey(limit),
    WORKLIST_CACHE_TTL_MS,
    () => requestWorklistItems(limit),
    options
  );
}

async function requestEndpointDevices(limit: number): Promise<MobileEndpointDevice[]> {
  const response: any = await apiRequest(`/api/hardware-inventory/assets?limit=${limit}`);
  return getRows(response)
    .map((row, index) => mapEndpointDevice(row, index))
    .sort((a, b) => getDateSortValue(b.rawLastSeen) - getDateSortValue(a.rawLastSeen));
}

export async function fetchEndpointDevices(
  options: EndpointDeviceFetchOptions = {}
): Promise<MobileEndpointDevice[]> {
  const limit = clampEndpointDeviceLimit(options.limit);
  const status = options.status || "all";
  const devices = await fetchWithCache(
    endpointDeviceCacheKey(limit),
    ENDPOINT_DEVICES_CACHE_TTL_MS,
    () => requestEndpointDevices(limit),
    options
  );

  return filterEndpointDevices(devices, status);
}

async function requestAllDeviceLocationRows(locationLimit: number) {
  const response: any = await apiRequest(`/api/geolocation/all-live?limit=${locationLimit}`);
  return getRows(response);
}

async function requestDeviceLocations() {
  const rows = await requestAllDeviceLocationRows(GEOLOCATION_REQUEST_LIMIT);
  return mapLatestDeviceLocations(rows);
}

export async function fetchGeolocationSummary(
  options: GeolocationFetchOptions = {}
): Promise<MobileGeolocationSummary> {
  const endpointLimit = clampEndpointDeviceLimit(options.endpointLimit);
  const locationLimit = clampGeolocationLimit(options.locationLimit);

  return fetchWithCache(
    geolocationSummaryCacheKey(endpointLimit, locationLimit),
    GEOLOCATION_CACHE_TTL_MS,
    async () => {
      const [devices, locationRows, geoTotals] = await Promise.all([
        fetchEndpointDevices({ status: "all", limit: endpointLimit, force: options.force }),
        requestAllDeviceLocationRows(locationLimit),
        // devices.length is capped at endpointLimit and undercounts a fleet
        // bigger than that cap — totalDevices here is the same uncapped
        // COUNT(*) System Health uses, so "Total Endpoint Inventory" always
        // agrees with the rest of the app instead of silently showing a
        // truncated fetch size as if it were the real fleet total. Sourced
        // from the lean /api/mobile/dashboard/geo-summary endpoint, not the
        // full dashboard.
        requestGeoSummaryTotals(options).catch(() => null),
      ]);

      const summary = mapGeolocationSummary(devices, locationRows);
      if (geoTotals?.totalDevices) {
        summary.totalDevices = geoTotals.totalDevices;
      }

      // The device/location key match above (deviceId/deviceName string
      // matching) is the same approach the web Dashboard tried and moved
      // away from — mismatched name/ID formats between the hardware and
      // geolocation tables make it undercount "detected" devices. Prefer
      // the server-computed trackedDevices (same getItOpsGeoSummary field
      // backing the web app's "GPS Detected (≤7 days)" KPI — devices with a
      // FRESH, ≤7-day GPS position; staleLocations is a separate, non-
      // overlapping bucket) for the headline counts. Only fall back to the
      // key-matched counts if that data is missing.
      if (geoTotals && geoTotals.trackedDevices > 0) {
        const detected = geoTotals.trackedDevices;
        summary.detectedCount = detected;
        summary.notDetectedCount = Math.max(0, summary.totalDevices - detected);
      }

      return summary;
    },
    options
  );
}

export async function fetchDeviceLocationHistory(
  device: Pick<MobileGeolocationDevice, "deviceId" | "deviceName">,
  options: GeolocationFetchOptions & { limit?: number } = {}
): Promise<MobileDeviceLocation[]> {
  const locationLimit = clampGeolocationLimit(options.locationLimit);
  const historyLimit = Math.max(1, Math.min(Number(options.limit || DEVICE_LOCATION_HISTORY_LIMIT), 50));
  const deviceKey = normalizeKeyPart(device.deviceId || device.deviceName, "device");

  return fetchWithCache(
    locationHistoryCacheKey(deviceKey, locationLimit),
    GEOLOCATION_CACHE_TTL_MS,
    async () => {
      const rows = await requestAllDeviceLocationRows(locationLimit);
      const allLocations = rows
        .map((row, index) => mapDeviceLocation(row, index))
        .filter((location) => locationMatchesDevice(location, { ...device, id: device.deviceId, branch: "", status: "Unknown", isOnline: false, isStale: false, lastSeen: "", rawLastSeen: "", model: "", platform: "", ipAddress: "", source: "" }))
        .sort((a, b) => getDateSortValue(b.rawTime) - getDateSortValue(a.rawTime));

      return allLocations.slice(0, historyLimit);
    },
    options
  );
}

async function requestReportCatalog(): Promise<MobileReportItem[]> {
  const response: any = await apiRequest("/api/reports/catalog");
  const rows = Array.isArray(response?.reports)
    ? response.reports
    : Array.isArray(response?.data?.reports)
      ? response.data.reports
      : getRows(response);

  return rows.map((item: any, index: number) => {
    const title = cleanText(item?.title || item?.name);
    const idValue = item?.id || item?.reportId || item?.key || title;

    return {
      id: uniqueKey(idValue, index, "report"),
      title,
      description: cleanText(item?.description || item?.summary),
      category: cleanText(item?.category || item?.icon, "executive"),
      type: cleanText(item?.type, ""),
      source: cleanText(item?.source, ""),
      outputs: Array.isArray(item?.outputs) ? item.outputs : [],
      status: cleanText(item?.status, ""),
      tone: item?.tone || "blue",
      pages: asNumber(item?.pages, 0),
      frequency: cleanText(item?.frequency, ""),
      lastGenerated: cleanText(item?.lastGenerated || item?.generatedAt || item?.updatedAt, ""),
    };
  });
}

export async function fetchReportCatalog(
  options: FetchOptions = {}
): Promise<MobileReportItem[]> {
  return fetchWithCache(
    REPORTS_CACHE_KEY,
    REPORTS_CACHE_TTL_MS,
    requestReportCatalog,
    options
  );
}

async function requestMobileOpsSnapshot(options: FetchOptions = {}): Promise<MobileOpsSnapshot> {
  const [dashboardResult, reportsResult, locationResult] = await Promise.allSettled([
    requestMobileOverview(options),
    requestReportCatalog(),
    requestDeviceLocations(),
  ]);

  if (dashboardResult.status === "rejected") {
    throw dashboardResult.reason;
  }

  const data = dashboardResult.value || {};
  const hardware = data?.hardware || {};
  const serviceDesk = data?.serviceDesk || {};
  const trendSummary = data?.trendSummary || {};

  const totalEndpoints = asNumber(hardware?.totalDevices, 0);
  const online = asNumber(hardware?.onlineDevices, 0);
  const offline = asNumber(
    hardware?.offlineDevices,
    Math.max(totalEndpoints - online, 0)
  );
  const stale = asNumber(hardware?.staleSync || hardware?.staleDevices, 0);

  const open = asNumber(serviceDesk?.pendingTickets, 0);
  const closed = asNumber(trendSummary?.resolved || serviceDesk?.closedTickets, 0);
  const slaExceeded = asNumber(serviceDesk?.overdueTickets || serviceDesk?.slaExceeded, 0);

  const reports = reportsResult.status === "fulfilled" ? reportsResult.value : [];
  const locationPayload =
    locationResult.status === "fulfilled"
      ? locationResult.value
      : { locations: [], total: 0 };

  return {
    generatedAt: formatDateTime(data?.generatedAt || new Date().toISOString()),
    rangeLabel: cleanText(data?.rangeLabel, "Last 7 Days"),
    endpoints: {
      total: totalEndpoints,
      online,
      offline,
      stale,
    },
    tickets: {
      total: Math.max(open + closed, open, closed),
      open,
      closed,
      slaExceeded,
      slaAchievement: asNumber(serviceDesk?.slaAchievement, 0),
    },
    patch: readPatchSnapshot(data),
    latestReport: pickLatestReport(reports),
    locations: locationPayload.locations,
    locationTotal: locationPayload.total,
  };
}

export async function fetchMobileOpsSnapshot(
  options: FetchOptions = {}
): Promise<MobileOpsSnapshot> {
  return fetchWithCache(
    SNAPSHOT_CACHE_KEY,
    SNAPSHOT_CACHE_TTL_MS,
    () => requestMobileOpsSnapshot(options),
    options
  );
}
