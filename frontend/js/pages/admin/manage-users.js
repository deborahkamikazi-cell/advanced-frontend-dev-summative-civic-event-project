import { enforcePageAccess } from "../../auth/auth-guard.js";
import { disableUser, enableUser, listUsers } from "../../services/users.service.js";
import { loadAdminShell } from "../_shared.js";
import { setErrorState, setLoadingState } from "../../utils/ui.js";
import { showError, showSuccess } from "../../utils/notifications.js";

async function renderUsers() {
  setLoadingState("#manage-users-list", true);
  try {
    const response = await listUsers();
    const users = response?.data || [];
    $("#manage-users-list").html(users.map((user) => `
      <article class="mb-2 flex items-center justify-between rounded border bg-white p-3">
        <div>
          <p class="font-medium">${user.full_name}</p>
          <p class="text-xs text-gray-500">${user.email}</p>
        </div>
        <div class="flex gap-2">
          <button class="toggle-user rounded border px-2 py-1 text-xs" data-id="${user.id}" data-active="${user.is_active}">
            ${user.is_active ? "Disable" : "Enable"}
          </button>
        </div>
      </article>
    `).join(""));
  } catch (error) {
    setErrorState("#manage-users-list", error.message);
  }
}

if (enforcePageAccess({ adminOnly: true })) {
  await loadAdminShell("../../../components");
  await renderUsers();
}

$(document).on("click", ".toggle-user", async (event) => {
  const id = $(event.currentTarget).data("id");
  const isActive = String($(event.currentTarget).data("active")) === "true";
  try {
    if (isActive) {
      await disableUser(id);
      showSuccess("User disabled.");
    } else {
      await enableUser(id);
      showSuccess("User enabled.");
    }
    await renderUsers();
  } catch (error) {
    showError(error.message);
  }
});
