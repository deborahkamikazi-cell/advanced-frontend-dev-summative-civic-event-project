import { APP_CONFIG } from "../config/config.js";
import { getCurrentUser } from "../utils/storage.js";
import { loadComponent } from "../utils/ui.js";

export async function loadPublicShell(componentBasePath) {
  await loadComponent("#navbar-slot", `${componentBasePath}/navbar.html`);
  await loadComponent("#footer-slot", `${componentBasePath}/footer.html`);
}

export async function loadAdminShell(componentBasePath) {
  await loadPublicShell(componentBasePath);
  await loadComponent("#admin-sidebar-slot", `${componentBasePath}/admin-sidebar.html`);
}

export function redirectAfterLogin(user) {
  if (user.role === "admin") {
    window.location.href = APP_CONFIG.DEFAULT_ADMIN_PAGE;
    return;
  }
  window.location.href = APP_CONFIG.DEFAULT_USER_PAGE;
}

export function logoutIfInactive(user) {
  if (user && user.is_active === false) {
    sessionStorage.clear();
    window.location.href = APP_CONFIG.LOGIN_PAGE;
  }
}

export function getRoleSafe() {
  return getCurrentUser()?.role || "user";
}
