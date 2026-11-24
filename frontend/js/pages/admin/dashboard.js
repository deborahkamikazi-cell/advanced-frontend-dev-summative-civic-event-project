import { enforcePageAccess } from "../../auth/auth-guard.js";
import { getAdminDashboardStats } from "../../services/dashboard.service.js";
import { loadAdminShell } from "../_shared.js";
import { setErrorState, setLoadingState } from "../../utils/ui.js";

if (enforcePageAccess({ adminOnly: true })) {
  await loadAdminShell("../../../components");
  setLoadingState("#admin-dashboard-stats", true);
  try {
    const response = await getAdminDashboardStats();
    $("#admin-dashboard-stats").html(`<pre class="overflow-auto rounded bg-gray-100 p-3 text-xs">${JSON.stringify(response.data, null, 2)}</pre>`);
  } catch (error) {
    setErrorState("#admin-dashboard-stats", error.message);
  }
}
