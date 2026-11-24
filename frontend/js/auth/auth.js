import { APP_CONFIG } from "../config/config.js";
import { clearSession, getCurrentUser, getToken, setCurrentUser, setToken } from "../utils/storage.js";
import { createMockUser, loginWithMockCredentials } from "../mock/mock-client.js";
import { clearMockSession, initMockStore } from "../mock/mock-store.js";

export async function login(credentials) {
  initMockStore();
  const user = loginWithMockCredentials(credentials);
  const token = `mock-token-${user.role}-${user.id}`;
  setToken(token);
  setCurrentUser(user);
  return user;
}

export async function signup(payload) {
  initMockStore();
  return createMockUser(payload);
}

export function logout() {
  clearSession();
  clearMockSession();
  window.location.href = APP_CONFIG.LOGIN_PAGE;
}

export function isAuthenticated() {
  return Boolean(getToken() && getCurrentUser());
}

export function getLoggedInUser() {
  return getCurrentUser();
}
