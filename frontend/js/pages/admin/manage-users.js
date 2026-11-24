import { enforcePageAccess } from "../../auth/auth-guard.js";
import { loadAdminShell } from "../_shared.js";
import { showSuccess } from "../../utils/notifications.js";
import { disableUser, enableUser, listUsers } from "../../services/users.service.js";
import { ADMIN_PAGE_SIZE, adminPageHeader, dataRow, escapeHtml, loadAdminData, paginationMarkup, runAdminAction, statusBadge, tableMarkup } from "./admin-ui.js";

let page = 1;

async function renderUsers() {
    const { data: users } = await listUsers({ page, limit: ADMIN_PAGE_SIZE });
    const rows = users.map((user) => dataRow([
      escapeHtml(user.full_name),
      escapeHtml(user.email),
      statusBadge(user.is_active ? "Active" : "Disabled", user.is_active ? "green" : "red"),
      new Date(user.created_at).toLocaleDateString(),
      `
        <button class="toggle-user font-medium ${user.is_active ? "text-red-600" : "text-royal"}" data-id="${escapeHtml(user.id)}" data-active="${user.is_active}">
          ${user.is_active ? "Disable" : "Enable"}
        </button>
      `
    ])).join("");

    $("#manage-users-list").html(`
      ${adminPageHeader("User Management", "Roles are fixed and cannot be edited.")}
      ${tableMarkup(["Full name", "Email", "Status", "Registered", "Actions"], rows)}
      ${paginationMarkup(page, users.length)}
    `);
}

if (enforcePageAccess({ adminOnly: true })) {
  await loadAdminShell("../../../components", { activeAdminNav: "users" });
  await loadAdminData("#manage-users-list", renderUsers);
}

$(document).on("click", ".toggle-user", async (event) => {
  const id = $(event.currentTarget).data("id");
  const isActive = String($(event.currentTarget).data("active")) === "true";
  runAdminAction(event.currentTarget, async () => {
    await (isActive ? disableUser : enableUser)(id);
    showSuccess(isActive ? "User disabled." : "User enabled.");
    await loadAdminData("#manage-users-list", renderUsers);
  });
});

$(document).on("click", ".admin-page-button", (event) => {
  page = Number($(event.currentTarget).attr("data-page"));
  loadAdminData("#manage-users-list", renderUsers);
});
