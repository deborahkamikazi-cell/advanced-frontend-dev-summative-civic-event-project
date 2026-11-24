import { enforcePageAccess } from "../../auth/auth-guard.js";
import { createPromo, listPromos } from "../../services/promos.service.js";
import { loadAdminShell } from "../_shared.js";
import { setErrorState, setLoadingState } from "../../utils/ui.js";
import { validateFile } from "../../utils/validation.js";
import { showError, showSuccess } from "../../utils/notifications.js";

if (enforcePageAccess({ adminOnly: true })) {
  await loadAdminShell("../../../components");
  if ($("#manage-promos-list").length) {
    setLoadingState("#manage-promos-list", true);
    try {
      const response = await listPromos();
      const items = response?.data || [];
      $("#manage-promos-list").html(items.map((item) => `<article class="mb-2 rounded border p-3">${item.title}</article>`).join(""));
    } catch (error) {
      setErrorState("#manage-promos-list", error.message);
    }
  }
}

$("#promo-form").on("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const file = $("#video")[0]?.files?.[0];

  if (file) {
    const fileValidation = validateFile(file, ["mp4", "mov", "avi", "mkv"], 8 * 1024 * 1024);
    if (!fileValidation.isValid) {
      showError(fileValidation.message);
      return;
    }
  }

  try {
    await createPromo(formData);
    showSuccess("Promo saved successfully.");
  } catch (error) {
    showError(error.message);
  }
});
