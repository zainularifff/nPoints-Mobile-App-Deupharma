const { AndroidConfig, withAndroidManifest, withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

// Extra hosts that are always allowed cleartext for local testing
// (Android emulator host + localhost).
const DEV_CLEARTEXT_HOSTS = ["10.0.2.2", "localhost"];

function hostnameOf(raw) {
  const clean = String(raw || "").trim();
  if (!clean) return null;

  try {
    const url = new URL(/^https?:\/\//i.test(clean) ? clean : `http://${clean}`);
    return url.hostname;
  } catch (error) {
    return null;
  }
}

function getApiHosts(config) {
  // The JS bundle can resolve its API host from either the build-time
  // `extra.apiBaseUrl` (from API_URL) or the runtime-inlined
  // EXPO_PUBLIC_API_BASE_URL env var (src/config/api.ts prefers the latter
  // when set) — allowlist both so cleartext isn't silently blocked when
  // they diverge.
  return [
    hostnameOf(config?.extra?.apiBaseUrl),
    hostnameOf(process.env.EXPO_PUBLIC_API_BASE_URL),
  ];
}

function buildNetworkSecurityConfig(config) {
  const hosts = [...new Set([...getApiHosts(config), ...DEV_CLEARTEXT_HOSTS].filter(Boolean))];

  const domainEntries = hosts
    .map((host) => `        <domain includeSubdomains="false">${host}</domain>`)
    .join("\n");

  // Cleartext HTTP is only permitted for the configured API host and local
  // dev hosts. Everything else requires HTTPS with system CAs only.
  return `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>

    <domain-config cleartextTrafficPermitted="true">
${domainEntries}
    </domain-config>
</network-security-config>
`;
}

function ensureApplication(manifest) {
  const application = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
  delete application.$["android:usesCleartextTraffic"];
  application.$["android:networkSecurityConfig"] = "@xml/network_security_config";
  return manifest;
}

function withAndroidNetworkSecurity(config) {
  config = withAndroidManifest(config, (config) => {
    config.modResults = ensureApplication(config.modResults);
    return config;
  });

  config = withDangerousMod(config, ["android", async (config) => {
    const xmlDir = path.join(
      config.modRequest.platformProjectRoot,
      "app",
      "src",
      "main",
      "res",
      "xml"
    );
    const xmlPath = path.join(xmlDir, "network_security_config.xml");

    fs.mkdirSync(xmlDir, { recursive: true });
    fs.writeFileSync(xmlPath, buildNetworkSecurityConfig(config));

    return config;
  }]);

  return config;
}

module.exports = withAndroidNetworkSecurity;
