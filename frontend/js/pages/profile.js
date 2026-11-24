import { enforcePageAccess } from "../auth/auth-guard.js";
import { loadPublicShell } from "./_shared.js";
import { showError, showSuccess } from "../utils/notifications.js";
import { getMyProfile, updateMyProfile } from "../services/users.service.js";
import { getCurrentUser, setCurrentUser } from "../utils/storage.js";
import { escapeHtml, loadUserData, runUserAction } from "./user-ui.js";

function renderProfile(profile) {
  const initials = profile.full_name.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase();
  $("#profile-summary").html(`
    <section class="ce-card p-6 text-center">
      <div class="mx-auto grid h-24 w-24 place-items-center rounded-full bg-royal text-3xl font-semibold text-white">${escapeHtml(initials)}</div>
      <h2 class="mt-3 font-semibold">${escapeHtml(profile.full_name)}</h2>
      <p class="text-sm text-slate-500">${escapeHtml(profile.email)}</p>
      <div class="mt-3 flex justify-center gap-2">
        <span class="rounded-full bg-amber/20 px-2 py-0.5 text-xs font-medium text-amber-800">${profile.role === "admin" ? "Admin" : "User"}</span>
        <span class="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium">${profile.is_active ? "Active" : "Inactive"}</span>
      </div>
    </section>
  `);
  $("#full_name").val(profile.full_name);
  $("#email").val(profile.email);
}

if (enforcePageAccess()) {
  await loadPublicShell("../../components");
  await loadUserData("#profile-summary", async () => {
    $("#profile-form :input").prop("disabled", true);
    const response = await getMyProfile();
    if (!response.data) throw new Error("Profile not found.");
    renderProfile(response.data);
    $("#profile-form :input").prop("disabled", false);
  });

  $("#profile-form").on("submit", (event) => {
    event.preventDefault();
    runUserAction($("#profile-form [type=submit]"), async () => {
      const full_name = $("#full_name").val().trim();
      const email = $("#email").val().trim();
      if (!full_name || !email) {
        showError("Full name and email are required.");
        return;
      }
      const { data: updated } = await updateMyProfile({ full_name, email });
      if (!updated) throw new Error("Could not update profile.");
      setCurrentUser({ ...getCurrentUser(), ...updated });
      renderProfile(updated);
      $("#profile-menu-toggle").text(updated.full_name.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase());
      showSuccess("Profile updated successfully.");
    });
  });
}
