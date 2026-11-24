import { enforcePageAccess } from "../auth/auth-guard.js";
import { getMyProfile, updateMyProfile } from "../services/users.service.js";
import { loadPublicShell } from "./_shared.js";
import { showError, showSuccess } from "../utils/notifications.js";

if (enforcePageAccess()) {
  await loadPublicShell("../../components");
  try {
    const response = await getMyProfile();
    const profile = response?.data;
    $("#full_name").val(profile.full_name || "");
    $("#email").val(profile.email || "");
  } catch (error) {
    showError(error.message);
  }
}

$("#profile-form").on("submit", async (event) => {
  event.preventDefault();
  try {
    const full_name = $("#full_name").val().trim();
    const email = $("#email").val().trim();
    await updateMyProfile({ full_name, email });
    showSuccess("Profile updated successfully.");
  } catch (error) {
    showError(error.message);
  }
});
