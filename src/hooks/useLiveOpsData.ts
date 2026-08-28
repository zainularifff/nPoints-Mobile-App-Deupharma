import { useCallback, useEffect, useState } from "react";

import {
  fetchMobileOpsSnapshot,
  fetchReportCatalog,
  getCachedMobileOpsSnapshot,
  getCachedReportCatalog,
  type MobileOpsSnapshot,
  type MobileReportItem,
  type MobileWorkItem,
} from "../services/opsMobileService";

const emptyMobileSnapshot: MobileOpsSnapshot = {
  generatedAt: "-",
  rangeLabel: "-",
  endpoints: {
    total: 0,
    online: 0,
    offline: 0,
    stale: 0,
  },
  tickets: {
    total: 0,
    open: 0,
    closed: 0,
    slaExceeded: 0,
    slaAchievement: 0,
  },
  patch: { complianceRate: 0, scannedDevices: 0, missingPatches: 0, missingPatchDevices: 0, criticalVulnerabilities: 0, lastScanTime: "-" },
  latestReport: null,
  locations: [],
  locationTotal: 0,
};

type LoadOptions = { silent?: boolean };

function errorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return String(error || "Failed to load live data.");
}

function mapSnapshotToWorkItems(snapshot: MobileOpsSnapshot): MobileWorkItem[] {
  const rows: MobileWorkItem[] = [];

  if (snapshot?.tickets?.slaExceeded) {
    rows.push({
      id: "sla-exceeded",
      type: "ticket",
      title: "SLA Exceeded Tickets",
      source: "Service Desk",
      site: "All Branches",
      priority: "High",
      status: `${snapshot.tickets.slaExceeded}`,
      due: "-",
      updated: snapshot.generatedAt || "-",
      owner: "-",
      reason: "Tickets exceeding SLA require operator attention.",
      action: "Review open tickets in operator view.",
    });
  }

  if (snapshot?.endpoints?.offline || snapshot?.endpoints?.stale) {
    rows.push({
      id: "endpoint-follow-up",
      type: "endpoint",
      title: "Endpoint Follow-up",
      source: "Endpoint Fleet",
      site: "All Branches",
      priority: snapshot.endpoints.offline ? "High" : "Medium",
      status: `${snapshot.endpoints.offline} offline / ${snapshot.endpoints.stale} stale`,
      due: "-",
      updated: snapshot.generatedAt || "-",
      owner: "-",
      reason: "Offline or stale endpoints need validation.",
      action: "Check device status and latest location.",
    });
  }

  if (snapshot?.locations?.length) {
    const item = snapshot.locations[0];
    rows.push({
      id: "latest-device-location",
      type: "endpoint",
      title: item.deviceName || "Latest device location",
      source: "Geolocation",
      site: item.address || "-",
      priority: "Low",
      status: "Latest per device",
      due: "-",
      updated: item.time || "-",
      owner: item.username || "-",
      reason: `${item.latitude || "-"}, ${item.longitude || "-"}`,
      action: "Open Operator tab for device location list.",
    });
  }

  if (snapshot?.latestReport) {
    rows.push({
      id: "latest-report",
      type: "asset",
      title: snapshot.latestReport.title || "Latest report",
      source: "Report",
      site: snapshot.latestReport.category || "-",
      priority: "Low",
      status: snapshot.latestReport.type || "-",
      due: "-",
      updated: snapshot.latestReport.lastGenerated || snapshot.generatedAt || "-",
      owner: "-",
      reason: snapshot.latestReport.description || "Latest report item.",
      action: "Review in Reports tab.",
    });
  }

  return rows;
}

export function useMobileOpsSnapshot() {
  const cachedSnapshot = getCachedMobileOpsSnapshot();
  const [snapshot, setSnapshot] = useState<MobileOpsSnapshot>(() => cachedSnapshot || emptyMobileSnapshot);
  const [loading, setLoading] = useState(() => !cachedSnapshot);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadSnapshot = useCallback(async (options: LoadOptions = {}) => {
    if (options.silent) setRefreshing(true);
    else if (!getCachedMobileOpsSnapshot()) setLoading(true);

    try {
      const liveSnapshot = await fetchMobileOpsSnapshot({ force: options.silent });
      setSnapshot(liveSnapshot);
      setError("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadSnapshot();
  }, [loadSnapshot]);

  return { snapshot, loading, refreshing, error, reloadSnapshot: loadSnapshot };
}

export function useLiveWorklist() {
  const cachedSnapshot = getCachedMobileOpsSnapshot();
  const [items, setItems] = useState<MobileWorkItem[]>(() => cachedSnapshot ? mapSnapshotToWorkItems(cachedSnapshot) : []);
  const [loading, setLoading] = useState(() => !cachedSnapshot);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadWorklist = useCallback(async (options: LoadOptions = {}) => {
    if (options.silent) setRefreshing(true);
    else if (!getCachedMobileOpsSnapshot()) setLoading(true);

    try {
      const snapshot = await fetchMobileOpsSnapshot({ force: options.silent });
      setItems(mapSnapshotToWorkItems(snapshot));
      setError("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadWorklist(); }, [loadWorklist]);

  return { items, loading, refreshing, error, reloadWorklist: loadWorklist };
}

export function useLiveReports() {
  const [reports, setReports] = useState<MobileReportItem[]>(() => getCachedReportCatalog() || []);
  const [loading, setLoading] = useState(() => !getCachedReportCatalog());
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const loadReports = useCallback(async (options: LoadOptions = {}) => {
    if (options.silent) setRefreshing(true);
    else if (!getCachedReportCatalog()) setLoading(true);

    try {
      const liveReports = await fetchReportCatalog({ force: options.silent });
      setReports(liveReports);
      setError("");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadReports(); }, [loadReports]);

  return { reports, loading, refreshing, error, reloadReports: loadReports };
}
