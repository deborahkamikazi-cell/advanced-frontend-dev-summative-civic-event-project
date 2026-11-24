import { enforcePageAccess } from "../auth/auth-guard.js";
import { getAnnouncementById } from "../services/announcements.service.js";
import { loadPublicShell } from "./_shared.js";
import { setErrorState } from "../utils/ui.js";

if (enforcePageAccess()) {
  await loadPublicShell("../../components");
  const id = new URLSearchParams(window.location.search).get("id");

  if (!id) {
    setErrorState("#announcement-details-content", "Missing announcement id.");
  } else {
    try {
      const response = await getAnnouncementById(id);
      const announcement = response?.data;
      $("#announcement-details-content").html(`
        <h1 class="text-xl font-semibold">${announcement.title}</h1>
        <audio controls class="mt-4 w-full" src="${announcement.audio_url || ""}"></audio>
      `);
    } catch (error) {
      setErrorState("#announcement-details-content", error.message);
    }
  }
}
