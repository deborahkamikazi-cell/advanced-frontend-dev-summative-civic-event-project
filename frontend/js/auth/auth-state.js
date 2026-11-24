import { clearSession, getCurrentUser, getToken, setCurrentUser, setToken } from "../utils/storage.js";

export function setAuthSession({ token, user }) {
  if (!token || !user) {
    throw new Error("Missing token or user for auth session.");
  }
  setToken(token);
  setCurrentUser(user);
}

export function getAuthSession() {
  return {
    token: getToken(),
    user: getCurrentUser()
  };
}

export function clearAuthSession() {
  clearSession();
}

export function isSessionAuthenticated() {
  const { token, user } = getAuthSession();
  return Boolean(token && user);
}
