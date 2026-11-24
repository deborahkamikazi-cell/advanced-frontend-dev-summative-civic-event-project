import { enforcePageAccess } from "../auth/auth-guard.js";
import { listNotifications } from "../services/notifications.service.js";
import { loadPublicShell } from "./_shared.js";
import { setEmptyState, setErrorState, setLoadingState } from "../utils/ui.js";

if (enforcePageAccess()) {
  await loadPublicShell("../../components");
  setLoadingState("#notifications-list", true);
  try {
    const response = await listNotifications();
    const items = response?.data || [];
    if (!items.length) {
      setEmptyState("#notifications-list", "No notifications available.");
    } else {
      $("#notifications-list").html(items.map((item) => `<article class="mb-3 rounded border bg-white p-3"><h2 class="font-medium">${item.title}</h2><p class="text-sm">${item.message}</p></article>`).join(""));
    }
  } catch (error) {
    setErrorState("#notifications-list", error.message);
  }
}
