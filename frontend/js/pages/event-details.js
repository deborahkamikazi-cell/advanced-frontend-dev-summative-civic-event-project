import { enforcePageAccess } from "../auth/auth-guard.js";
import { getEventById } from "../services/events.service.js";
import { loadPublicShell } from "./_shared.js";
import { setErrorState } from "../utils/ui.js";

if (enforcePageAccess()) {
  await loadPublicShell("../../components");
  const eventId = new URLSearchParams(window.location.search).get("id");

  if (!eventId) {
    setErrorState("#event-details-content", "Missing event id.");
  } else {
    try {
      const response = await getEventById(eventId);
      const event = response?.data;
      $("#event-details-content").html(`<h1 class="text-xl font-semibold">${event.title}</h1><p class="mt-2 text-sm text-gray-700">${event.description || ""}</p>`);
    } catch (error) {
      setErrorState("#event-details-content", error.message);
    }
  }
}
