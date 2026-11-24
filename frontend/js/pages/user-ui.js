import { setErrorState, setLoadingState } from "../utils/ui.js";
import { showError } from "../utils/notifications.js";

export { escapeHtml } from "../utils/formatters.js";

export function formatDateLabel(value) {
  const date = new Date(value);
  return date.toLocaleString([], {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function formatShortDate(value) {
  return new Date(value).toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

export function starsMarkup(rating) {
  const full = Math.max(0, Math.min(5, Math.round(rating)));
  return `<span class="text-amber" aria-label="${full} out of 5 stars">${"★".repeat(full)}${"☆".repeat(5 - full)}</span>`;
}

export function coverGradient(theme = 210, classes = "h-40") {
  const hue = Number.isFinite(Number(theme)) ? Number(theme) : 210;
  return `<div class="${classes} flex items-end p-3 text-3xl text-white" style="background:linear-gradient(135deg,hsl(${hue} 70% 30%),hsl(${hue + 35} 80% 55%))" role="img" aria-label="Event photo placeholder">🏛️</div>`;
}

export function sectionHeader(title, subtitle = "", extra = "") {
  return `
    <div class="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-navy sm:text-3xl">${title}</h1>
        <p class="text-sm text-slate-500">${subtitle}</p>
      </div>
      ${extra}
    </div>
  `;
}

export const USER_PAGE_SIZE = 6;

export async function loadUserData(target, render) {
  setLoadingState(target, true);
  try {
    await render();
  } catch (error) {
    setErrorState(target, error.message || "Unable to load data.", () => loadUserData(target, render));
  }
}

export async function runUserAction(button, action) {
  const $button = $(button);
  if ($button.prop("disabled")) return;
  $button.prop("disabled", true).attr("aria-busy", "true");
  try {
    await action();
  } catch (error) {
    showError(error.message || "The request failed. Please try again.");
  } finally {
    $button.prop("disabled", false).removeAttr("aria-busy");
  }
}

export function paginationMarkup(page, hasNext) {
  return `<nav class="mt-6 flex items-center justify-center gap-3" aria-label="Pagination">
    <button type="button" class="ce-btn-secondary user-page-button" data-page="${page - 1}" ${page === 1 ? "disabled" : ""}>Previous</button>
    <span class="text-sm" aria-current="page">Page ${page}</span>
    <button type="button" class="ce-btn-secondary user-page-button" data-page="${page + 1}" ${hasNext ? "" : "disabled"}>Next</button>
  </nav>`;
}
