import { enforcePageAccess } from "../auth/auth-guard.js";
import { listPromos } from "../services/promos.service.js";
import { loadPublicShell } from "./_shared.js";
import { setEmptyState, setErrorState, setLoadingState } from "../utils/ui.js";

if (enforcePageAccess()) {
  await loadPublicShell("../../components");
  setLoadingState("#promos-list", true);
  try {
    const response = await listPromos();
    const items = response?.data || [];
    if (!items.length) {
      setEmptyState("#promos-list", "No promos available.");
    } else {
      $("#promos-list").html(items.map((item) => `<article class="mb-3 rounded border bg-white p-3">${item.title}</article>`).join(""));
    }
  } catch (error) {
    setErrorState("#promos-list", error.message);
  }
}
