import { enforcePageAccess } from "../../auth/auth-guard.js";
import { loadAdminShell } from "../_shared.js";
import { validateFile } from "../../utils/validation.js";
import { openConfirmModal, showError, showSuccess } from "../../utils/notifications.js";
import { createAnnouncement, deleteAnnouncement, getAnnouncementById, listAnnouncements, publishAnnouncement, unpublishAnnouncement, updateAnnouncement } from "../../services/announcements.service.js";
import { ADMIN_PAGE_SIZE, adminPageHeader, dataRow, escapeHtml, loadAdminData, paginationMarkup, runAdminAction, statusBadge, tableMarkup } from "./admin-ui.js";
import { getLocationParam, isPathPage, withIdParam } from "../../utils/route.js";

let page = 1;
let formReady = false;

async function renderAnnouncementsTable() {
  const { data: items } = await listAnnouncements({ page, limit: ADMIN_PAGE_SIZE });
  const rows = items.map((item) => dataRow([
    escapeHtml(item.title),
    item.audio_url ? "Available" : "None",
    statusBadge(item.published ? "Published" : "Draft", item.published ? "green" : "amber"),
    `<button class="announcement-status-toggle mr-3 font-medium text-slate-600" data-id="${escapeHtml(item.id)}" data-next="${!item.published}">
       ${item.published ? "Unpublish" : "Publish"}
     </button>
     <a href="${withIdParam("/pages/admin/announcement-form.html", item.id)}" class="mr-3 font-medium text-royal">Edit</a>
     <button class="announcement-delete-btn font-medium text-red-600" data-id="${escapeHtml(item.id)}">Delete</button>`
  ])).join("");
  $("#manage-announcements-list").html(`
    ${adminPageHeader("Announcements", "", '<a href="/pages/admin/announcement-form.html" class="ce-btn-primary">Create announcement</a>')}
    ${tableMarkup(["Title", "Audio", "Status", "Actions"], rows)}
    ${paginationMarkup(page, items.length)}
  `);
}

async function hydrateAnnouncementForm() {
  const id = getLocationParam("id");
  $("#audio").prop("required", !id).prop("disabled", Boolean(id));
  if (id) {
    const { data: item } = await getAnnouncementById(id);
    $("#announcement-form-title").text("Edit Announcement");
    $("#title").val(item.title);
    $("#published").prop("checked", Boolean(item.published));
    $("#audio-help").text("The API cannot replace existing audio. Create a new announcement to use another recording.");
  }
  formReady = true;
  $("#announcement-form button[type=submit]").prop("disabled", false);
}

if (enforcePageAccess({ adminOnly: true })) {
  await loadAdminShell("../../../components", { activeAdminNav: "announcements" });
  if (isPathPage("manage-announcements")) await loadAdminData("#manage-announcements-list", renderAnnouncementsTable);
  if (isPathPage("announcement-form")) {
    $("#announcement-form button[type=submit]").prop("disabled", true);
    try {
      await hydrateAnnouncementForm();
    } catch (error) {
      showError(error.message);
    }
  }
}

$("#announcement-form").on("submit", (event) => {
  event.preventDefault();
  if (!formReady) {
    showError("The form has not loaded. Please reload this page.");
    return;
  }
  const id = getLocationParam("id");
  const title = $("#title").val().trim();
  const published = $("#published").is(":checked");
  if (!title) {
    showError("Announcement title is required.");
    return;
  }
  const payload = new FormData();
  payload.append("title", title);
  payload.append("published", String(published));
  if (!id) {
    const file = $("#audio")[0]?.files?.[0];
    const validation = validateFile(file, ["mp3", "wav", "m4a", "ogg"], 5 * 1024 * 1024);
    if (!validation.isValid) {
      showError(validation.message);
      return;
    }
    payload.append("audio", file);
  }
  runAdminAction($(event.currentTarget).find("[type=submit]"), async () => {
    if (id) await updateAnnouncement(id, { title, published });
    else await createAnnouncement(payload);
    window.location.href = "/pages/admin/manage-announcements.html";
  });
});

$(document).on("click", ".announcement-delete-btn", (event) => {
  const button = event.currentTarget;
  openConfirmModal({
    title: "Delete announcement?",
    message: "This announcement will be removed permanently.",
    confirmLabel: "Delete",
    onConfirm: () => runAdminAction(button, async () => {
      await deleteAnnouncement($(button).attr("data-id"));
      showSuccess("Announcement deleted.");
      await loadAdminData("#manage-announcements-list", renderAnnouncementsTable);
    })
  });
});

$(document).on("click", ".announcement-status-toggle", (event) => {
  const button = event.currentTarget;
  runAdminAction(button, async () => {
    const publish = $(button).attr("data-next") === "true";
    await (publish ? publishAnnouncement : unpublishAnnouncement)($(button).attr("data-id"));
    showSuccess(publish ? "Announcement published." : "Announcement unpublished.");
    await loadAdminData("#manage-announcements-list", renderAnnouncementsTable);
  });
});

$(document).on("click", ".admin-page-button", (event) => {
  page = Number($(event.currentTarget).attr("data-page"));
  loadAdminData("#manage-announcements-list", renderAnnouncementsTable);
});
