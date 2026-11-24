import { APP_CONFIG } from "../config/config.js";
import { getCurrentUser } from "../utils/storage.js";

/**
 * Frontend role guard for UX:
 * Blocks navigation to pages that require specific roles.
 * Backend authorization remains the security source of truth.
 */
export function requireRole(allowedRoles = []) {
  const user = getCurrentUser();
  if (!user || !allowedRoles.includes(user.role)) {
    window.location.href = APP_CONFIG.DEFAULT_USER_PAGE;
    return false;
  }
  return true;
}
