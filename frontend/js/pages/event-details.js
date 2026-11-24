import { enforcePageAccess } from "../auth/auth-guard.js";
import { loadPublicShell } from "./_shared.js";
import { setErrorState } from "../utils/ui.js";
import { cancelRegistration, getEventAverageRating, getEventById, getEventFeedback, isUserRegisteredForEvent, registerForEvent, upsertFeedback } from "../mock/mock-client.js";
import { coverGradient, formatDateLabel, starsMarkup } from "./user-ui.js";
import { showError, showSuccess } from "../utils/notifications.js";
import { getLocationParam } from "../utils/route.js";
import { getEventById as getEventByIdApi, getMyFeedback, submitFeedback, updateFeedback } from "../services/events.service.js";
import { cancelEventRegistration, getMyRegistrations, registerForEvent as registerForEventApi } from "../services/registrations.service.js";

let selectedRating = 0;
let currentEventData = null;
let isApiMode = false;
let isRegistered = false;
let myFeedbackEntry = null;

function normalizeEvent(event) {
  return {
    ...event,
    image_url: event?.metadata?.image_url || null
  };
}

function feedbackMarkup(eventId) {
  if (isApiMode) {
    if (!myFeedbackEntry) {
      return '<p class="text-sm text-slate-500">Public event feedback is not exposed by the current API yet.</p>';
    }
    return `
      <article class="rounded-lg border border-slate-200 p-3">
        <p class="text-sm font-semibold">Your feedback ${starsMarkup(myFeedbackEntry.rating)}</p>
        <p class="text-sm text-slate-600">${myFeedbackEntry.comment || "No comment."}</p>
      </article>
    `;
  }
  const feedback = getEventFeedback(eventId);
  if (!feedback.length) {
    return '<p class="text-sm text-slate-500">No feedback yet. Be the first to share your experience.</p>';
  }
  return feedback.map((item) => `
    <article class="rounded-lg border border-slate-200 p-3">
      <p class="text-sm font-semibold">${item.user?.full_name || "Anonymous"} ${starsMarkup(item.rating)}</p>
      <p class="text-sm text-slate-600">${item.comment}</p>
    </article>
  `).join("");
}

function ratingInputMarkup() {
  return [1, 2, 3, 4, 5].map((value) => `
    <button type="button" data-rating="${value}" aria-label="${value} stars" class="feedback-star text-3xl ${selectedRating >= value ? "text-amber" : "text-slate-300"}">★</button>
  `).join("");
}

function renderEventDetails(eventData) {
  const ratings = isApiMode
    ? { average: myFeedbackEntry?.rating || 0, total: myFeedbackEntry ? 1 : 0 }
    : getEventAverageRating(eventData.id);
  const registered = isApiMode ? isRegistered : isUserRegisteredForEvent(eventData.id);
  const cover = eventData.image_url
    ? `<img src="${eventData.image_url}" alt="${eventData.title}" class="h-56 w-full object-cover sm:h-72" loading="lazy" />`
    : coverGradient(eventData.image_theme, "h-56 text-5xl sm:h-72");

  $("#event-details-content").html(`
    <a href="/pages/user/events.html" class="text-sm text-royal">← All events</a>
    <section class="ce-card mt-3 overflow-hidden">
      ${cover}
      <div class="grid gap-6 p-6 lg:grid-cols-3">
        <div class="lg:col-span-2">
          <h1 class="text-2xl font-bold text-navy">${eventData.title}</h1>
          <p class="mt-3 text-slate-600">${eventData.description}</p>
        </div>
        <aside class="space-y-3 text-sm">
          <p>📅 ${formatDateLabel(eventData.starts_at)}</p>
          <p>📍 ${eventData.location}</p>
          <p>Status: <span class="rounded-full ${registered ? "bg-green-100 text-green-700" : "bg-amber/20 text-amber-800"} px-2 py-0.5 text-xs font-medium">${registered ? "Registered" : "Not registered"}</span></p>
          <button id="event-register-toggle" class="${registered ? "ce-btn-danger" : "ce-btn-primary"} w-full" data-event-id="${eventData.id}">
            ${registered ? "Cancel registration" : "Register"}
          </button>
        </aside>
      </div>
    </section>
    <section class="ce-card mt-6 p-6">
      <h2 class="text-lg font-semibold">Event feedback</h2>
      <p class="mt-1">${starsMarkup(ratings.average)} <b>${ratings.average ? ratings.average.toFixed(1) : "0.0"}</b> <span class="text-sm text-slate-500">(${ratings.total} reviews)</span></p>
      <form id="feedback-form" class="mt-4 max-w-lg space-y-3">
        <div id="feedback-rating" role="radiogroup" aria-label="Your rating">${ratingInputMarkup()}</div>
        <label class="block text-sm font-medium">
          Your comment
          <textarea id="feedback-comment" rows="4" class="ce-input mt-1"></textarea>
        </label>
        <button class="ce-btn-primary" type="submit">Submit feedback</button>
      </form>
      <div class="mt-6 space-y-2" id="feedback-list">${feedbackMarkup(eventData.id)}</div>
    </section>
  `);
}

if (enforcePageAccess()) {
  await loadPublicShell("../../components", { activeNav: "events" });
  const eventId = getLocationParam("id");

  if (!eventId) {
    setErrorState("#event-details-content", "Missing event id.");
  } else {
    try {
      try {
        const [eventResponse, registrationsResponse, feedbackResponse] = await Promise.all([
          getEventByIdApi(eventId),
          getMyRegistrations(),
          getMyFeedback()
        ]);
        currentEventData = normalizeEvent(eventResponse?.data);
        isRegistered = (registrationsResponse?.data || []).some((registration) => registration.status === "registered" && registration.event_id === eventId);
        myFeedbackEntry = (feedbackResponse?.data || []).find((feedback) => feedback.event_id === eventId) || null;
        isApiMode = true;
      } catch {
        currentEventData = getEventById(eventId);
        isApiMode = false;
      }

      if (!currentEventData) {
        setErrorState("#event-details-content", "Event not found.");
      } else {
        renderEventDetails(currentEventData);
      }
    } catch (error) {
      setErrorState("#event-details-content", error.message);
    }
  }
}

$(document).on("click", "#event-register-toggle", (event) => {
  const eventId = $(event.currentTarget).data("eventId");
  const handler = async () => {
    if (isApiMode) {
      if (isRegistered) {
        await cancelEventRegistration(eventId);
        isRegistered = false;
        showSuccess("Registration cancelled.");
      } else {
        await registerForEventApi(eventId);
        isRegistered = true;
        showSuccess("Registration confirmed.");
      }
      if (currentEventData) renderEventDetails(currentEventData);
      return;
    }

    if (isUserRegisteredForEvent(eventId)) {
      cancelRegistration(eventId);
      showSuccess("Registration cancelled.");
    } else {
      registerForEvent(eventId);
      showSuccess("Registration confirmed.");
    }

    const eventData = getEventById(eventId);
    if (eventData) renderEventDetails(eventData);
  };

  handler().catch((error) => showError(error.message || "Unable to update registration."));
});

$(document).on("click", ".feedback-star", (event) => {
  selectedRating = Number($(event.currentTarget).data("rating"));
  if (currentEventData) renderEventDetails(currentEventData);
});

$(document).on("submit", "#feedback-form", async (event) => {
  event.preventDefault();
  const eventId = getLocationParam("id");
  const comment = $("#feedback-comment").val().trim();

  if (!eventId) return;
  if (!selectedRating) {
    showError("Please select a rating.");
    return;
  }

  try {
    if (isApiMode) {
      const payload = { event_id: eventId, rating: selectedRating, comment };
      if (myFeedbackEntry?.id) {
        await updateFeedback(myFeedbackEntry.id, payload);
      } else {
        await submitFeedback(payload);
      }
      const feedbackResponse = await getMyFeedback();
      myFeedbackEntry = (feedbackResponse?.data || []).find((feedback) => feedback.event_id === eventId) || null;
    } else {
      upsertFeedback(eventId, selectedRating, comment);
    }
    showSuccess("Thanks for your feedback!");
    selectedRating = 0;
    if (currentEventData) renderEventDetails(currentEventData);
  } catch (error) {
    showError(error.message || "Failed to submit feedback.");
  }
});
