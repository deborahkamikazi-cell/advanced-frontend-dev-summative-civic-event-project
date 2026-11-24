import { APP_CONFIG } from "../config/config.js";
import { isAuthenticated } from "./auth.js";
import { requireRole } from "./role-guard.js";

/**
 * Authentication guard:
 * - Redirects unauthenticated users to login.
 * - Optionally enforces admin role for admin pages.
 */
export function enforcePageAccess({ adminOnly = false } = {}) {
  if (!isAuthenticated()) {
    window.location.href = APP_CONFIG.LOGIN_PAGE;
    return false;
  }

  if (adminOnly) {
    return requireRole(["admin"]);
  }

  return true;
}
