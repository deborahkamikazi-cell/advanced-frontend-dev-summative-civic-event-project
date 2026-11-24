import { enforcePageAccess } from "../auth/auth-guard.js";
import { getPromoById } from "../mock/mock-client.js";
import { loadPublicShell } from "./_shared.js";
import { setErrorState } from "../utils/ui.js";
import { getLocationParam } from "../utils/route.js";
import { getPromoById as getPromoByIdApi } from "../services/promos.service.js";

if (enforcePageAccess()) {
  await loadPublicShell("../../components", { activeNav: "promos" });
  const id = getLocationParam("id");

  if (!id) {
    setErrorState("#promo-details-content", "Missing promo id.");
  } else {
    try {
      let promo = null;
      try {
        const response = await getPromoByIdApi(id);
        promo = response?.data || null;
      } catch {
        promo = getPromoById(id);
      }

      if (!promo) {
        setErrorState("#promo-details-content", "Promo not found.");
      } else {
        $("#promo-details-content").html(`
          <a href="/pages/user/promos.html" class="text-sm text-royal">← Promos</a>
          <section class="mt-3 max-w-3xl">
            <video controls class="w-full overflow-hidden rounded-2xl" src="${promo.video_url}" preload="metadata">
              <track kind="captions" srclang="en" label="English captions" />
            </video>
            <h1 class="mt-4 text-2xl font-bold text-navy">${promo.title}</h1>
            <p class="mt-1 text-slate-600">${promo.description}</p>
            <section class="ce-card mt-4 p-4">
              <h2 class="font-semibold">Caption / transcript</h2>
              <p class="mt-1 text-sm text-slate-600">${promo.caption_text || "No caption text available."}</p>
              <p class="mt-2 text-sm text-slate-600">${promo.transcript || "Transcript not available."}</p>
            </section>
          </section>
        `);
      }
    } catch (error) {
      setErrorState("#promo-details-content", error.message);
    }
  }
}
