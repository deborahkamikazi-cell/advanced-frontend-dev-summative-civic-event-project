import { enforcePageAccess } from "../../auth/auth-guard.js";
import { loadAdminShell } from "../_shared.js";
import { validateFile } from "../../utils/validation.js";
import { openConfirmModal, showError, showSuccess } from "../../utils/notifications.js";
import { createPromo, deletePromo, getPromoById, listPromos, publishPromo, unpublishPromo, updatePromo } from "../../services/promos.service.js";
import { ADMIN_PAGE_SIZE, adminPageHeader, dataRow, escapeHtml, loadAdminData, paginationMarkup, runAdminAction, statusBadge, tableMarkup } from "./admin-ui.js";
import { getLocationParam, isPathPage, withIdParam } from "../../utils/route.js";

let page = 1;
let formReady = false;
let savedPromoId = getLocationParam("id");

async function renderPromosList() {
  const { data: promos } = await listPromos({ page, limit: ADMIN_PAGE_SIZE });
  const rows = promos.map((promo) => dataRow([
    escapeHtml(promo.title),
    escapeHtml((promo.description || "").slice(0, 40)),
    statusBadge(promo.published ? "Published" : "Draft", promo.published ? "green" : "amber"),
    `<button class="promo-status-toggle mr-3 font-medium text-slate-600" data-id="${escapeHtml(promo.id)}" data-next="${!promo.published}">
       ${promo.published ? "Unpublish" : "Publish"}
     </button>
     <a href="${withIdParam("/pages/admin/promo-form.html", promo.id)}" class="mr-3 font-medium text-royal">Edit</a>
     <button class="promo-delete-btn font-medium text-red-600" data-id="${escapeHtml(promo.id)}">Delete</button>`
  ])).join("");
  $("#manage-promos-list").html(`
    ${adminPageHeader("Promos", "", '<a href="/pages/admin/promo-form.html" class="ce-btn-primary">Create promo</a>')}
    ${tableMarkup(["Title", "Description", "Status", "Actions"], rows)}
    ${paginationMarkup(page, promos.length)}
  `);
}

async function hydratePromoForm() {
  $("#video").prop("required", !savedPromoId);
  if (savedPromoId) {
    const { data: promo } = await getPromoById(savedPromoId);
    $("#promo-form-title").text("Edit Promo");
    for (const field of ["title", "description", "caption_text"]) $(`#${field}`).val(promo[field]);
    $("#published").prop("checked", Boolean(promo.published));
  }
  formReady = true;
  $("#promo-form button[type=submit]").prop("disabled", false);
}

if (enforcePageAccess({ adminOnly: true })) {
  await loadAdminShell("../../../components", { activeAdminNav: "promos" });
  if (isPathPage("manage-promos")) await loadAdminData("#manage-promos-list", renderPromosList);
  if (isPathPage("promo-form")) {
    $("#promo-form button[type=submit]").prop("disabled", true);
    try {
      await hydratePromoForm();
    } catch (error) {
      showError(error.message);
    }
  }
}

$("#promo-form").on("submit", (event) => {
  event.preventDefault();
  if (!formReady) {
    showError("The form has not loaded. Please reload this page.");
    return;
  }
  const payload = new FormData();
  for (const field of ["title", "description", "caption_text"]) {
    const value = $(`#${field}`).val().trim();
    if (!value) {
      showError("Title, description, and caption text are required.");
      return;
    }
    payload.append(field, value);
  }
  const published = $("#published").is(":checked");
  payload.append("published", String(published));
  const file = $("#video")[0]?.files?.[0];
  if (file || !savedPromoId) {
    const validation = validateFile(file, ["mp4", "mov", "avi", "mkv"], 8 * 1024 * 1024);
    if (!validation.isValid) {
      showError(validation.message);
      return;
    }
    payload.append("video", file);
  }
  runAdminAction($(event.currentTarget).find("[type=submit]"), async () => {
    if (savedPromoId) {
      await updatePromo(savedPromoId, payload);
    } else {
      const { data: promo } = await createPromo(payload);
      savedPromoId = promo.id;
      // Creation ignores published; preserve the saved ID if the separate status request fails.
      $("#video").prop("required", false);
      window.history.replaceState(null, "", withIdParam("/pages/admin/promo-form.html", savedPromoId));
      if (promo.published !== published) {
        try {
          await (published ? publishPromo : unpublishPromo)(savedPromoId);
        } catch (error) {
          throw new Error(`Promo was created, but its publication status could not be saved: ${error.message}. Retry Save or update its status from Promos.`);
        }
      }
    }
    window.location.href = "/pages/admin/manage-promos.html";
  });
});

$(document).on("click", ".promo-delete-btn", (event) => {
  const button = event.currentTarget;
  openConfirmModal({
    title: "Delete promo?",
    message: "This promo will be removed permanently.",
    confirmLabel: "Delete",
    onConfirm: () => runAdminAction(button, async () => {
      await deletePromo($(button).attr("data-id"));
      showSuccess("Promo deleted.");
      await loadAdminData("#manage-promos-list", renderPromosList);
    })
  });
});

$(document).on("click", ".promo-status-toggle", (event) => {
  const button = event.currentTarget;
  runAdminAction(button, async () => {
    const publish = $(button).attr("data-next") === "true";
    await (publish ? publishPromo : unpublishPromo)($(button).attr("data-id"));
    showSuccess(publish ? "Promo published." : "Promo unpublished.");
    await loadAdminData("#manage-promos-list", renderPromosList);
  });
});

$(document).on("click", ".admin-page-button", (event) => {
  page = Number($(event.currentTarget).attr("data-page"));
  loadAdminData("#manage-promos-list", renderPromosList);
});
