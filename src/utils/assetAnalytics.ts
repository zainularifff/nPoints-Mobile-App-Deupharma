import { AssetListItem } from "../services/assetService";

const ACTIVE_REPORTING_DAYS = 7;

export function getDaysSince(dateValue?: string | null) {
  if (!dateValue) {
    return null;
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const now = new Date();

  return (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
}

export function isRecentlyReporting(asset: AssetListItem) {
  const daysSinceLastConnection = getDaysSince(asset.ConnectionTime);

  if (daysSinceLastConnection === null) {
    return false;
  }

  return daysSinceLastConnection <= ACTIVE_REPORTING_DAYS;
}

export function isCurrentlyOnline(asset: AssetListItem) {
  return String(asset.ConnectionStatus || "").toLowerCase() === "online";
}

export function isStaleDevice(asset: AssetListItem) {
  const daysSinceLastConnection = getDaysSince(asset.ConnectionTime);

  if (daysSinceLastConnection === null) {
    return true;
  }

  return daysSinceLastConnection > ACTIVE_REPORTING_DAYS;
}

export function hasConnectionTimeGap(asset: AssetListItem) {
  const daysSinceLastConnection = getDaysSince(asset.ConnectionTime);
  return daysSinceLastConnection === null;
}

export function calculateAssetSummary(assets: AssetListItem[]) {
  const totalManaged = assets.length;

  const activeReporting = assets.filter(isRecentlyReporting).length;

  const currentlyOnline = assets.filter(isCurrentlyOnline).length;

  const offline = assets.filter((asset) => !isCurrentlyOnline(asset)).length;

  const stale = assets.filter(isStaleDevice).length;

  const dataGap = assets.filter(hasConnectionTimeGap).length;

  const activeCoverage = totalManaged
    ? Math.round((activeReporting / totalManaged) * 100)
    : 0;

  return {
    totalManaged,
    activeReporting,
    currentlyOnline,
    offline,
    stale,
    dataGap,
    activeCoverage,
  };
}