import { enforcePageAccess } from "../../auth/auth-guard.js";
import { loadAdminShell } from "../_shared.js";
import { validateFile } from "../../utils/validation.js";
import { openConfirmModal, showError, showSuccess } from "../../utils/notifications.js";
import { createEvent, deleteEvent, getEventById, listEvents, updateEvent } from "../../services/events.service.js";
import { getEventAttendees } from "../../services/registrations.service.js";
import { adminPageHeader, dataRow, escapeHtml, formatDateLabel, formatDateTimeForInput, loadAdminData, runAdminAction, statusBadge, tableMarkup } from "./admin-ui.js";
import { getLocationParam, isPathPage, withIdParam } from "../../utils/route.js";

let previewUrl = null;
let formReady = false;

async function renderEventsTable() {
  const { data: events } = await listEvents();
  const rows = events.map((event) => dataRow([
    escapeHtml(event.title),
    escapeHtml(event.location),
    escapeHtml(formatDateLabel(event.starts_at)),
    statusBadge(event.published ? "Published" : "Draft", event.published ? "green" : "amber"),
    `<button class="event-attendees-btn mr-3 font-medium text-royal" data-id="${escapeHtml(event.id)}">Registrants</button>
     <a href="${withIdParam("/pages/admin/event-form.html", event.id)}" class="mr-3 font-medium text-royal">Edit</a>
     <button class="event-delete-btn font-medium text-red-600" data-id="${escapeHtml(event.id)}">Delete</button>`
  ])).join("");
  $("#manage-events-list").html(`
    ${adminPageHeader("Events Management", "Events are published on creation. Publish/unpublish controls are not supported by the API.", '<a href="/pages/admin/event-form.html" class="ce-btn-primary">Create Event</a>')}
    ${tableMarkup(["Title", "Location", "Start date", "Status", "Actions"], rows)}
    <section id="event-attendees" class="mt-4" aria-live="polite"></section>
  `);
}

async function hydrateEventForm() {
  const eventId = getLocationParam("id");
  if (eventId) {
    const { data: event } = await getEventById(eventId);
    $("#event-form-title").text("Edit Event");
    for (const field of ["title", "description", "location"]) $(`#${field}`).val(event[field]);
    $("#starts_at").val(formatDateTimeForInput(event.starts_at));
    $("#ends_at").val(formatDateTimeForInput(event.ends_at));
    if (event.metadata?.image_url) $("#event-image-preview").attr("src", event.metadata.image_url).removeClass("hidden");
  }
  formReady = true;
  $("#event-form button[type=submit]").prop("disabled", false);
}

if (enforcePageAccess({ adminOnly: true })) {
  await loadAdminShell("../../../components", { activeAdminNav: "events" });
  if (isPathPage("manage-events")) await loadAdminData("#manage-events-list", renderEventsTable);
  if (isPathPage("event-form")) {
    $("#event-form button[type=submit]").prop("disabled", true);
    try {
      await hydrateEventForm();
    } catch (error) {
      showError(error.message);
    }
  }
}

$("#image").on("change", (event) => {
  const file = event.currentTarget.files?.[0];
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = null;
  $("#event-image-preview").removeAttr("src").addClass("hidden");
  if (!file) return;
  const validation = validateFile(file, ["jpg", "jpeg", "png", "gif"], 2 * 1024 * 1024);
  if (!validation.isValid) {
    event.currentTarget.value = "";
    showError(validation.message);
    return;
  }
  previewUrl = URL.createObjectURL(file);
  $("#event-image-preview").attr("src", previewUrl).removeClass("hidden");
});
window.addEventListener("pagehide", () => {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
});

$("#event-form").on("submit", (event) => {
  event.preventDefault();
  if (!formReady) {
    showError("The form has not loaded. Please reload this page.");
    return;
  }
  const payload = new FormData();
  for (const field of ["title", "description", "location", "starts_at", "ends_at"]) {
    payload.append(field, $(`#${field}`).val().trim());
  }
  if (!payload.get("title") || !payload.get("location") || !payload.get("starts_at") || !payload.get("ends_at")) {
    showError("Please complete all required fields.");
    return;
  }
  const start = new Date(payload.get("starts_at"));
  const end = new Date(payload.get("ends_at"));
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime()) || end <= start) {
    showError("End date must be after the start date.");
    return;
  }
  payload.set("starts_at", start.toISOString());
  payload.set("ends_at", end.toISOString());
  const file = $("#image")[0]?.files?.[0];
  if (file) {
    const validation = validateFile(file, ["jpg", "jpeg", "png", "gif"], 2 * 1024 * 1024);
    if (!validation.isValid) {
      showError(validation.message);
      return;
    }
    payload.append("image", file);
  }
  runAdminAction($(event.currentTarget).find("[type=submit]"), async () => {
    const id = getLocationParam("id");
    if (id) await updateEvent(id, payload);
    else await createEvent(payload);
    window.location.href = "/pages/admin/manage-events.html";
  });
});

$(document).on("click", ".event-delete-btn", (event) => {
  const button = event.currentTarget;
  const id = $(button).attr("data-id");
  openConfirmModal({
    title: "Delete event?",
    message: "This permanently deletes the event. The API may reject deletion when registrations exist.",
    confirmLabel: "Delete",
    onConfirm: () => runAdminAction(button, async () => {
      await deleteEvent(id);
      showSuccess("Event deleted.");
      await loadAdminData("#manage-events-list", renderEventsTable);
    })
  });
});

$(document).on("click", ".event-attendees-btn", (event) => {
  runAdminAction(event.currentTarget, async () => {
    const { data } = await getEventAttendees($(event.currentTarget).attr("data-id"));
    $("#event-attendees").html(`<h2 class="mb-3 font-semibold">Event registrants</h2>${tableMarkup(
      ["Full name", "Email", "Status"],
      data.map((item) => dataRow([escapeHtml(item.full_name), escapeHtml(item.email), escapeHtml(item.status)])).join("")
    )}`);
  });
});
