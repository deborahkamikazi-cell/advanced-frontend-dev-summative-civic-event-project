import { enforcePageAccess } from "../../auth/auth-guard.js";
import { deleteNotification, listNotifications } from "../../services/notifications.service.js";
import { loadAdminShell } from "../_shared.js";
import { setErrorState, setLoadingState } from "../../utils/ui.js";
import { showError, showSuccess } from "../../utils/notifications.js";

async function renderNotifications() {
  setLoadingState("#manage-notifications-list", true);
  try {
    const response = await listNotifications();
    const items = response?.data || [];
    $("#manage-notifications-list").html(items.map((item) => `
      <article class="mb-2 flex items-start justify-between rounded border bg-white p-3">
        <div>
          <p class="font-medium">${item.title}</p>
          <p class="text-sm text-gray-600">${item.message}</p>
        </div>
        <button class="delete-notification rounded border px-2 py-1 text-xs" data-id="${item.id}">Delete</button>
      </article>
    `).join(""));
  } catch (error) {
    setErrorState("#manage-notifications-list", error.message);
  }
}

if (enforcePageAccess({ adminOnly: true })) {
  await loadAdminShell("../../../components");
  await renderNotifications();
}

$(document).on("click", ".delete-notification", async (event) => {
  const id = $(event.currentTarget).data("id");
  try {
    await deleteNotification(id);
    showSuccess("Notification deleted.");
    await renderNotifications();
  } catch (error) {
    showError(error.message);
  }
});
