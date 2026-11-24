import { enforcePageAccess } from "../auth/auth-guard.js";
import { loadPublicShell } from "./_shared.js";
import { getAnnouncements, getPromos, getPublishedEvents, getUserRegistrations } from "../mock/mock-client.js";
import { coverGradient, formatDateLabel } from "./user-ui.js";
import { withIdParam } from "../utils/route.js";

function eventCard(event) {
  return `
    <article class="ce-card overflow-hidden">
      ${coverGradient(event.image_theme)}
      <div class="p-4">
        <h3 class="font-semibold">${event.title}</h3>
        <p class="text-sm text-slate-500">📅 ${formatDateLabel(event.starts_at)}<br />📍 ${event.location}</p>
      </div>
    </article>
  `;
}

function announcementCard(item) {
  return `
    <article class="ce-card p-4">
      <a href="${withIdParam("/pages/user/announcement-details.html", item.id)}" class="font-semibold hover:text-royal">${item.title}</a>
      <audio controls class="mt-3 w-full" src="${item.audio_url}"></audio>
    </article>
  `;
}

function promoCard(item) {
  return `
    <article class="ce-card overflow-hidden">
      <a href="${withIdParam("/pages/user/promo-details.html", item.id)}" class="block">
        ${coverGradient(item.theme, "h-36")}
      </a>
      <div class="p-4">
        <h3 class="font-semibold">${item.title}</h3>
        <p class="text-sm text-slate-500">${item.description}</p>
      </div>
    </article>
  `;
}

if (enforcePageAccess()) {
  await loadPublicShell("./components", { activeNav: "home" });
  const featuredEvents = getPublishedEvents().slice(0, 3);
  const announcements = getAnnouncements().slice(0, 2);
  const promos = getPromos().slice(0, 3);
  const registrations = getUserRegistrations().slice(0, 2);

  $("#home-content").html(`
    <section class="mb-10 rounded-3xl p-8 text-white sm:p-12" style="background:linear-gradient(120deg,#172554,#2563EB)">
      <p class="text-sm text-blue-200">Welcome back 👋</p>
      <h1 class="mt-1 max-w-xl text-3xl font-bold sm:text-4xl">Take part in the life of your city.</h1>
      <p class="mt-3 max-w-lg text-blue-100">Discover civic events, stay informed with audio announcements and watch community stories.</p>
      <a href="/pages/user/events.html" class="mt-6 inline-block rounded-lg bg-amber px-4 py-2 text-sm font-medium text-navy">Explore events</a>
    </section>

    <h2 class="mb-4 text-xl font-semibold">Featured upcoming events</h2>
    <section class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">${featuredEvents.map(eventCard).join("")}</section>

    <section class="mt-10 grid gap-8 lg:grid-cols-2">
      <div>
        <h2 class="mb-4 text-xl font-semibold">Recent announcements</h2>
        <div class="space-y-3">${announcements.map(announcementCard).join("")}</div>
      </div>
      <div>
        <h2 class="mb-4 text-xl font-semibold">Your registered events</h2>
        <div class="ce-card divide-y">
          ${registrations.map((item) => `
            <a href="${withIdParam("/pages/user/event-details.html", item.event.id)}" class="flex items-center justify-between p-4 hover:bg-slate-50">
              <span><b class="text-sm">${item.event.title}</b><br /><span class="text-xs text-slate-500">${formatDateLabel(item.event.starts_at)}</span></span>
              <span class="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">Confirmed</span>
            </a>
          `).join("")}
        </div>
      </div>
    </section>

    <h2 class="mb-4 mt-10 text-xl font-semibold">Featured promos</h2>
    <section class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">${promos.map(promoCard).join("")}</section>
  `);
}
