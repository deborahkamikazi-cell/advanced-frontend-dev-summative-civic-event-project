import { enforcePageAccess } from "../../auth/auth-guard.js";
import { loadAdminShell } from "../_shared.js";
import { validateFile } from "../../utils/validation.js";
import { openConfirmModal, showError, showInfo, showSuccess } from "../../utils/notifications.js";
import { AudioRecorder, MAX_AUDIO_BYTES } from "../../utils/audio-recorder.js";
import { createAnnouncement, deleteAnnouncement, getAnnouncementById, listAnnouncements, publishAnnouncement, unpublishAnnouncement, updateAnnouncement } from "../../services/announcements.service.js";
import { ADMIN_PAGE_SIZE, adminPageHeader, dataRow, escapeHtml, loadAdminData, paginationMarkup, runAdminAction, statusBadge, tableMarkup } from "./admin-ui.js";
import { getLocationParam, isPathPage, withIdParam } from "../../utils/route.js";

let page = 1;
let formReady = false;
let recorder = null;
let recordedFile = null;
let previewUrl = null;
let recordingPending = false;
let recording = false;
let recordingStopping = false;
let saving = false;

function durationLabel(seconds) {
  const total = Math.floor(seconds);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}

function updateAudioControls() {
  const editing = Boolean(getLocationParam("id"));
  const busy = recordingPending || recording || recordingStopping || saving;
  $("#audio-record-start").prop("disabled", !formReady || busy || editing);
  $("#audio-record-stop").prop("disabled", !recording || recordingStopping);
  $("#audio-record-clear").prop("disabled", busy || (!recordedFile && !$("#audio")[0]?.files?.length));
  $("#audio").prop("disabled", busy || editing);
  $("#announcement-form button[type=submit]").prop("disabled", !formReady || busy);
}

function clearAudioPreview() {
  const player = $("#audio-preview")[0];
  if (player) {
    player.pause();
    player.removeAttribute("src");
    player.load();
  }
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = null;
  $("#audio-preview-container").addClass("hidden");
  $("#audio-preview-name").text("");
  $("#duration").val("");
}

function previewAudio(file, duration) {
  clearAudioPreview();
  previewUrl = URL.createObjectURL(file);
  $("#audio-preview").attr("src", previewUrl);
  $("#audio-preview-name").text(`${file.name} (${(file.size / (1024 * 1024)).toFixed(2)} MB)`);
  $("#audio-preview-container").removeClass("hidden");
  if (duration !== undefined) $("#duration").val(durationLabel(duration));
}

function recordingError(error) {
  const messages = {
    NotAllowedError: "Microphone access was denied. Allow it in your browser's site settings, or upload an audio file.",
    NotFoundError: "No microphone was found. Connect a microphone or upload an audio file.",
    NotReadableError: "The microphone is unavailable. Close other apps using it and try again."
  };
  const message = messages[error.name] || error.message || "Unable to record audio. Please try again.";
  $("#audio-record-error").text(message);
  showError(message);
}

async function finishRecording(atLimit = false) {
  if (!recorder || recordingStopping) return;
  recordingStopping = true;
  recording = false;
  updateAudioControls();
  try {
    const result = await recorder.stop();
    recordedFile = result.file;
    previewAudio(recordedFile, result.duration);
    $("#audio").prop("required", false);
    $("#audio-record-status").text(atLimit ? "Upload limit reached. Listen to your recording, then save or record again." : "Recording ready. Listen below, then click Save announcement.");
    if (atLimit) showInfo("Recording stopped at the 5 MB upload limit.");
  } catch (error) {
    recordingError(error);
  } finally {
    recorder = null;
    recordingStopping = false;
    updateAudioControls();
  }
}

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
  $("#audio-recorder").toggleClass("hidden", Boolean(id));
  $("#audio").prop("required", !id).prop("disabled", Boolean(id));
  if (id) {
    const { data: item } = await getAnnouncementById(id);
    $("#announcement-form-title").text("Edit Announcement");
    $("#title").val(item.title);
    $("#published").prop("checked", Boolean(item.published));
    $("#audio-help").text("The API cannot replace existing audio. Create a new announcement to use another recording.");
  }
  formReady = true;
  updateAudioControls();
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

$("#audio-record-start").on("click", async () => {
  if (!formReady || recorder || getLocationParam("id")) return;
  recordedFile = null;
  $("#audio").val("").prop("required", true);
  clearAudioPreview();
  $("#audio-record-error").empty();
  $("#audio-record-status").text("Requesting microphone access...");
  recordingPending = true;
  updateAudioControls();
  recorder = new AudioRecorder({
    onProgress: (seconds) => $("#duration").val(durationLabel(seconds)),
    onLimit: () => finishRecording(true),
    onError: (error) => {
      recordingError(error);
      if (recorder) recorder.dispose().catch(recordingError);
      recorder = null;
      recording = false;
      updateAudioControls();
    }
  });
  try {
    await recorder.start();
    recording = true;
    $("#audio-record-status").text("Recording. Click Stop recording when you are finished.");
  } catch (error) {
    recorder = null;
    $("#audio-record-status").text("Recording did not start.");
    recordingError(error);
  } finally {
    recordingPending = false;
    updateAudioControls();
  }
});

$("#audio-record-stop").on("click", () => finishRecording());
$("#audio-record-clear").on("click", () => {
  recordedFile = null;
  $("#audio").val("").prop("required", true);
  clearAudioPreview();
  $("#audio-record-error").empty();
  $("#audio-record-status").text("Audio cleared. Record again or choose a file.");
  updateAudioControls();
});

$("#audio").on("change", (event) => {
  recordedFile = null;
  clearAudioPreview();
  $("#audio-record-error").empty();
  const file = event.currentTarget.files?.[0];
  const validation = validateFile(file, ["mp3", "wav", "m4a", "ogg"], MAX_AUDIO_BYTES);
  if (file && !validation.isValid) {
    event.currentTarget.value = "";
    recordingError(new Error(validation.message));
  } else if (file) {
    previewAudio(file);
    $("#audio-record-status").text("Selected file ready. Listen below before saving.");
  }
  updateAudioControls();
});

$("#audio-preview").on("loadedmetadata", (event) => {
  const seconds = event.currentTarget.duration;
  if (Number.isFinite(seconds)) $("#duration").val(durationLabel(seconds));
}).on("error", () => {
  if (previewUrl) recordingError(new Error("This audio could not be previewed. Choose a browser-compatible recording, such as WAV or MP3."));
});

window.addEventListener("pagehide", () => {
  if (recorder) recorder.dispose().catch((error) => console.error("Could not close audio recording:", error));
  clearAudioPreview();
});

$("#announcement-form").on("submit", (event) => {
  event.preventDefault();
  if (recordingPending || recording || recordingStopping) {
    showError("Stop recording and listen to the preview before saving.");
    return;
  }
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
    const file = recordedFile || $("#audio")[0]?.files?.[0];
    const validation = validateFile(file, ["mp3", "wav", "m4a", "ogg"], MAX_AUDIO_BYTES);
    if (!validation.isValid) {
      showError(validation.message);
      return;
    }
    payload.append("audio", file);
  }
  runAdminAction($(event.currentTarget).find("[type=submit]"), async () => {
    saving = true;
    updateAudioControls();
    try {
      if (id) await updateAnnouncement(id, { title, published });
      else await createAnnouncement(payload);
      window.location.href = "/pages/admin/manage-announcements.html";
    } finally {
      saving = false;
      updateAudioControls();
    }
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
