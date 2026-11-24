import { enforcePageAccess } from "../../auth/auth-guard.js";
import { createEvent, listEvents } from "../../services/events.service.js";
import { loadAdminShell } from "../_shared.js";
import { setErrorState, setLoadingState } from "../../utils/ui.js";
import { validateFile } from "../../utils/validation.js";
import { showError, showSuccess } from "../../utils/notifications.js";

if (enforcePageAccess({ adminOnly: true })) {
  await loadAdminShell("../../../components");

  if ($("#manage-events-list").length) {
    setLoadingState("#manage-events-list", true);
    try {
      const response = await listEvents();
      const items = response?.data || [];
      $("#manage-events-list").html(items.map((event) => `<article class="mb-2 rounded border p-3">${event.title}</article>`).join(""));
    } catch (error) {
      setErrorState("#manage-events-list", error.message);
    }
  }
}

$("#event-form").on("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const file = $("#image")[0]?.files?.[0];

  if (file) {
    const fileValidation = validateFile(file, ["jpg", "jpeg", "png", "gif"], 2 * 1024 * 1024);
    if (!fileValidation.isValid) {
      showError(fileValidation.message);
      return;
    }
  }

  try {
    await createEvent(formData);
    showSuccess("Event saved successfully.");
  } catch (error) {
    showError(error.message);
  }
});
