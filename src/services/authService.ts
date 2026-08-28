import type { AuthUser, LoginResult, TwoFactorChallenge } from "../types/auth";
import {
  clearAuthStorage,
  clearSessionToken,
  getSessionToken,
  saveSessionToken,
} from "./secureStorage";
import { apiRequest } from "./apiClient";

export type TwoFactorStatus = {
  enabled: boolean;
  setupRequired?: boolean;
  available?: boolean;
  message?: string;
};

function text(value: unknown, fallback = "") {
  const cleanValue = String(value ?? "").trim();
  return cleanValue || fallback;
}

function numberValue(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function booleanValue(value: unknown, fallback = false) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;

  const clean = String(value ?? "").trim().toLowerCase();
  if (["true", "1", "yes", "enabled", "enable", "active"].includes(clean)) return true;
  if (["false", "0", "no", "disabled", "disable", "inactive"].includes(clean)) return false;

  return fallback;
}

function mapAuthUser(raw: any = {}, fallbackUsername = ""): AuthUser {
  const username = text(raw.username ?? raw.userID ?? raw.UserID, fallbackUsername);

  return {
    id: text(raw.id ?? raw.emaUserID ?? raw.console_Idn ?? raw.userID ?? username, username),
    username,
    name: text(raw.name ?? raw.FullName ?? raw.fullName ?? username, username),
    email: text(raw.email ?? raw.Email, ""),
    role: text(raw.role ?? raw.roleName ?? raw.RoleName, "User"),
    department: text(raw.department ?? raw.Department, ""),
    console_Idn: raw.console_Idn,
    menuIndex: raw.menuIndex,
    tenantId: numberValue(raw.tenantId, 0) || undefined,
    tenantCode: text(raw.tenantCode, "") || undefined,
    tenantName: text(raw.tenantName, "") || undefined,
  };
}

function getErrorMessage(error: any) {
  if (error?.message === "Network request failed") {
    return "Cannot connect to server. Please check connection or network.";
  }

  return error?.message || "Login failed. Please try again.";
}

function readLoginData(response: any) {
  return response?.data || response || {};
}

function readToken(response: any) {
  const data = readLoginData(response);

  return text(
    data?.token ??
      response?.token ??
      data?.accessToken ??
      response?.accessToken ??
      data?.data?.token,
    ""
  );
}

function readUser(response: any, fallbackUsername = "") {
  const data = readLoginData(response);
  // Login-shaped responses nest the user under data.user. /api/auth/me
  // instead returns the user object directly as `data` — fall back to using
  // data itself so that shape doesn't map to an empty/default AuthUser.
  return mapAuthUser(data?.user ?? response?.user ?? data?.data?.user ?? data ?? {}, fallbackUsername);
}

function readTwoFactorUserId(user: AuthUser, rawUser: any = {}) {
  return numberValue(rawUser.emaUserID ?? rawUser.id ?? user.id, 0);
}

function readTwoFactorStatus(response: any, fallbackEnabled?: boolean): TwoFactorStatus {
  const data = response?.data || response || {};
  const user = data?.user || {};

  return {
    enabled: booleanValue(
      data?.enabled ??
        data?.twoFactorEnabled ??
        data?.twoFactorActive ??
        data?.isTwoFactorEnabled ??
        data?.mfaEnabled ??
        user?.twoFactorEnabled ??
        user?.mfaEnabled,
      fallbackEnabled ?? false
    ),
    setupRequired: booleanValue(data?.setupRequired, false),
    available: booleanValue(data?.available, true),
    message: text(data?.message, ""),
  };
}

async function tryApiRequest<T = any>(endpoint: string, options?: Parameters<typeof apiRequest>[1]) {
  try {
    return await apiRequest<T>(endpoint, options);
  } catch (error: any) {
    if (error?.status === 404 || error?.status === 405) return null;
    throw error;
  }
}

async function buildTwoFactorChallenge(response: any, fallbackUsername: string) {
  const data = readLoginData(response);
  const rawUser = data?.user || response?.user || {};
  const user = mapAuthUser(rawUser, fallbackUsername);
  const userId = readTwoFactorUserId(user, rawUser);
  const tenantId = numberValue(data?.tenantId ?? response?.tenantId, 0);
  const setupRequired = Boolean(
    response?.twoFactorSetupRequired ??
      data?.twoFactorSetupRequired ??
      response?.setupRequired ??
      data?.setupRequired
  );

  let setupData: any = null;

  if (setupRequired && userId) {
    try {
      setupData = await apiRequest("/api/mobile/auth/2fa/setup", {
        method: "POST",
        requireAuth: false,
        body: { userID: userId, tenantId },
      });
    } catch (_) {
      setupData = null;
    }
  }

  const setupPayload = setupData?.data || setupData || {};

  return {
    userId,
    tenantId,
    setupRequired,
    user,
    secret: text(setupPayload.secret ?? setupPayload.twoFactorSecret, ""),
    qrCode: text(setupPayload.qrCode, ""),
    otpauthUrl: text(setupPayload.otpauthUrl, ""),
  } satisfies TwoFactorChallenge;
}

export async function loginUser(
  username: string,
  password: string
): Promise<LoginResult> {
  try {
    const cleanUsername = username.trim();

    await clearSessionToken();

    const response = await apiRequest("/api/mobile/auth/login", {
      method: "POST",
      requireAuth: false,
      body: { email: cleanUsername, password },
    });

    const data = readLoginData(response);
    const requiresTwoFactor = Boolean(response?.twoFactorRequired ?? data?.twoFactorRequired);

    if (requiresTwoFactor) {
      const challenge = await buildTwoFactorChallenge(response, cleanUsername);
      return { success: true, twoFactorRequired: true, challenge };
    }

    const token = readToken(response);

    if (!token) {
      return { success: false, message: "Login token was not returned." };
    }

    await saveSessionToken(token);

    return { success: true, user: readUser(response, cleanUsername) };
  } catch (error: any) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function verifyTwoFactor(
  code: string,
  challenge: TwoFactorChallenge
): Promise<LoginResult> {
  try {
    const response = await apiRequest("/api/mobile/auth/2fa/verify", {
      method: "POST",
      requireAuth: false,
      body: {
        userID: challenge.userId,
        tenantId: challenge.tenantId,
        code,
        secret: challenge.secret,
        setup: challenge.setupRequired,
      },
    });

    const token = readToken(response);

    if (!token) {
      return { success: false, message: "Login token was not returned." };
    }

    await saveSessionToken(token);

    return {
      success: true,
      user: readUser(response, challenge.user.username || challenge.user.name),
    };
  } catch (error: any) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function getCurrentUser() {
  const response = await apiRequest("/api/auth/me");
  return readUser(response);
}

export async function getTwoFactorStatus(): Promise<TwoFactorStatus> {
  const response = await tryApiRequest<any>("/api/auth/2fa/status");

  if (response) return readTwoFactorStatus(response);

  // Some backends don't expose a dedicated 2FA status route; fall back to
  // reading the flag off the authenticated user's profile.
  const meResponse = await apiRequest<any>("/api/auth/me");
  return readTwoFactorStatus(meResponse);
}

export async function updateTwoFactorStatus(enabled: boolean): Promise<TwoFactorStatus> {
  const response = await apiRequest<any>(enabled ? "/api/auth/2fa/enable" : "/api/auth/2fa/disable", {
    method: "POST",
  });
  // If the enable/disable response omits an explicit `enabled` field, trust
  // the value we just requested rather than defaulting to "disabled".
  return readTwoFactorStatus(response, enabled);
}

export async function isLoggedIn() {
  const token = await getSessionToken();
  return !!token;
}

export async function logoutUser() {
  try {
    await apiRequest("/api/auth/logout", { method: "POST" });
  } catch (_) {
    // Local sign out should still continue if the server is unreachable.
  }

  await clearSessionToken();
}

export async function forceClearAuth() {
  await clearAuthStorage();
}
