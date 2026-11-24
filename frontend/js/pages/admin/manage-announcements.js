import { enforcePageAccess } from "../../auth/auth-guard.js";
import { loadAdminShell } from "../_shared.js";
import { setErrorState, setLoadingState } from "../../utils/ui.js";
import { validateFile } from "../../utils/validation.js";
import { openConfirmModal, showError, showSuccess } from "../../utils/notifications.js";
import { createAdminAnnouncement, deleteAdminAnnouncement, getAllAnnouncements, getAnnouncementById, setAnnouncementPublished, updateAdminAnnouncement } from "../../mock/mock-client.js";
import { adminPageHeader, dataRow, statusBadge, tableMarkup } from "./admin-ui.js";
import { getLocationParam, isPathPage, withIdParam } from "../../utils/route.js";

function isListPage() {
  return isPathPage("manage-announcements");
}

function isFormPage() {
  return isPathPage("announcement-form");
}

function renderAnnouncementsTable() {
  const items = getAllAnnouncements();
  const rows = items.map((item) => dataRow([
    item.title,
    item.duration || "-",
    item.audio_url ? "audio selected" : "none",
    statusBadge(item.published ? "Published" : "Draft", item.published ? "green" : "amber"),
    `
      <button class="announcement-status-toggle mr-3 font-medium text-slate-600" data-id="${item.id}" data-next="${!item.published}">
        ${item.published ? "Unpublish" : "Publish"}
      </button>
      <a href="${withIdParam("/pages/admin/announcement-form.html", item.id)}" class="mr-3 font-medium text-royal">Edit</a>
      <button class="announcement-delete-btn font-medium text-red-600" data-id="${item.id}">Delete</button>
    `
  ])).join("");

  $("#manage-announcements-list").html(`
    ${adminPageHeader("Announcements", "", '<a href="/pages/admin/announcement-form.html" class="ce-btn-primary">Create announcement</a>')}
    ${tableMarkup(["Title", "Duration", "Audio", "Status", "Actions"], rows)}
  `);
}

function hydrateAnnouncementForm() {
  const id = getLocationParam("id");
  const item = id ? getAnnouncementById(id) : null;
  if (!item) return;
  $("#announcement-form-title").text("Edit Announcement");
  $("#title").val(item.title);
  $("#duration").val(item.duration || "2:00");
  $("#transcript").val(item.transcript || "");
  $("#published").prop("checked", Boolean(item.published));
}

if (enforcePageAccess({ adminOnly: true })) {
  await loadAdminShell("../../../components", { activeAdminNav: "announcements" });
  if (isListPage()) {
    setLoadingState("#manage-announcements-list", true);
    try {
      renderAnnouncementsTable();
    } catch (error) {
      setErrorState("#manage-announcements-list", error.message);
    }
  }
  if (isFormPage()) hydrateAnnouncementForm();
}

$("#announcement-form").on("submit", (event) => {
  event.preventDefault();
  const file = $("#audio")[0]?.files?.[0];
  if (file) {
    const fileValidation = validateFile(file, ["mp3", "wav", "m4a", "ogg"], 5 * 1024 * 1024);
    if (!fileValidation.isValid) {
      showError(fileValidation.message);
      return;
    }
  }

  try {
    const payload = {
      title: $("#title").val().trim(),
      duration: $("#duration").val().trim() || "2:00",
      transcript: $("#transcript").val().trim(),
      audio_url: file ? URL.createObjectURL(file) : "",
      published: $("#published").is(":checked"),
      updated_at: new Date().toISOString()
    };
    if (!payload.title) {
      showError("Announcement title is required.");
      return;
    }
    const id = getLocationParam("id");
    if (id) {
      if (!payload.audio_url) delete payload.audio_url;
      updateAdminAnnouncement(id, payload);
      showSuccess("Announcement updated.");
    } else {
      createAdminAnnouncement(payload);
      showSuccess("Announcement created.");
    }
    window.location.href = "/pages/admin/manage-announcements.html";
  } catch (error) {
    showError(error.message);
  }
});

$(document).on("click", ".announcement-delete-btn", (event) => {
  const id = $(event.currentTarget).data("id");
  openConfirmModal({
    title: "Delete announcement?",
    message: "This announcement will be removed permanently.",
    confirmLabel: "Delete",
    onConfirm: () => {
      deleteAdminAnnouncement(id);
      showSuccess("Announcement deleted.");
      renderAnnouncementsTable();
    }
  });
});

$(document).on("click", ".announcement-status-toggle", (event) => {
  const id = $(event.currentTarget).data("id");
  const next = String($(event.currentTarget).data("next")) === "true";
  setAnnouncementPublished(id, next);
  renderAnnouncementsTable();
});
