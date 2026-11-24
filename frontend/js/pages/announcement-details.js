import { enforcePageAccess } from "../auth/auth-guard.js";
import { getAnnouncementById } from "../mock/mock-client.js";
import { loadPublicShell } from "./_shared.js";
import { setErrorState } from "../utils/ui.js";
import { formatShortDate } from "./user-ui.js";
import { getLocationParam } from "../utils/route.js";
import { getAnnouncementById as getAnnouncementByIdApi } from "../services/announcements.service.js";

if (enforcePageAccess()) {
  await loadPublicShell("../../components", { activeNav: "announcements" });
  const id = getLocationParam("id");

  if (!id) {
    setErrorState("#announcement-details-content", "Missing announcement id.");
  } else {
    try {
      let announcement = null;
      try {
        const response = await getAnnouncementByIdApi(id);
        announcement = response?.data || null;
      } catch {
        announcement = getAnnouncementById(id);
      }

      if (!announcement) {
        setErrorState("#announcement-details-content", "Announcement not found.");
      } else {
        $("#announcement-details-content").html(`
          <a href="/pages/user/announcements.html" class="text-sm text-royal">← Announcements</a>
          <section class="ce-card mt-3 max-w-3xl space-y-4 p-6">
            <h1 class="text-2xl font-bold text-navy">${announcement.title}</h1>
            <p class="text-sm text-slate-500">${formatShortDate(announcement.created_at)}${announcement.duration ? ` · Duration ${announcement.duration}` : ""}</p>
            <audio controls class="w-full" src="${announcement.audio_url || ""}"></audio>
            <h2 class="font-semibold">Transcript</h2>
            <p class="text-sm leading-relaxed text-slate-600">${announcement.transcript || "Transcript not available."}</p>
          </section>
        `);
      }
    } catch (error) {
      setErrorState("#announcement-details-content", error.message);
    }
  }
}
