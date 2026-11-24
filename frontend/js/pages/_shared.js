import { APP_CONFIG } from "../config/config.js";
import { getCurrentUser } from "../utils/storage.js";
import { loadComponent } from "../utils/ui.js";
import { logout } from "../auth/auth.js";
import { initMockStore } from "../mock/mock-store.js";
import { getUserNotifications } from "../mock/mock-client.js";
import { showError } from "../utils/notifications.js";

const DEFAULT_NOTIFICATIONS = [];

function ensureRoot(id) {
  if (!document.getElementById(id)) {
    const root = document.createElement("div");
    root.id = id;
    document.body.appendChild(root);
  }
}

function setActiveNavLink(navKey) {
  if (!navKey) return;
  $(`[data-nav-key="${navKey}"]`).addClass("bg-slate-100 text-navy");
}

function setActiveAdminNavLink(adminNavKey) {
  if (!adminNavKey) return;
  $(`[data-admin-nav-key="${adminNavKey}"]`).addClass("bg-royal font-semibold");
}

function buildNotificationList(items = DEFAULT_NOTIFICATIONS) {
  return items.map((item) => `
    <a href="${item.related_url || item.href}" class="block rounded-lg p-3 text-sm hover:bg-slate-50">
      <div class="flex items-start gap-2">
        <span class="mt-1 h-2 w-2 rounded-full ${item.unread ? "bg-royal" : "bg-slate-300"}"></span>
        <span>
          <b>${item.title}</b><br />
          <span class="text-slate-500">${item.message}</span>
        </span>
      </div>
    </a>
  `).join("");
}

function bindSharedEvents() {
  $(document).off("click.shared-ui");
  $(document).on("click.shared-ui", "#mobile-menu-toggle", () => $("#mobile-menu").toggleClass("hidden"));
  $(document).on("click.shared-ui", "#profile-menu-toggle", () => {
    const $menu = $("#profile-menu");
    const isExpanded = $menu.hasClass("hidden");
    $menu.toggleClass("hidden");
    $("#profile-menu-toggle").attr("aria-expanded", String(isExpanded));
  });
  $(document).on("click.shared-ui", (event) => {
    if (!$(event.target).closest("#profile-menu, #profile-menu-toggle").length) {
      $("#profile-menu").addClass("hidden");
      $("#profile-menu-toggle").attr("aria-expanded", "false");
    }
  });
  $(document).on("click.shared-ui", "#notification-toggle", () => $("#notification-drawer-overlay").removeClass("hidden"));
  $(document).on("click.shared-ui", "#notification-drawer-close", () => $("#notification-drawer-overlay").addClass("hidden"));
  $(document).on("click.shared-ui", "#notification-drawer-panel a", () => $("#notification-drawer-overlay").addClass("hidden"));
  $(document).on("click.shared-ui", "#notification-drawer-overlay", (event) => {
    if (event.target.id === "notification-drawer-overlay") {
      $("#notification-drawer-overlay").addClass("hidden");
    }
  });
  $(document).on("click.shared-ui", "#admin-sidebar-toggle", () => {
    $("#admin-sidebar").toggleClass("-translate-x-full");
    $("#admin-sidebar-scrim").toggleClass("hidden");
  });
  $(document).on("click.shared-ui", "#admin-sidebar-scrim", () => {
    $("#admin-sidebar").addClass("-translate-x-full");
    $("#admin-sidebar-scrim").addClass("hidden");
  });
  $(document).on("click.shared-ui", "#logout-button", () => logout());
}

async function loadGlobalComponents(componentBasePath) {
  ensureRoot("notification-drawer-root");
  ensureRoot("global-modal-root");
  ensureRoot("global-toasts-root");

  await loadComponent("#notification-drawer-root", `${componentBasePath}/notification-drawer.html`);
  await loadComponent("#global-modal-root", `${componentBasePath}/modal.html`);
  await loadComponent("#global-toasts-root", `${componentBasePath}/toasts.html`);
}

export async function loadPublicShell(componentBasePath, options = {}) {
  const { activeNav = "", notifications = null } = options;
  initMockStore();
  await loadComponent("#navbar-slot", `${componentBasePath}/navbar.html`);
  await loadComponent("#footer-slot", `${componentBasePath}/footer.html`);
  await loadGlobalComponents(componentBasePath);

  const currentUser = getCurrentUser();
  if (currentUser?.role === "admin") {
    $("[data-admin-link]").removeClass("hidden");
  }

  const initials = currentUser?.full_name?.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase() || "AU";
  $("#profile-menu-toggle").text(initials);
  setActiveNavLink(activeNav);

  const notificationItems = notifications || getUserNotifications().map((item) => ({ ...item, unread: !item.read }));
  $("#notification-drawer-list").html(buildNotificationList(notificationItems));
  const unreadCount = notificationItems.filter((item) => item.unread).length;
  $("#notification-unread-badge").text(String(unreadCount));
  bindSharedEvents();

  const deniedMessage = sessionStorage.getItem("civicevents_access_denied");
  if (deniedMessage) {
    showError(deniedMessage);
    sessionStorage.removeItem("civicevents_access_denied");
  }
}

export async function loadAdminShell(componentBasePath, options = {}) {
  const { activeAdminNav = "" } = options;
  initMockStore();
  await loadComponent("#footer-slot", `${componentBasePath}/footer.html`);
  await loadGlobalComponents(componentBasePath);
  await loadComponent("#admin-topbar-slot", `${componentBasePath}/admin-topbar.html`);
  await loadComponent("#admin-sidebar-slot", `${componentBasePath}/admin-sidebar.html`);
  setActiveAdminNavLink(activeAdminNav);
  bindSharedEvents();

  const deniedMessage = sessionStorage.getItem("civicevents_access_denied");
  if (deniedMessage) {
    showError(deniedMessage);
    sessionStorage.removeItem("civicevents_access_denied");
  }
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
