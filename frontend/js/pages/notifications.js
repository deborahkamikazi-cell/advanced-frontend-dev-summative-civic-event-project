import { enforcePageAccess } from "../auth/auth-guard.js";
import { loadPublicShell, updateNotificationShell } from "./_shared.js";
import { setEmptyState } from "../utils/ui.js";
import { escapeHtml, loadUserData, runUserAction, sectionHeader } from "./user-ui.js";
import { showError, showSuccess } from "../utils/notifications.js";
import { listNotifications } from "../services/notifications.service.js";
import {
  isNotificationRead,
  markAllNotificationsReadLocal,
  markNotificationReadLocal,
  normalizeNotification,
  NOTIFICATIONS_READ_EVENT
} from "../utils/notification-state.js";

let notificationItems = [];
let activeType = "All";

function renderNotifications() {
  const notifications = notificationItems.filter((item) => activeType === "All" || item.type === activeType);
  if (!notifications.length) {
    setEmptyState("#notifications-feed", "No notifications in this category.");
    return;
  }
  $("#notifications-feed").html(`
    <div class="ce-card divide-y">
      ${notifications.map((item) => {
        const read = isNotificationRead(item);
        return `
          <a href="${escapeHtml(item.related_url)}" class="flex gap-3 p-4 hover:bg-slate-50 notification-item" data-notification-id="${escapeHtml(item.id)}">
            <span class="mt-2 h-2 w-2 rounded-full ${read ? "bg-slate-300" : "bg-royal"}" title="${read ? "Read" : "Unread"}"></span>
            <span class="flex-1">
              <b class="text-sm">${escapeHtml(item.title)}</b>
              <span class="rounded-full bg-amber/20 px-2 py-0.5 text-xs font-medium text-amber-800">${escapeHtml(item.type)}</span><br />
              <span class="text-sm text-slate-600">${escapeHtml(item.message)}</span>
            </span>
            <span class="text-xs text-slate-500">${escapeHtml(item.created_label)}</span>
          </a>
        `;
      }).join("")}
    </div>
  `);
}

if (enforcePageAccess()) {
  await loadPublicShell("../../components");
  await loadUserData("#notifications-list", async () => {
    const response = await listNotifications();
    notificationItems = response.data.map(normalizeNotification).filter(Boolean);
    updateNotificationShell(notificationItems);
    $("#notifications-list").html(`
      ${sectionHeader("Notifications", "Read status is saved in this browser for your account, not on the server.", '<button id="mark-all-read-btn" class="ce-btn-secondary">Mark all as read</button>')}
      <div class="mb-4 flex flex-wrap gap-2 text-sm">
        ${["All", "Event", "Announcement", "Promo"].map((type) => `<button class="notification-filter rounded-full px-3 py-1 ${activeType === type ? "bg-navy text-white" : "border border-slate-200 bg-white"}" data-type="${type}">${type}</button>`).join("")}
      </div>
      <section id="notifications-feed"></section>
    `);
    renderNotifications();
  });
}

window.addEventListener(NOTIFICATIONS_READ_EVENT, renderNotifications);

$(document).on("click", ".notification-filter", (event) => {
  $(".notification-filter").removeClass("bg-navy text-white").addClass("bg-white border border-slate-200");
  const $target = $(event.currentTarget);
  $target.removeClass("bg-white border border-slate-200").addClass("bg-navy text-white");
  activeType = $target.data("type");
  renderNotifications();
});

$(document).on("click", "#mark-all-read-btn", (event) => {
  runUserAction(event.currentTarget, async () => {
    markAllNotificationsReadLocal(notificationItems.map((item) => item.id));
    showSuccess("All notifications marked as read in this browser.");
  });
});

$(document).on("click", ".notification-item", (event) => {
  try {
    markNotificationReadLocal($(event.currentTarget).attr("data-notification-id"));
  } catch (error) {
    event.preventDefault();
    showError(`Unable to save notification read status: ${error.message}`);
  }
});
