const STORAGE_KEY = "workshift.auth.tokens";
const USER_KEY = "workshift.auth.user";

/* ——— JWT Decode (no dependencies) ——— */
function decodeJwtPayload(token) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    // JWT sử dụng base64url; cần chuyển sang base64 chuẩn và bổ sung padding "="
    let payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    while (payload.length % 4) payload += "=";
    const binary = atob(payload);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const decoded = new TextDecoder("utf-8").decode(bytes);
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export function extractUserFromToken(accessToken) {
  if (!accessToken) return null;
  const payload = decodeJwtPayload(accessToken);
  if (!payload) return null;
  return {
    id: payload.userId ?? payload.id ?? null,
    username: payload.username ?? payload.sub ?? null,
    fullName: payload.fullName ?? payload.name ?? null,
    email: payload.email ?? null,
    phone: payload.phone ?? null,
    globalRole: payload.globalRole ?? payload.role ?? "USER",
  };
}

/* ——— Token storage ——— */
export function getAuthTokens() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    if (!parsed.accessToken || !parsed.refreshToken) return null;
    return { accessToken: String(parsed.accessToken), refreshToken: String(parsed.refreshToken) };
  } catch {
    return null;
  }
}

export function getAccessToken() {
  return getAuthTokens()?.accessToken || null;
}

export function setAuthTokens(tokens) {
  if (!tokens || !tokens.accessToken || !tokens.refreshToken) {
    throw new Error("Invalid tokens");
  }
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ accessToken: String(tokens.accessToken), refreshToken: String(tokens.refreshToken) }),
  );
  // Auto-extract user info from access token
  const user = extractUserFromToken(tokens.accessToken);
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export function clearAuthTokens() {
  localStorage.removeItem(STORAGE_KEY);
  localStorage.removeItem(USER_KEY);
}

/* ——— User info storage ——— */
export function getUserInfo() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}
