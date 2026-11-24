import { enforcePageAccess } from "../auth/auth-guard.js";
import { loadPublicShell } from "./_shared.js";
import { escapeHtml, formatShortDate, loadUserData, paginationMarkup, sectionHeader, USER_PAGE_SIZE } from "./user-ui.js";
import { withIdParam } from "../utils/route.js";
import { listAnnouncements } from "../services/announcements.service.js";

let page = 1;

async function loadAnnouncements() {
  await loadUserData("#announcements-list", async () => {
    const response = await listAnnouncements({ page, limit: USER_PAGE_SIZE });
    const items = response.data.filter((item) => item.published !== false);
    $("#announcements-list").html(`
      ${sectionHeader("Announcements", "Published audio announcements.")}
      <div class="grid gap-4 md:grid-cols-2">
        ${items.map((item) => `
          <article class="ce-card space-y-3 p-4">
            <div class="flex items-start justify-between gap-2">
              <a href="${withIdParam("/pages/user/announcement-details.html", item.id)}" class="font-semibold hover:text-royal">${escapeHtml(item.title)}</a>
              <span class="whitespace-nowrap text-xs text-slate-500">${formatShortDate(item.created_at)}</span>
            </div>
            <audio controls preload="none" aria-label="${escapeHtml(item.title)}" class="w-full" src="${escapeHtml(item.audio_url)}"></audio>
          </article>
        `).join("") || '<p class="text-sm text-slate-500">No published announcements on this page.</p>'}
      </div>
      ${paginationMarkup(page, response.data.length === USER_PAGE_SIZE)}
    `);
  });
}

if (enforcePageAccess()) {
  await loadPublicShell("../../components", { activeNav: "announcements" });
  await loadAnnouncements();
}

$(document).on("click", ".user-page-button", async (event) => {
  page = Number($(event.currentTarget).data("page"));
  await loadAnnouncements();
});
