import Constants from "expo-constants";
import * as Application from "expo-application";
import * as Updates from "expo-updates";

// Was hardcoded to "UAT" everywhere it appeared (Login screen badge, Settings
// > Environment row) — meant the label never changed even in the production
// build submitted to the App Store. Updates.channel reflects the actual EAS
// build profile (development/preview/production per eas.json), so this now
// tracks reality automatically instead of needing a manual edit per release.
export function getAppEnvironment() {
  const channel = Updates.channel;
  if (channel === "production") return "Production";
  if (channel === "preview") return "Preview";
  if (channel) return channel;
  return "Development";
}

export function getAppVersion() {
  return (
    Constants.expoConfig?.version ||
    Application.nativeApplicationVersion ||
    "1.0.0"
  );
}

export function getAppBuildNumber() {
  return (
    Application.nativeBuildVersion ||
    String(Constants.expoConfig?.android?.versionCode || "")
  );
}