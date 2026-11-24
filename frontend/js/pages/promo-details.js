import { enforcePageAccess } from "../auth/auth-guard.js";
import { loadPublicShell } from "./_shared.js";
import { setErrorState } from "../utils/ui.js";
import { escapeHtml, loadUserData } from "./user-ui.js";
import { getLocationParam } from "../utils/route.js";
import { getPromoById } from "../services/promos.service.js";

if (enforcePageAccess()) {
  await loadPublicShell("../../components", { activeNav: "promos" });
  const id = getLocationParam("id");

  if (!id) {
    setErrorState("#promo-details-content", "Missing promo id.");
  } else {
    await loadUserData("#promo-details-content", async () => {
      const { data: promo } = await getPromoById(id);

      if (!promo) {
        setErrorState("#promo-details-content", "Promo not found.");
      } else {
        $("#promo-details-content").html(`
          <a href="/pages/user/promos.html" class="text-sm text-royal">← Promos</a>
          <section class="mt-3 max-w-3xl">
            <video controls aria-label="${escapeHtml(promo.title)}" class="w-full overflow-hidden rounded-2xl" src="${escapeHtml(promo.video_url)}" preload="metadata"></video>
            <h1 class="mt-4 text-2xl font-bold text-navy">${escapeHtml(promo.title)}</h1>
            <p class="mt-1 text-slate-600">${escapeHtml(promo.description)}</p>
            <section class="ce-card mt-4 p-4">
              <h2 class="font-semibold">Caption text</h2>
              <p class="mt-1 whitespace-pre-line text-sm text-slate-600">${escapeHtml(promo.caption_text || "No caption text available.")}</p>
              <p class="mt-2 text-sm text-slate-500">Timed video subtitles and transcript storage are not supported by the current API.</p>
            </section>
          </section>
        `);
      }
    });
  }
}
