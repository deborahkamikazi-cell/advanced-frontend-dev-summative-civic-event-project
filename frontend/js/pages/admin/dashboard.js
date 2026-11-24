import { enforcePageAccess } from "../../auth/auth-guard.js";
import { loadAdminShell } from "../_shared.js";
import { getAdminDashboardStats } from "../../services/dashboard.service.js";
import { listEvents } from "../../services/events.service.js";
import { adminPageHeader, escapeHtml, loadAdminData, statusBadge, tableMarkup, dataRow } from "./admin-ui.js";

async function renderDashboard() {
    const [{ data }, { data: events }] = await Promise.all([getAdminDashboardStats(), listEvents()]);
    const growth = data.user_growth;
    const maximum = Math.max(1, ...growth.map((item) => Number(item.new_users)));
    const recentEvents = [...events].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
    $("#admin-dashboard-stats").html(`
      ${adminPageHeader(
        "Overview",
        "Platform summary.",
        '<div class="flex gap-2"><a href="/pages/admin/event-form.html" class="ce-btn-primary">+ New event</a><a href="/pages/admin/announcement-form.html" class="ce-btn-secondary">+ Announcement</a></div>'
      )}
      <section class="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <article class="ce-card p-4"><p class="text-xs text-slate-500">Total Events</p><p class="text-2xl font-bold text-navy">${escapeHtml(data.events.total_events)}</p></article>
        <article class="ce-card p-4"><p class="text-xs text-slate-500">Total Users</p><p class="text-2xl font-bold text-navy">${escapeHtml(data.users.total_users)}</p></article>
        <article class="ce-card p-4"><p class="text-xs text-slate-500">Registrations</p><p class="text-2xl font-bold text-navy">${escapeHtml(data.registrations.total_registrations)}</p></article>
        <article class="ce-card p-4"><p class="text-xs text-slate-500">Total Promos</p><p class="text-2xl font-bold text-navy">${escapeHtml(data.promos.total_promos)}</p></article>
        <article class="ce-card p-4"><p class="text-xs text-slate-500">Total Notifications</p><p class="text-2xl font-bold text-navy">${escapeHtml(data.notifications.total_notifications)}</p></article>
      </section>
      <section class="mt-6 grid gap-6 lg:grid-cols-3">
        <article class="ce-card p-4 lg:col-span-2">
          <h2 class="mb-3 font-semibold">New users by month</h2>
          ${growth.length ? `<svg viewBox="0 0 ${growth.length * 55 + 15} 120" class="w-full" role="img" aria-label="New users by month over the last six months">
            ${growth.map((item, index) => {
              const height = Number(item.new_users) / maximum * 80;
              return `<g><title>${escapeHtml(item.month)}: ${escapeHtml(item.new_users)} new users</title>
                <rect x="${15 + index * 55}" y="${90 - height}" width="30" height="${height}" rx="4" fill="${index === growth.length - 1 ? "#F59E0B" : "#2563EB"}"></rect>
                <text x="${15 + index * 55}" y="108" font-size="8">${escapeHtml(item.month)}</text></g>`;
            }).join("")}
          </svg>` : '<p class="text-sm text-slate-500">No user growth data yet.</p>'}
        </article>
        <article class="ce-card p-4">
          <h2 class="mb-3 font-semibold">Platform activity totals</h2>
          <ul class="space-y-2 text-sm text-slate-600">
            <li>${escapeHtml(data.events.upcoming_events)} upcoming events</li>
            <li>${escapeHtml(data.feedbacks.total_feedback)} feedback submissions</li>
            <li>${escapeHtml(data.announcements.total_announcements)} announcements</li>
          </ul>
        </article>
      </section>
      <section class="mt-6">
        <h2 class="mb-3 font-semibold">Recent events</h2>
        ${tableMarkup(
          ["Title", "Date", "Status"],
          recentEvents.map((event) => dataRow([
            escapeHtml(event.title),
            new Date(event.starts_at).toLocaleDateString(),
            statusBadge(event.published ? "Published" : "Draft", event.published ? "green" : "amber")
          ])).join("")
        )}
      </section>
    `);
}

if (enforcePageAccess({ adminOnly: true })) {
  await loadAdminShell("../../../components", { activeAdminNav: "dashboard" });
  await loadAdminData("#admin-dashboard-stats", renderDashboard);
}
