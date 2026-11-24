import { formatDateLabel, sectionHeader } from "../user-ui.js";
import { showError } from "../../utils/notifications.js";
import { setLoadingState } from "../../utils/ui.js";
import { escapeHtml } from "../../utils/formatters.js";

export { escapeHtml };

export async function runAdminAction(button, action) {
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

export async function loadAdminData(target, render) {
  setLoadingState(target, true);
  try {
    await render();
  } catch (error) {
    $(target).html(`
      <p class="p-4 text-sm text-red-600" role="alert">${escapeHtml(error.message || "Unable to load data.")}</p>
      <button type="button" class="ce-btn-secondary" data-admin-retry>Retry</button>
    `);
    $(target).find("[data-admin-retry]").one("click", () => loadAdminData(target, render));
  }
}

export const ADMIN_PAGE_SIZE = 20;

export function paginationMarkup(page, count) {
  return `<nav class="mt-4 flex items-center gap-3" aria-label="Pagination">
    <button class="ce-btn-secondary admin-page-button" data-page="${page - 1}" ${page === 1 ? "disabled" : ""}>Previous</button>
    <span class="text-sm">Page ${page}</span>
    <button class="ce-btn-secondary admin-page-button" data-page="${page + 1}" ${count < ADMIN_PAGE_SIZE ? "disabled" : ""}>Next</button>
  </nav>`;
}

export function adminPageHeader(title, subtitle = "", actionMarkup = "") {
  return sectionHeader(title, subtitle, actionMarkup);
}

export function statusBadge(text, variant = "green") {
  const classes = {
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    amber: "bg-amber/20 text-amber-800"
  };
  return `<span class="rounded-full px-2 py-0.5 text-xs font-medium ${classes[variant] || classes.green}">${text}</span>`;
}

export function tableMarkup(headers, rowsHtml) {
  return `
    <div class="ce-card overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-50 text-slate-500">
          <tr>${headers.map((header) => `<th class="whitespace-nowrap px-4 py-3 font-medium">${header}</th>`).join("")}</tr>
        </thead>
        <tbody class="divide-y divide-slate-100">${rowsHtml || `<tr><td colspan="${headers.length}" class="px-4 py-6 text-slate-500">No records found.</td></tr>`}</tbody>
      </table>
    </div>
  `;
}

export function dataRow(cells) {
  return `<tr>${cells.map((cell) => `<td class="whitespace-nowrap px-4 py-3">${cell}</td>`).join("")}</tr>`;
}

export function formatDateTimeForInput(value) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (num) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export { formatDateLabel };
