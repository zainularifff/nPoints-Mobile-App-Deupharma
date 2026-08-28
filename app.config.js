// No hardcoded fallback — API_URL must come from a .env file (local dev) or
// from eas.json / EAS secrets (preview & production builds). If it's
// missing, the app shows a clear "server not configured" screen instead of
// silently shipping a build wired to a developer's LAN IP.
const API_URL = process.env.API_URL || "";

// Same host the app will actually call, whichever env var wins at runtime
// (src/config/api.ts prefers EXPO_PUBLIC_API_BASE_URL over API_URL) — used
// below to scope the iOS ATS exception to just that host, mirroring how
// plugins/withAndroidNetworkSecurity.js scopes Android's cleartext
// allowlist. Neither platform gets a blanket "allow all HTTP" exception.
function apiHostname() {
  const raw = process.env.EXPO_PUBLIC_API_BASE_URL || API_URL;
  if (!raw) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(raw) ? raw : `http://${raw}`);
    return url.hostname;
  } catch (error) {
    return null;
  }
}

const apiHost = apiHostname();

export default {
  expo: {
    name: "EMA Operational Dashboard",
    slug: "ema-operational-dashboard",
    version: "1.0.2",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    jsEngine: "hermes",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff"
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.npoints.ema",
      infoPlist: {
        NSFaceIDUsageDescription: "Allow OPS Mobile to use Face ID for secure app unlock.",
        // The backend runs over plain HTTP (no TLS yet), which iOS blocks
        // by default (App Transport Security). Only the configured API
        // host gets a cleartext exception — every other domain still
        // requires HTTPS, same scoping as the Android network security
        // config plugin.
        ...(apiHost
          ? {
              NSAppTransportSecurity: {
                NSExceptionDomains: {
                  [apiHost]: {
                    NSExceptionAllowsInsecureHTTPLoads: true,
                    NSIncludesSubdomains: false
                  }
                }
              }
            }
          : {})
      }
    },
    android: {
      package: "com.npoints.ema",
      versionCode: 4,
      softwareKeyboardLayoutMode: "resize",
      edgeToEdgeEnabled: false,
      predictiveBackGestureEnabled: false,
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff"
      },
      permissions: [
        "android.permission.USE_BIOMETRIC",
        "android.permission.USE_FINGERPRINT"
      ]
    },
    web: {
      favicon: "./assets/favicon.png"
    },
    plugins: [
      "expo-secure-store",
      "expo-font",
      "./plugins/withAndroidNetworkSecurity",
      [
        "expo-local-authentication",
        {
          faceIDPermission: "Allow OPS Mobile to use Face ID for secure app unlock."
        }
      ],
      [
        "expo-camera",
        {
          cameraPermission: "Allow OPS Mobile to use the camera to scan asset QR codes."
        }
      ]
    ],
    extra: {
      apiBaseUrl: API_URL,
      eas: {
        projectId: "bd8369ae-b7f4-4e54-b4ce-2d84b5f5a497"
      }
    },
    runtimeVersion: "1.0.2",
    updates: {
      url: "https://u.expo.dev/bd8369ae-b7f4-4e54-b4ce-2d84b5f5a497"
    }
  }
};