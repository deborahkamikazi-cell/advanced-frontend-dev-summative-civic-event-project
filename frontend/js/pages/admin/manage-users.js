import { enforcePageAccess } from "../../auth/auth-guard.js";
import { loadAdminShell } from "../_shared.js";
import { setErrorState, setLoadingState } from "../../utils/ui.js";
import { showError, showSuccess } from "../../utils/notifications.js";
import { getAllUsers, setUserActive } from "../../mock/mock-client.js";
import { adminPageHeader, dataRow, statusBadge, tableMarkup } from "./admin-ui.js";

async function renderUsers() {
  setLoadingState("#manage-users-list", true);
  try {
    const users = getAllUsers();
    const rows = users.map((user) => dataRow([
      user.full_name,
      user.email,
      statusBadge(user.is_active ? "Active" : "Disabled", user.is_active ? "green" : "red"),
      new Date(user.created_at).toLocaleDateString(),
      `
        <button class="toggle-user font-medium ${user.is_active ? "text-red-600" : "text-royal"}" data-id="${user.id}" data-active="${user.is_active}">
          ${user.is_active ? "Disable" : "Enable"}
        </button>
      `
    ])).join("");

    $("#manage-users-list").html(`
      ${adminPageHeader("User Management", "Roles are fixed and cannot be edited.")}
      ${tableMarkup(["Full name", "Email", "Status", "Registered", "Actions"], rows)}
    `);
  } catch (error) {
    setErrorState("#manage-users-list", error.message);
  }
}

if (enforcePageAccess({ adminOnly: true })) {
  await loadAdminShell("../../../components", { activeAdminNav: "users" });
  await renderUsers();
}

$(document).on("click", ".toggle-user", async (event) => {
  const id = $(event.currentTarget).data("id");
  const isActive = String($(event.currentTarget).data("active")) === "true";
  try {
    setUserActive(id, !isActive);
    showSuccess(isActive ? "User disabled." : "User enabled.");
    await renderUsers();
  } catch (error) {
    showError(error.message);
  }
});
