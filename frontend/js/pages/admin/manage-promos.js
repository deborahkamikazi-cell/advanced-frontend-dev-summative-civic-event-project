import { enforcePageAccess } from "../../auth/auth-guard.js";
import { loadAdminShell } from "../_shared.js";
import { setErrorState, setLoadingState } from "../../utils/ui.js";
import { validateFile } from "../../utils/validation.js";
import { openConfirmModal, showError, showSuccess } from "../../utils/notifications.js";
import { createAdminPromo, deleteAdminPromo, getAllPromos, getPromoById, setPromoPublished, updateAdminPromo } from "../../mock/mock-client.js";
import { adminPageHeader, dataRow, statusBadge, tableMarkup } from "./admin-ui.js";
import { getLocationParam, isPathPage, withIdParam } from "../../utils/route.js";

function isListPage() {
  return isPathPage("manage-promos");
}

function isFormPage() {
  return isPathPage("promo-form");
}

function renderPromosList() {
  const promos = getAllPromos();
  const rows = promos.map((promo) => dataRow([
    promo.title,
    promo.description.slice(0, 40),
    promo.published_at,
    statusBadge(promo.published ? "Published" : "Draft", promo.published ? "green" : "amber"),
    `
      <button class="promo-status-toggle mr-3 font-medium text-slate-600" data-id="${promo.id}" data-next="${!promo.published}">
        ${promo.published ? "Unpublish" : "Publish"}
      </button>
      <a href="${withIdParam("/pages/admin/promo-form.html", promo.id)}" class="mr-3 font-medium text-royal">Edit</a>
      <button class="promo-delete-btn font-medium text-red-600" data-id="${promo.id}">Delete</button>
    `
  ])).join("");

  $("#manage-promos-list").html(`
    ${adminPageHeader("Promos", "", '<a href="/pages/admin/promo-form.html" class="ce-btn-primary">Create promo</a>')}
    ${tableMarkup(["Title", "Description", "Published", "Status", "Actions"], rows)}
  `);
}

function hydratePromoForm() {
  const id = getLocationParam("id");
  const promo = id ? getPromoById(id) : null;
  if (!promo) return;
  $("#promo-form-title").text("Edit Promo");
  $("#title").val(promo.title);
  $("#description").val(promo.description);
  $("#caption_text").val(promo.caption_text);
  $("#transcript").val(promo.transcript || "");
  $("#published").prop("checked", Boolean(promo.published));
  $("#theme").val(promo.theme || 210);
}

if (enforcePageAccess({ adminOnly: true })) {
  await loadAdminShell("../../../components", { activeAdminNav: "promos" });
  if (isListPage()) {
    setLoadingState("#manage-promos-list", true);
    try {
      renderPromosList();
    } catch (error) {
      setErrorState("#manage-promos-list", error.message);
    }
  }
  if (isFormPage()) hydratePromoForm();
}

$("#promo-form").on("submit", (event) => {
  event.preventDefault();
  const file = $("#video")[0]?.files?.[0];

  if (file) {
    const fileValidation = validateFile(file, ["mp4", "mov", "avi", "mkv"], 8 * 1024 * 1024);
    if (!fileValidation.isValid) {
      showError(fileValidation.message);
      return;
    }
  }

  try {
    const payload = {
      title: $("#title").val().trim(),
      description: $("#description").val().trim(),
      caption_text: $("#caption_text").val().trim(),
      transcript: $("#transcript").val().trim(),
      published: $("#published").is(":checked"),
      theme: Number($("#theme").val() || 210),
      video_url: file ? URL.createObjectURL(file) : ""
    };
    if (!payload.title || !payload.description || !payload.caption_text) {
      showError("Title, description, and caption text are required.");
      return;
    }
    const id = getLocationParam("id");
    if (id) {
      if (!payload.video_url) delete payload.video_url;
      updateAdminPromo(id, payload);
      showSuccess("Promo updated.");
    } else {
      createAdminPromo(payload);
      showSuccess("Promo created.");
    }
    window.location.href = "/pages/admin/manage-promos.html";
  } catch (error) {
    showError(error.message);
  }
});

$(document).on("click", ".promo-delete-btn", (event) => {
  const id = $(event.currentTarget).data("id");
  openConfirmModal({
    title: "Delete promo?",
    message: "This promo will be removed permanently.",
    confirmLabel: "Delete",
    onConfirm: () => {
      deleteAdminPromo(id);
      showSuccess("Promo deleted.");
      renderPromosList();
    }
  });
});

$(document).on("click", ".promo-status-toggle", (event) => {
  const id = $(event.currentTarget).data("id");
  const next = String($(event.currentTarget).data("next")) === "true";
  setPromoPublished(id, next);
  renderPromosList();
});
