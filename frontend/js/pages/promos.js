import { enforcePageAccess } from "../auth/auth-guard.js";
import { getPromos } from "../mock/mock-client.js";
import { loadPublicShell } from "./_shared.js";
import { setEmptyState, setErrorState, setLoadingState } from "../utils/ui.js";
import { coverGradient, formatShortDate, sectionHeader } from "./user-ui.js";
import { withIdParam } from "../utils/route.js";

if (enforcePageAccess()) {
  await loadPublicShell("../../components", { activeNav: "promos" });
  setLoadingState("#promos-list", true);
  try {
    const items = getPromos();
    if (!items.length) {
      setEmptyState("#promos-list", "No promos available.");
    } else {
      $("#promos-list").html(`
        ${sectionHeader("Promos", "Short videos from your community.")}
        <div class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          ${items.map((item) => `
            <article class="ce-card overflow-hidden">
              <a href="${withIdParam("/pages/user/promo-details.html", item.id)}" class="relative block">
                ${coverGradient(item.theme, "h-36")}
                <span class="absolute inset-0 grid place-items-center">
                  <span class="grid h-12 w-12 place-items-center rounded-full bg-white/90">▶</span>
                </span>
              </a>
              <div class="p-4">
                <h3 class="font-semibold">${item.title}</h3>
                <p class="text-sm text-slate-500">${item.description}</p>
                <div class="mt-3 flex items-center justify-between">
                  <span class="text-xs text-slate-500">${formatShortDate(item.published_at)}</span>
                  <a href="${withIdParam("/pages/user/promo-details.html", item.id)}" class="ce-btn-primary">Play video</a>
                </div>
              </div>
            </article>
          `).join("")}
        </div>
      `);
    }
  } catch (error) {
    setErrorState("#promos-list", error.message);
  }
}
