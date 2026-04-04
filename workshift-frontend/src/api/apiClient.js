import { getAccessToken, getAuthTokens, setAuthTokens, clearAuthTokens } from "../features/auth/authStorage";

const DEFAULT_BASE_URL = "http://localhost:8080/api/v1";

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, "");

let refreshPromise = null;

async function tryRefreshToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      const tokens = getAuthTokens();
      if (!tokens?.refreshToken) throw new Error("No refresh token");

      const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken: tokens.refreshToken }),
      });

      if (!res.ok) throw new Error("Refresh failed");

      const payload = await res.json();
      const newTokens = payload?.data || payload;
      // Backend trả:
      //  - LoginResponse: { token, refreshToken, ... }
      //  - RefreshTokenResponse: { token, refreshToken }
      // Frontend storage/AuthContext lại dùng field: { accessToken, refreshToken }
      const accessToken = newTokens?.accessToken || newTokens?.token;
      const refreshToken = newTokens?.refreshToken;

      if (!accessToken || !refreshToken) throw new Error("Invalid refresh response");

      setAuthTokens({ accessToken, refreshToken });
      return accessToken;
    } catch {
      clearAuthTokens();
      window.location.href = "/auth/login";
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

export async function apiFetch(path, options = {}) {
  const urlPath = String(path || "").startsWith("/") ? path : `/${path}`;
  const url = `${API_BASE_URL}${urlPath}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has("Authorization")) {
    const accessToken = getAccessToken();
    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }
  }
  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  let response = await fetch(url, { ...options, headers });

  // Auto-refresh on 401
  if (response.status === 401 && !path.includes("/auth/")) {
    const newAccessToken = await tryRefreshToken();
    if (newAccessToken) {
      const retryHeaders = new Headers(options.headers || {});
      retryHeaders.set("Authorization", `Bearer ${newAccessToken}`);
      if (!retryHeaders.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
        retryHeaders.set("Content-Type", "application/json");
      }
      response = await fetch(url, { ...options, headers: retryHeaders });
    }
  }

  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json().catch(() => null) : await response.text().catch(() => null);

  if (!response.ok) {
    let message = (payload && payload.message) || response.statusText || "Request failed";
    const errs = payload && payload.errors;
    if (errs && typeof errs === "object" && !Array.isArray(errs)) {
      const parts = Object.values(errs).filter(Boolean);
      if (parts.length) message = `${message} (${parts.join("; ")})`;
    }
    const error = new Error(message);
    error.status = response.status;
    error.payload = payload;
    throw error;
  }

  return payload;
}

export function unwrapApiResponse(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("Invalid API response");
  }
  if (!("data" in payload)) {
    return payload;
  }
  return payload.data;
}

/** Envelope `{ data: T[] }` từ apiOk — luôn trả mảng (rỗng nếu không phải mảng). */
export function unwrapApiArray(payload) {
  try {
    const d = unwrapApiResponse(payload);
    return Array.isArray(d) ? d : [];
  } catch {
    return [];
  }
}
