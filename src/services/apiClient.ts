import { getApiBaseUrl, getApiConfigError, API_TIMEOUT_MS } from "../config/api";
import { clearSessionToken, getSessionToken } from "./secureStorage";

type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

type ApiRequestOptions = {
  method?: ApiMethod;
  body?: unknown;
  headers?: Record<string, string>;
  requireAuth?: boolean;
};

type SessionExpiredListener = () => void;

const sessionExpiredListeners = new Set<SessionExpiredListener>();

export function onSessionExpired(listener: SessionExpiredListener) {
  sessionExpiredListeners.add(listener);
  return () => {
    sessionExpiredListeners.delete(listener);
  };
}

function notifySessionExpired() {
  sessionExpiredListeners.forEach((listener) => {
    try {
      listener();
    } catch (_) {
      // A listener failure must not break the API error flow.
    }
  });
}

export class ApiError extends Error {
  status: number;
  payload: any;

  constructor(message: string, status: number, payload?: any) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.payload = payload;
  }
}

function ensureApiConfigured(endpoint: string) {
  const configError = getApiConfigError();
  if (!configError) return;

  throw new ApiError(configError, 0, {
    code: "API_CONFIG_MISSING",
    endpoint,
    baseUrl: getApiBaseUrl() || null,
  });
}

function originOf(value: string) {
  const match = /^https?:\/\/[^/]+/i.exec(value);
  return match ? match[0].toLowerCase() : "";
}

function isSameOrigin(url: string, base: string) {
  const urlOrigin = originOf(url);
  const baseOrigin = originOf(base);
  return !!urlOrigin && !!baseOrigin && urlOrigin === baseOrigin;
}

function buildApiUrl(endpoint: string): { url: string; isOwnBackend: boolean } {
  const apiBaseUrl = getApiBaseUrl();

  if (/^https?:\/\//i.test(endpoint)) {
    return { url: endpoint, isOwnBackend: isSameOrigin(endpoint, apiBaseUrl) };
  }

  ensureApiConfigured(endpoint);

  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  return { url: `${apiBaseUrl}${normalizedEndpoint}`, isOwnBackend: true };
}

async function readJsonSafely(response: Response) {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch (_) {
    return { message: text };
  }
}

function buildNetworkErrorMessage(error: any) {
  // Kept generic on purpose — this is user-facing (shown in an Alert on the
  // Login screen), so it must not leak the backend host/IP. The real URL is
  // still attached to the thrown ApiError's payload.baseUrl for logs/debugging.
  if (error?.name === "AbortError") {
    return "Connection timed out. Please check your network and try again.";
  }

  return "Cannot connect to the server. Please check your network connection and try again, or contact IT if the issue persists.";
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const method = options.method || "GET";
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(options.body !== undefined ? { "Content-Type": "application/json" } : {}),
    ...(options.headers || {}),
  };

  const { url, isOwnBackend: isOwnBackendUrl } = buildApiUrl(endpoint);
  let sentAuthToken = false;

  // Never leak the session token to hosts other than the configured backend.
  if (options.requireAuth !== false && isOwnBackendUrl) {
    const token = await getSessionToken();

    if (token) {
      headers.Authorization = `Bearer ${token}`;
      sentAuthToken = true;
    }
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch(url, {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
  } catch (error: any) {
    throw new ApiError(buildNetworkErrorMessage(error), 0, {
      code: error?.name === "AbortError" ? "API_TIMEOUT" : "API_CONNECTION_FAILED",
      endpoint,
      baseUrl: getApiBaseUrl(),
      originalError: error?.message || String(error),
    });
  } finally {
    clearTimeout(timeout);
  }

  const payload = await readJsonSafely(response);

  if (!response.ok || payload?.success === false) {
    // Only treat 401/403 as an expired session when the request actually
    // carried a token (a failed login also returns 401).
    if (sentAuthToken && (response.status === 401 || response.status === 403)) {
      await clearSessionToken();
      notifySessionExpired();
    }

    const message =
      payload?.message ||
      payload?.error ||
      `Request failed with status ${response.status}`;

    throw new ApiError(message, response.status, {
      code: payload?.code || `HTTP_${response.status}`,
      endpoint,
      baseUrl: getApiBaseUrl(),
      payload,
    });
  }

  return payload as T;
}
