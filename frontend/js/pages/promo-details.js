import { enforcePageAccess } from "../auth/auth-guard.js";
import { getPromoById } from "../services/promos.service.js";
import { loadPublicShell } from "./_shared.js";
import { setErrorState } from "../utils/ui.js";

if (enforcePageAccess()) {
  await loadPublicShell("../../components");
  const id = new URLSearchParams(window.location.search).get("id");

  if (!id) {
    setErrorState("#promo-details-content", "Missing promo id.");
  } else {
    try {
      const response = await getPromoById(id);
      const promo = response?.data;
      $("#promo-details-content").html(`
        <h1 class="text-xl font-semibold">${promo.title}</h1>
        <video controls class="mt-4 w-full" src="${promo.video_url || ""}">
          <track kind="captions" srclang="en" label="English captions" />
        </video>
        <p class="mt-2 text-sm text-gray-700">${promo.caption_text || ""}</p>
      `);
    } catch (error) {
      setErrorState("#promo-details-content", error.message);
    }
  }
}
