import { enforcePageAccess } from "../auth/auth-guard.js";
import { loadPublicShell } from "./_shared.js";
import { showError, showSuccess } from "../utils/notifications.js";
import { getCurrentUserProfile, updateCurrentUserProfile } from "../mock/mock-client.js";
import { getRoleSafe } from "./_shared.js";

function renderProfileCard(profile) {
  const initials = profile.full_name.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase();
  const role = getRoleSafe();
  return `
    <section class="ce-card p-6 text-center">
      <div class="mx-auto grid h-24 w-24 place-items-center rounded-full bg-royal text-3xl font-semibold text-white">${initials}</div>
      <h2 class="mt-3 font-semibold">${profile.full_name}</h2>
      <p class="text-sm text-slate-500">${profile.email}</p>
      <div class="mt-3 flex justify-center gap-2">
        <span class="rounded-full bg-amber/20 px-2 py-0.5 text-xs font-medium text-amber-800">${role === "admin" ? "Admin" : "User"}</span>
        <span class="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Active</span>
      </div>
    </section>
  `;
}

if (enforcePageAccess()) {
  await loadPublicShell("../../components");
  try {
    const profile = getCurrentUserProfile();
    if (!profile) {
      showError("Profile not found.");
      return;
    }
    $("#profile-summary").html(renderProfileCard(profile));
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
    if (!full_name || !email) {
      showError("Full name and email are required.");
      return;
    }
    const updated = updateCurrentUserProfile({ full_name, email });
    if (!updated) {
      showError("Could not update profile.");
      return;
    }
    $("#profile-summary").html(renderProfileCard(updated));
    showSuccess("Profile updated successfully.");
  } catch (error) {
    showError(error.message);
  }
});
