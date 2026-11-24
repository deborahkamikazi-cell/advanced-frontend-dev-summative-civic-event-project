import { enforcePageAccess } from "../auth/auth-guard.js";
import { loadPublicShell } from "./_shared.js";
import { coverGradient, escapeHtml, formatShortDate, loadUserData, paginationMarkup, sectionHeader, USER_PAGE_SIZE } from "./user-ui.js";
import { withIdParam } from "../utils/route.js";
import { listPromos } from "../services/promos.service.js";

let page = 1;

async function loadPromos() {
  await loadUserData("#promos-list", async () => {
    const response = await listPromos({ page, limit: USER_PAGE_SIZE });
    const items = response.data.filter((item) => item.published !== false);
    $("#promos-list").html(`
      ${sectionHeader("Promos", "Short videos from your community.")}
      <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        ${items.map((item) => `
          <article class="ce-card overflow-hidden">
            <a href="${withIdParam("/pages/user/promo-details.html", item.id)}" class="relative block" aria-label="Watch ${escapeHtml(item.title)}">
              ${item.video_url
                ? `<video class="h-36 w-full object-cover" src="${escapeHtml(item.video_url)}" preload="metadata" muted></video>`
                : coverGradient(210, "h-36")}
              <span class="absolute inset-0 grid place-items-center">
                <span class="grid h-12 w-12 place-items-center rounded-full bg-white/90">▶</span>
              </span>
            </a>
            <div class="p-4">
              <h3 class="font-semibold">${escapeHtml(item.title)}</h3>
              <p class="text-sm text-slate-500">${escapeHtml(item.description)}</p>
              <div class="mt-3 flex items-center justify-between">
                <span class="text-xs text-slate-500">${formatShortDate(item.created_at)}</span>
                <a href="${withIdParam("/pages/user/promo-details.html", item.id)}" class="ce-btn-primary">Play video</a>
              </div>
            </div>
          </article>
        `).join("") || '<p class="text-sm text-slate-500">No published promos on this page.</p>'}
      </div>
      ${paginationMarkup(page, page < response.pagination.pages)}
    `);
  });
}

if (enforcePageAccess()) {
  await loadPublicShell("../../components", { activeNav: "promos" });
  await loadPromos();
}

$(document).on("click", ".user-page-button", async (event) => {
  page = Number($(event.currentTarget).data("page"));
  await loadPromos();
});
