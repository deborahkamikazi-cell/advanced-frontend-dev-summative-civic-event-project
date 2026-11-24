import { APP_CONFIG } from "../config/config.js";
import { login as loginRequest, signup as signupRequest } from "../services/auth.service.js";
import { clearAuthSession, getAuthSession, isSessionAuthenticated, setAuthSession } from "./auth-state.js";

export async function login(credentials) {
  const response = await loginRequest(credentials);
  const token = response?.data?.token;
  const user = response?.data?.user;

  if (!token || !user) {
    throw new Error("Invalid login response format.");
  }

  setAuthSession({ token, user });
  return user;
}

export async function signup(payload) {
  return signupRequest(payload);
}

export function logout() {
  clearAuthSession();
  window.location.href = APP_CONFIG.LOGIN_PAGE;
}

export function isAuthenticated() {
  return isSessionAuthenticated();
}

export function getLoggedInUser() {
  return getAuthSession().user;
}
