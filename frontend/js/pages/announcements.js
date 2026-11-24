import { enforcePageAccess } from "../auth/auth-guard.js";
import { listAnnouncements } from "../services/announcements.service.js";
import { loadPublicShell } from "./_shared.js";
import { setEmptyState, setErrorState, setLoadingState } from "../utils/ui.js";

if (enforcePageAccess()) {
  await loadPublicShell("../../components");
  setLoadingState("#announcements-list", true);
  try {
    const response = await listAnnouncements();
    const items = response?.data || [];
    if (!items.length) {
      setEmptyState("#announcements-list", "No announcements available.");
    } else {
      $("#announcements-list").html(items.map((item) => `<article class="mb-3 rounded border bg-white p-3">${item.title}</article>`).join(""));
    }
  } catch (error) {
    setErrorState("#announcements-list", error.message);
  }
}
