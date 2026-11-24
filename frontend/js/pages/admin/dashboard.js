import { enforcePageAccess } from "../../auth/auth-guard.js";
import { loadAdminShell } from "../_shared.js";
import { setErrorState, setLoadingState } from "../../utils/ui.js";
import { getAdminDashboardData } from "../../mock/mock-client.js";
import { adminPageHeader, statusBadge, tableMarkup, dataRow } from "./admin-ui.js";

if (enforcePageAccess({ adminOnly: true })) {
  await loadAdminShell("../../../components", { activeAdminNav: "dashboard" });
  setLoadingState("#admin-dashboard-stats", true);
  try {
    const data = getAdminDashboardData();
    $("#admin-dashboard-stats").html(`
      ${adminPageHeader(
        "Overview",
        "Platform summary.",
        '<div class="flex gap-2"><a href="/pages/admin/event-form.html" class="ce-btn-primary">+ New event</a><a href="/pages/admin/announcement-form.html" class="ce-btn-secondary">+ Announcement</a></div>'
      )}
      <section class="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <article class="ce-card p-4"><p class="text-xs text-slate-500">Total Events</p><p class="text-2xl font-bold text-navy">${data.total_events}</p></article>
        <article class="ce-card p-4"><p class="text-xs text-slate-500">Total Users</p><p class="text-2xl font-bold text-navy">${data.total_users}</p></article>
        <article class="ce-card p-4"><p class="text-xs text-slate-500">Registrations</p><p class="text-2xl font-bold text-navy">${data.total_registrations}</p></article>
        <article class="ce-card p-4"><p class="text-xs text-slate-500">Total Promos</p><p class="text-2xl font-bold text-navy">${data.total_promos}</p></article>
        <article class="ce-card p-4"><p class="text-xs text-slate-500">Unread Notifs</p><p class="text-2xl font-bold text-navy">${data.unread_notifications}</p></article>
      </section>
      <section class="mt-6 grid gap-6 lg:grid-cols-3">
        <article class="ce-card p-4 lg:col-span-2">
          <h2 class="mb-3 font-semibold">Events overview</h2>
          <svg viewBox="0 0 300 100" class="w-full" role="img" aria-label="Registrations per month">
            ${data.monthly_event_registrations.map((value, index) => `<rect x="${15 + index * 47}" y="${95 - value}" width="30" height="${value}" rx="4" fill="${index === data.monthly_event_registrations.length - 1 ? "#F59E0B" : "#2563EB"}"></rect>`).join("")}
          </svg>
        </article>
        <article class="ce-card p-4">
          <h2 class="mb-3 font-semibold">Recent activity</h2>
          <ul class="space-y-2 text-sm text-slate-600">
            ${data.recent_activity.map((item) => `<li>${item}</li>`).join("")}
          </ul>
        </article>
      </section>
      <section class="mt-6">
        <h2 class="mb-3 font-semibold">Recent events</h2>
        ${tableMarkup(
          ["Title", "Date", "Status"],
          data.recent_events.map((event) => dataRow([
            event.title,
            new Date(event.starts_at).toLocaleDateString(),
            statusBadge(event.published ? "Published" : "Draft", event.published ? "green" : "amber")
          ])).join("")
        )}
      </section>
    `);
  } catch (error) {
    setErrorState("#admin-dashboard-stats", error.message);
  }
}
