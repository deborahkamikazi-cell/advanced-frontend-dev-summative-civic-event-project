import { login as loginRequest, signup as signupRequest } from "../services/auth.service.js";
import { APP_CONFIG } from "../config/config.js";
import { clearSession, getCurrentUser, getToken, setCurrentUser, setToken } from "../utils/storage.js";

export async function login(credentials) {
  const response = await loginRequest(credentials);
  const token = response?.data?.token;
  const user = response?.data?.user;

  if (!token || !user) {
    throw new Error("Invalid login response format.");
  }

  setToken(token);
  setCurrentUser(user);
  return user;
}

export async function signup(payload) {
  return signupRequest(payload);
}

export function logout() {
  clearSession();
  window.location.href = APP_CONFIG.LOGIN_PAGE;
}

export function isAuthenticated() {
  return Boolean(getToken() && getCurrentUser());
}

export function getLoggedInUser() {
  return getCurrentUser();
}
