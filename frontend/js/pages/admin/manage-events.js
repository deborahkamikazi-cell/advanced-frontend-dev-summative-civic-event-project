import { enforcePageAccess } from "../../auth/auth-guard.js";
import { loadAdminShell } from "../_shared.js";
import { setErrorState, setLoadingState } from "../../utils/ui.js";
import { validateFile } from "../../utils/validation.js";
import { openConfirmModal, showError, showSuccess } from "../../utils/notifications.js";
import { createAdminEvent, deleteAdminEvent, getAllEvents, getEventById, setEventPublished, updateAdminEvent } from "../../mock/mock-client.js";
import { adminPageHeader, dataRow, formatDateLabel, formatDateTimeForInput, statusBadge, tableMarkup } from "./admin-ui.js";
import { getLocationParam, isPathPage, withIdParam } from "../../utils/route.js";

function isListPage() {
  return isPathPage("manage-events");
}

function isFormPage() {
  return isPathPage("event-form");
}

function renderEventsTable() {
  const events = getAllEvents();
  const rows = events.map((event) => dataRow([
    event.title,
    event.location,
    formatDateLabel(event.starts_at),
    statusBadge(event.published ? "Published" : "Draft", event.published ? "green" : "amber"),
    `
      <button class="event-status-toggle mr-3 font-medium text-slate-600" data-id="${event.id}" data-next="${!event.published}">
        ${event.published ? "Unpublish" : "Publish"}
      </button>
      <a href="${withIdParam("/pages/admin/event-form.html", event.id)}" class="mr-3 font-medium text-royal">Edit</a>
      <button class="event-delete-btn font-medium text-red-600" data-id="${event.id}">Delete</button>
    `
  ])).join("");

  $("#manage-events-list").html(`
    ${adminPageHeader("Events Management", "", '<a href="/pages/admin/event-form.html" class="ce-btn-primary">Create Event</a>')}
    ${tableMarkup(["Title", "Location", "Start date", "Status", "Actions"], rows)}
  `);
}

function renderImagePreview(file) {
  const $preview = $("#event-image-preview");
  if (!file || !$preview.length) return;
  const objectUrl = URL.createObjectURL(file);
  $preview.attr("src", objectUrl).removeClass("hidden");
}

function hydrateEventForm() {
  const eventId = getLocationParam("id");
  const event = eventId ? getEventById(eventId) : null;
  if (!event) return;

  $("#event-form-title").text("Edit Event");
  $("#title").val(event.title);
  $("#description").val(event.description);
  $("#location").val(event.location);
  $("#starts_at").val(formatDateTimeForInput(event.starts_at));
  $("#ends_at").val(formatDateTimeForInput(event.ends_at));
  $("#published").prop("checked", Boolean(event.published));
  $("#theme").val(event.image_theme || 210);
}

if (enforcePageAccess({ adminOnly: true })) {
  await loadAdminShell("../../../components", { activeAdminNav: "events" });
  if (isListPage()) {
    setLoadingState("#manage-events-list", true);
    try {
      renderEventsTable();
    } catch (error) {
      setErrorState("#manage-events-list", error.message);
    }
  }
  if (isFormPage()) hydrateEventForm();
}

$("#image").on("change", (event) => {
  renderImagePreview(event.currentTarget.files?.[0]);
});

$("#event-form").on("submit", (event) => {
  event.preventDefault();
  const file = $("#image")[0]?.files?.[0];

  if (file) {
    const fileValidation = validateFile(file, ["jpg", "jpeg", "png", "gif"], 2 * 1024 * 1024);
    if (!fileValidation.isValid) {
      showError(fileValidation.message);
      return;
    }
  }

  try {
    const payload = {
      title: $("#title").val().trim(),
      description: $("#description").val().trim(),
      location: $("#location").val().trim(),
      starts_at: $("#starts_at").val(),
      ends_at: $("#ends_at").val(),
      published: $("#published").is(":checked"),
      image_theme: Number($("#theme").val() || 210)
    };

    if (!payload.title || !payload.location || !payload.starts_at || !payload.ends_at) {
      showError("Please complete all required fields.");
      return;
    }

    const eventId = getLocationParam("id");
    if (eventId) {
      updateAdminEvent(eventId, payload);
      showSuccess("Event updated successfully.");
    } else {
      createAdminEvent(payload);
      showSuccess("Event created successfully.");
    }
    window.location.href = "/pages/admin/manage-events.html";
  } catch (error) {
    showError(error.message);
  }
});

$(document).on("click", ".event-delete-btn", (event) => {
  const eventId = $(event.currentTarget).data("id");
  openConfirmModal({
    title: "Delete event?",
    message: "This will remove the event and related registrations.",
    confirmLabel: "Delete",
    onConfirm: () => {
      deleteAdminEvent(eventId);
      showSuccess("Event deleted.");
      renderEventsTable();
    }
  });
});

$(document).on("click", ".event-status-toggle", (event) => {
  const eventId = $(event.currentTarget).data("id");
  const nextState = String($(event.currentTarget).data("next")) === "true";
  setEventPublished(eventId, nextState);
  renderEventsTable();
});
