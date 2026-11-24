import { enforcePageAccess } from "../auth/auth-guard.js";
import { loadPublicShell } from "./_shared.js";
import { setErrorState } from "../utils/ui.js";
import { coverGradient, escapeHtml, formatDateLabel, loadUserData, runUserAction, starsMarkup } from "./user-ui.js";
import { showError, showSuccess } from "../utils/notifications.js";
import { getLocationParam } from "../utils/route.js";
import { getEventById, getMyFeedback, submitFeedback, updateFeedback } from "../services/events.service.js";
import { cancelEventRegistration, getMyRegistrations, registerForEvent } from "../services/registrations.service.js";

let selectedRating = 0;
let registrationStatus = null;
let myFeedbackEntry = null;
const eventId = getLocationParam("id");

function renderRegistration() {
  const registered = registrationStatus === "registered";
  const cancelled = registrationStatus === "cancelled";
  $("#event-registration").html(`
    <p>Status: <span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">${cancelled ? "Cancelled" : registered ? "Registered" : "Not registered"}</span></p>
    <button id="event-register-toggle" class="${registered ? "ce-btn-danger" : "ce-btn-primary"} mt-3 w-full" ${cancelled ? "disabled" : ""}>
      ${cancelled ? "Registration cancelled" : registered ? "Cancel registration" : "Register"}
    </button>
    <p class="mt-2 text-xs text-slate-500">The current API does not allow re-registration after cancellation.</p>
  `);
}

function renderFeedback() {
  $("#feedback-list").html(myFeedbackEntry ? `
    <article class="rounded-lg border border-slate-200 p-3">
      <p class="text-sm font-semibold">Your feedback ${starsMarkup(myFeedbackEntry.rating)}</p>
      <p class="text-sm text-slate-600">${escapeHtml(myFeedbackEntry.comment || "No comment.")}</p>
    </article>
  ` : '<p class="text-sm text-slate-500">You have not submitted feedback yet.</p>');
}

function renderRating() {
  $("#feedback-rating").html([1, 2, 3, 4, 5].map((value) => `
    <button type="button" data-rating="${value}" aria-label="${value} stars" aria-pressed="${selectedRating === value}" class="feedback-star text-3xl ${selectedRating >= value ? "text-amber" : "text-slate-300"}">★</button>
  `).join(""));
}

async function loadEventDetails() {
  await loadUserData("#event-details-content", async () => {
    const [eventResponse, registrationsResponse, feedbackResponse] = await Promise.all([
      getEventById(eventId), getMyRegistrations(), getMyFeedback()
    ]);
    const eventData = eventResponse.data;
    if (!eventData) throw new Error("Event not found.");
    registrationStatus = registrationsResponse.data.find((item) => item.event_id === eventId)?.status || null;
    myFeedbackEntry = feedbackResponse.data.find((item) => item.event_id === eventId) || null;
    selectedRating = myFeedbackEntry?.rating || 0;
    const cover = eventData.metadata?.image_url
      ? `<img src="${escapeHtml(eventData.metadata.image_url)}" alt="${escapeHtml(eventData.title)}" class="h-56 w-full object-cover sm:h-72" />`
      : coverGradient(210, "h-56 text-5xl sm:h-72");

    $("#event-details-content").html(`
      <a href="/pages/user/events.html" class="text-sm text-royal">← All events</a>
      <section class="ce-card mt-3 overflow-hidden">
        ${cover}
        <div class="grid gap-6 p-6 lg:grid-cols-3">
          <div class="lg:col-span-2">
            <h1 class="text-2xl font-bold text-navy">${escapeHtml(eventData.title)}</h1>
            <p class="mt-3 text-slate-600">${escapeHtml(eventData.description)}</p>
          </div>
          <aside class="space-y-3 text-sm">
            <p>📅 ${formatDateLabel(eventData.starts_at)}</p>
            <p>📍 ${escapeHtml(eventData.location)}</p>
            <div id="event-registration"></div>
          </aside>
        </div>
      </section>
      <section class="ce-card mt-6 p-6">
        <h2 class="text-lg font-semibold">Event feedback</h2>
        <p class="mt-1 text-sm text-slate-500">Average ratings and other users' reviews are not available through the current user API. Only your own feedback is shown.</p>
        <form id="feedback-form" class="mt-4 max-w-lg space-y-3">
          <div id="feedback-rating" role="group" aria-label="Your rating"></div>
          <label class="block text-sm font-medium">
            Your comment
            <textarea id="feedback-comment" rows="4" class="ce-input mt-1"></textarea>
          </label>
          <button class="ce-btn-primary" type="submit">Save feedback</button>
        </form>
        <div class="mt-6 space-y-2" id="feedback-list"></div>
      </section>
    `);
    $("#feedback-comment").val(myFeedbackEntry?.comment || "");
    renderRegistration();
    renderFeedback();
    renderRating();
  });
}

if (enforcePageAccess()) {
  await loadPublicShell("../../components", { activeNav: "events" });
  if (!eventId) {
    setErrorState("#event-details-content", "Missing event id.");
  } else {
    await loadEventDetails();
  }
}

$(document).on("click", "#event-register-toggle", (event) => {
  runUserAction(event.currentTarget, async () => {
    if (registrationStatus === "registered") {
      await cancelEventRegistration(eventId);
      registrationStatus = "cancelled";
      showSuccess("Registration cancelled.");
    } else {
      await registerForEvent(eventId);
      registrationStatus = "registered";
      showSuccess("Registration confirmed.");
    }
    renderRegistration();
  });
});

$(document).on("click", ".feedback-star", (event) => {
  selectedRating = Number($(event.currentTarget).data("rating"));
  $("#feedback-rating .feedback-star").each((_, button) => {
    const value = Number($(button).data("rating"));
    $(button).toggleClass("text-amber", selectedRating >= value)
      .toggleClass("text-slate-300", selectedRating < value)
      .attr("aria-pressed", String(selectedRating === value));
  });
});

$(document).on("submit", "#feedback-form", (event) => {
  event.preventDefault();
  runUserAction($("#feedback-form [type=submit]"), async () => {
    if (!selectedRating) {
      showError("Please select a rating.");
      return;
    }
    const payload = { event_id: eventId, rating: selectedRating, comment: $("#feedback-comment").val().trim() };
    const response = myFeedbackEntry?.id
      ? await updateFeedback(myFeedbackEntry.id, payload)
      : await submitFeedback(payload);
    if (!response.data?.id) throw new Error("The API did not return the saved feedback.");
    myFeedbackEntry = response.data;
    renderFeedback();
    showSuccess("Thanks for your feedback!");
  });
});
