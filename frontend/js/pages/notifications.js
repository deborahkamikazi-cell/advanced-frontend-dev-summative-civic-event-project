import { enforcePageAccess } from "../auth/auth-guard.js";
import { getUserNotifications } from "../mock/mock-client.js";
import { loadPublicShell } from "./_shared.js";
import { setEmptyState, setErrorState, setLoadingState } from "../utils/ui.js";
import { sectionHeader } from "./user-ui.js";
import { showSuccess } from "../utils/notifications.js";
import { listNotifications } from "../services/notifications.service.js";
import {
  isNotificationRead,
  markAllNotificationsReadLocal,
  markNotificationReadLocal,
  normalizeNotification
} from "../utils/notification-state.js";

let notificationItems = [];

function notificationBadge(type) {
  return `<span class="rounded-full bg-amber/20 px-2 py-0.5 text-xs font-medium text-amber-800">${type}</span>`;
}

function renderNotifications(type = "All") {
  const notifications = notificationItems
    .filter((item) => type === "All" || item.type === type);

  if (!notifications.length) {
    setEmptyState("#notifications-feed", "No notifications in this category.");
    return;
  }

  $("#notifications-feed").html(`
    <div class="ce-card divide-y">
      ${notifications.map((item) => `
        <a href="${item.related_url}" class="flex gap-3 p-4 hover:bg-slate-50 notification-item" data-notification-id="${item.id}">
          <span class="mt-2 h-2 w-2 rounded-full ${item.read ? "bg-slate-300" : "bg-royal"}" title="${item.read ? "Read" : "Unread"}"></span>
          <span class="flex-1">
            <b class="text-sm">${item.title}</b> ${notificationBadge(item.type)}<br />
            <span class="text-sm text-slate-600">${item.message}</span>
          </span>
          <span class="text-xs text-slate-500">${item.created_label}</span>
        </a>
      `).join("")}
    </div>
  `);
}

async function loadNotifications() {
  try {
    const response = await listNotifications();
    notificationItems = (response?.data || [])
      .map(normalizeNotification)
      .filter(Boolean)
      .map((item) => ({ ...item, read: isNotificationRead(item) }));
  } catch {
    notificationItems = getUserNotifications()
      .map(normalizeNotification)
      .filter(Boolean)
      .map((item) => ({ ...item, read: isNotificationRead(item) }));
  }
}

if (enforcePageAccess()) {
  await loadPublicShell("../../components");
  setLoadingState("#notifications-list", true);
  try {
    $("#notifications-list").html(`
      ${sectionHeader("Notifications", "Your inbox.", '<button id="mark-all-read-btn" class="ce-btn-secondary">Mark all as read</button>')}
      <div class="mb-4 flex gap-2 text-sm">
        ${["All", "Event", "Announcement", "Promo"].map((type, index) => `<button class="notification-filter px-3 py-1 rounded-full ${index === 0 ? "bg-navy text-white" : "bg-white border border-slate-200"}" data-type="${type}">${type}</button>`).join("")}
      </div>
      <section id="notifications-feed"></section>
    `);
    await loadNotifications();
    renderNotifications();
  } catch (error) {
    setErrorState("#notifications-list", error.message);
  }
}

$(document).on("click", ".notification-filter", (event) => {
  $(".notification-filter").removeClass("bg-navy text-white").addClass("bg-white border border-slate-200");
  const $target = $(event.currentTarget);
  $target.removeClass("bg-white border border-slate-200").addClass("bg-navy text-white");
  renderNotifications($target.data("type"));
});

$(document).on("click", "#mark-all-read-btn", () => {
  markAllNotificationsReadLocal(notificationItems.map((item) => item.id));
  notificationItems = notificationItems.map((item) => ({ ...item, read: true }));
  showSuccess("All notifications marked as read.");
  const activeType = $(".notification-filter.bg-navy").data("type") || "All";
  renderNotifications(activeType);
});

$(document).on("click", ".notification-item", (event) => {
  const notificationId = $(event.currentTarget).data("notificationId");
  markNotificationReadLocal(notificationId);
  notificationItems = notificationItems.map((item) => item.id === notificationId ? { ...item, read: true } : item);
});
