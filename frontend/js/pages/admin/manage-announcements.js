import { enforcePageAccess } from "../../auth/auth-guard.js";
import { createAnnouncement, listAnnouncements } from "../../services/announcements.service.js";
import { loadAdminShell } from "../_shared.js";
import { setErrorState, setLoadingState } from "../../utils/ui.js";
import { validateFile } from "../../utils/validation.js";
import { showError, showSuccess } from "../../utils/notifications.js";

if (enforcePageAccess({ adminOnly: true })) {
  await loadAdminShell("../../../components");
  if ($("#manage-announcements-list").length) {
    setLoadingState("#manage-announcements-list", true);
    try {
      const response = await listAnnouncements();
      const items = response?.data || [];
      $("#manage-announcements-list").html(items.map((item) => `<article class="mb-2 rounded border p-3">${item.title}</article>`).join(""));
    } catch (error) {
      setErrorState("#manage-announcements-list", error.message);
    }
  }
}

$("#announcement-form").on("submit", async (event) => {
  event.preventDefault();
  const formData = new FormData(event.currentTarget);
  const file = $("#audio")[0]?.files?.[0];
  const fileValidation = validateFile(file, ["mp3", "wav", "m4a", "ogg"], 5 * 1024 * 1024);
  if (!fileValidation.isValid) {
    showError(fileValidation.message);
    return;
  }

  try {
    await createAnnouncement(formData);
    showSuccess("Announcement saved successfully.");
  } catch (error) {
    showError(error.message);
  }
});
