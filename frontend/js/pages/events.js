import { enforcePageAccess } from "../auth/auth-guard.js";
import { listEvents } from "../services/events.service.js";
import { loadPublicShell } from "./_shared.js";
import { setEmptyState, setErrorState, setLoadingState } from "../utils/ui.js";

if (enforcePageAccess()) {
  await loadPublicShell("../../components");
  setLoadingState("#events-list", true);
  try {
    const response = await listEvents();
    const events = response?.data || [];
    if (!events.length) {
      setEmptyState("#events-list", "No events available.");
    } else {
      $("#events-list").html(events.map((event) => `<article class="mb-3 rounded border bg-white p-3"><h2 class="font-medium">${event.title}</h2></article>`).join(""));
    }
  } catch (error) {
    setErrorState("#events-list", error.message);
  }
}
