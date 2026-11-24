import { APP_CONFIG } from "../config/config.js";

const { TOKEN, USER } = APP_CONFIG.SESSION_STORAGE_KEYS;

export function setToken(token) {
  sessionStorage.setItem(TOKEN, token);
}

export function getToken() {
  return sessionStorage.getItem(TOKEN);
}

export function setCurrentUser(user) {
  sessionStorage.setItem(USER, JSON.stringify(user));
}

export function getCurrentUser() {
  const raw = sessionStorage.getItem(USER);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function clearSession() {
  sessionStorage.removeItem(TOKEN);
  sessionStorage.removeItem(USER);
}
