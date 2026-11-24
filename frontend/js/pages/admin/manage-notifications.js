import { enforcePageAccess } from "../../auth/auth-guard.js";
import { loadAdminShell } from "../_shared.js";
import { setErrorState, setLoadingState } from "../../utils/ui.js";
import { openConfirmModal, showError, showSuccess } from "../../utils/notifications.js";
import { createAdminNotification, deleteAdminNotification, getAllNotifications } from "../../mock/mock-client.js";
import { adminPageHeader, dataRow, statusBadge, tableMarkup } from "./admin-ui.js";

async function renderNotifications() {
  setLoadingState("#manage-notifications-list", true);
  try {
    const items = getAllNotifications();
    const rows = items.map((item) => dataRow([
      statusBadge(item.type, "amber"),
      item.title,
      item.message,
      item.created_label,
      `<button class="delete-notification font-medium text-red-600" data-id="${item.id}">Delete</button>`
    ])).join("");

    $("#manage-notifications-list").html(`
      ${adminPageHeader("Notifications")}
      <form id="admin-notification-form" class="ce-card mb-4 grid gap-3 p-4 md:grid-cols-4">
        <input id="notification-title" class="ce-input" type="text" placeholder="Title" required />
        <input id="notification-message" class="ce-input" type="text" placeholder="Message" required />
        <select id="notification-type" class="ce-input">
          <option>Event</option>
          <option>Announcement</option>
          <option>Promo</option>
          <option>System</option>
        </select>
        <button class="ce-btn-primary">Create notification</button>
      </form>
      ${tableMarkup(["Type", "Title", "Message", "Created", "Action"], rows)}
    `);
  } catch (error) {
    setErrorState("#manage-notifications-list", error.message);
  }
}

if (enforcePageAccess({ adminOnly: true })) {
  await loadAdminShell("../../../components", { activeAdminNav: "notifications" });
  await renderNotifications();
}

$(document).on("click", ".delete-notification", async (event) => {
  const id = $(event.currentTarget).data("id");
  try {
    openConfirmModal({
      title: "Delete notification?",
      message: "This notification will be removed permanently.",
      confirmLabel: "Delete",
      onConfirm: async () => {
        deleteAdminNotification(id);
        showSuccess("Notification deleted.");
        await renderNotifications();
      }
    });
  } catch (error) {
    showError(error.message);
  }
});

$(document).on("submit", "#admin-notification-form", async (event) => {
  event.preventDefault();
  const title = $("#notification-title").val().trim();
  const message = $("#notification-message").val().trim();
  const type = $("#notification-type").val();
  if (!title || !message) {
    showError("Title and message are required.");
    return;
  }

  createAdminNotification({ title, message, type, user_id: "u1" });
  showSuccess("Notification created.");
  await renderNotifications();
});
