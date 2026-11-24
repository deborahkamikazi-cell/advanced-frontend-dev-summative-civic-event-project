import { enforcePageAccess } from "../auth/auth-guard.js";
import { loadPublicShell } from "./_shared.js";
import { setEmptyState, setErrorState, setLoadingState } from "../utils/ui.js";
import { cancelRegistration, getUserRegistrations } from "../mock/mock-client.js";
import { formatDateLabel, coverGradient, sectionHeader } from "./user-ui.js";
import { openConfirmModal, showSuccess } from "../utils/notifications.js";
import { withIdParam } from "../utils/route.js";

function renderRegistrations() {
  const items = getUserRegistrations();
  if (!items.length) {
    setEmptyState("#registrations-feed", "You have no active registrations.");
    return;
  }

  $("#registrations-feed").html(`
    <div class="space-y-4">
      ${items.map((item) => `
        <article class="ce-card overflow-hidden sm:flex">
          ${coverGradient(item.event.image_theme, "h-28 sm:h-auto sm:w-48")}
          <div class="flex flex-1 flex-wrap items-center justify-between gap-3 p-4">
            <div>
              <h3 class="font-semibold">${item.event.title}</h3>
              <p class="text-sm text-slate-500">${formatDateLabel(item.event.starts_at)} · ${item.event.location}</p>
              <div class="mt-1"><span class="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Confirmed</span></div>
            </div>
            <div class="flex gap-2">
              <a href="${withIdParam("/pages/user/event-details.html", item.event.id)}" class="ce-btn-secondary">View event</a>
              <button class="ce-btn-danger registration-cancel-btn" data-event-id="${item.event.id}">Cancel registration</button>
            </div>
          </div>
        </article>
      `).join("")}
    </div>
  `);
}

if (enforcePageAccess()) {
  await loadPublicShell("../../components");
  setLoadingState("#registrations-list", true);
  try {
    $("#registrations-list").html(sectionHeader("My Registrations", "Events you have signed up for."));
    $("#registrations-list").append('<section id="registrations-feed"></section>');
    renderRegistrations();
  } catch (error) {
    setErrorState("#registrations-list", error.message);
  }
}

$(document).on("click", ".registration-cancel-btn", (event) => {
  const eventId = $(event.currentTarget).data("eventId");
  openConfirmModal({
    title: "Cancel registration?",
    message: "This event will be removed from your registrations.",
    confirmLabel: "Cancel registration",
    onConfirm: () => {
      cancelRegistration(eventId);
      showSuccess("Registration cancelled.");
      renderRegistrations();
    }
  });
});
