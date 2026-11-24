import { enforcePageAccess } from "../auth/auth-guard.js";
import { getMyRegistrations } from "../services/registrations.service.js";
import { loadPublicShell } from "./_shared.js";
import { setEmptyState, setErrorState, setLoadingState } from "../utils/ui.js";

if (enforcePageAccess()) {
  await loadPublicShell("../../components");
  setLoadingState("#registrations-list", true);
  try {
    const response = await getMyRegistrations();
    const items = response?.data || [];
    if (!items.length) {
      setEmptyState("#registrations-list", "No registrations found.");
    } else {
      $("#registrations-list").html(items.map((item) => `<div class="mb-2 rounded border bg-white p-3">${item.title}</div>`).join(""));
    }
  } catch (error) {
    setErrorState("#registrations-list", error.message);
  }
}
