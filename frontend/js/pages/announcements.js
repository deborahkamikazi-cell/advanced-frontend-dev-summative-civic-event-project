import { enforcePageAccess } from "../auth/auth-guard.js";
import { loadPublicShell } from "./_shared.js";
import { setEmptyState, setErrorState, setLoadingState } from "../utils/ui.js";
import { getAnnouncements } from "../mock/mock-client.js";
import { formatShortDate, sectionHeader } from "./user-ui.js";
import { withIdParam } from "../utils/route.js";
import { listAnnouncements } from "../services/announcements.service.js";

function player(duration) {
  return `
    <div class="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
      <span class="grid h-10 w-10 place-items-center rounded-full bg-royal text-white">▶</span>
      <div class="h-2 flex-1 rounded-full bg-slate-200"></div>
      <span class="text-xs text-slate-500">${duration}</span>
    </div>
  `;
}

if (enforcePageAccess()) {
  await loadPublicShell("../../components", { activeNav: "announcements" });
  setLoadingState("#announcements-list", true);
  try {
    let items = [];
    try {
      const response = await listAnnouncements();
      items = (response?.data || []).filter((item) => item.published !== false);
    } catch {
      items = getAnnouncements();
    }

    if (!items.length) {
      setEmptyState("#announcements-list", "No announcements available.");
    } else {
      $("#announcements-list").html(`
        ${sectionHeader("Announcements", "Published audio announcements.")}
        <div class="grid gap-4 md:grid-cols-2">
          ${items.map((item) => `
            <article class="ce-card space-y-3 p-4">
              <div class="flex items-start justify-between gap-2">
                <a href="${withIdParam("/pages/user/announcement-details.html", item.id)}" class="font-semibold hover:text-royal">${item.title}</a>
                <span class="whitespace-nowrap text-xs text-slate-500">${formatShortDate(item.created_at)}</span>
              </div>
              ${player(item.duration || "Audio")}
            </article>
          `).join("")}
        </div>
      `);
    }
  } catch (error) {
    setErrorState("#announcements-list", error.message);
  }
}
