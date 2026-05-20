const SESSION_KEY = "munch_is_logged_in";
const USER_EMAIL_KEY = "munch_user_email";
const EXPIRY_KEY = "munch_session_expires_at";

const DEFAULT_SESSION_DURATION_MS = 30 * 60 * 1000;

function isBrowser() {
  return typeof window !== "undefined";
}

export function setAuthSession(email: string, durationMs = DEFAULT_SESSION_DURATION_MS) {
  if (!isBrowser()) return;
  const expiry = Date.now() + durationMs;
  localStorage.setItem(SESSION_KEY, "true");
  localStorage.setItem(USER_EMAIL_KEY, email);
  localStorage.setItem(EXPIRY_KEY, expiry.toString());
}

export function clearAuthSession() {
  if (!isBrowser()) return;
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem(USER_EMAIL_KEY);
  localStorage.removeItem(EXPIRY_KEY);
}

export function getAuthEmail() {
  if (!isBrowser()) return "";
  return localStorage.getItem(USER_EMAIL_KEY) ?? "";
}

export function getAuthExpiry() {
  if (!isBrowser()) return null;
  const expiresAt = Number(localStorage.getItem(EXPIRY_KEY));
  return Number.isFinite(expiresAt) && expiresAt > 0 ? expiresAt : null;
}

export function isAuthSessionValid() {
  if (!isBrowser()) return false;
  const loggedIn = localStorage.getItem(SESSION_KEY) === "true";
  if (!loggedIn) {
    clearAuthSession();
    return false;
  }

  const expiresAt = getAuthExpiry();
  if (!expiresAt || Date.now() >= expiresAt) {
    clearAuthSession();
    return false;
  }

  return true;
}