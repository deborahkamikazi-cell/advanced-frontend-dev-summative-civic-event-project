import { enforcePageAccess } from "../auth/auth-guard.js";
import { loadPublicShell } from "./_shared.js";
import { setEmptyState, setErrorState, setLoadingState } from "../utils/ui.js";
import { getEventAverageRating, getPublishedEvents, isUserRegisteredForEvent, registerForEvent, cancelRegistration } from "../mock/mock-client.js";
import { sectionHeader, coverGradient, starsMarkup, formatDateLabel } from "./user-ui.js";
import { showSuccess } from "../utils/notifications.js";
import { withIdParam } from "../utils/route.js";

let allEvents = [];
let filteredEvents = [];
let currentPage = 1;
const PAGE_SIZE = 6;

function eventCardMarkup(event) {
  const ratings = getEventAverageRating(event.id);
  const registered = isUserRegisteredForEvent(event.id);
  return `
    <article class="ce-card overflow-hidden">
      ${coverGradient(event.image_theme)}
      <div class="flex h-full flex-col gap-2 p-4">
        <h3 class="font-semibold">${event.title}</h3>
        <p class="text-sm text-slate-500">📅 ${formatDateLabel(event.starts_at)}<br />📍 ${event.location}</p>
        <p class="text-sm text-slate-600">${event.description}</p>
        <p class="text-sm">${starsMarkup(ratings.average)} <span class="text-slate-500">(${ratings.total})</span></p>
        <div class="mt-auto flex gap-2 pt-2">
          <a href="${withIdParam("/pages/user/event-details.html", event.id)}" class="ce-btn-secondary flex-1 text-center">View Details</a>
          <button class="${registered ? "ce-btn-danger" : "ce-btn-primary"} event-register-btn" data-event-id="${event.id}">
            ${registered ? "Cancel" : "Register"}
          </button>
        </div>
      </div>
    </article>
  `;
}

function buildPaginationMarkup(totalPages) {
  if (totalPages <= 1) return "";
  const buttons = [];
  buttons.push(`<button class="page-btn h-9 w-9 rounded-lg ${currentPage === 1 ? "cursor-not-allowed opacity-50" : "border border-slate-200 bg-white"}" data-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""}>‹</button>`);
  for (let page = 1; page <= totalPages; page += 1) {
    buttons.push(`<button class="page-btn h-9 w-9 rounded-lg ${currentPage === page ? "bg-navy text-white" : "border border-slate-200 bg-white"}" data-page="${page}">${page}</button>`);
  }
  buttons.push(`<button class="page-btn h-9 w-9 rounded-lg ${currentPage === totalPages ? "cursor-not-allowed opacity-50" : "border border-slate-200 bg-white"}" data-page="${currentPage + 1}" ${currentPage === totalPages ? "disabled" : ""}>›</button>`);
  return `<nav class="mt-8 flex justify-center gap-1" aria-label="Pagination">${buttons.join("")}</nav>`;
}

function applyFilters() {
  const search = $("#events-search").val().trim().toLowerCase();
  const selectedLocation = $("#events-location").val();
  const selectedDate = $("#events-date").val();

  filteredEvents = allEvents.filter((event) => {
    const eventDate = event.starts_at.slice(0, 10);
    const matchesSearch = !search
      || event.title.toLowerCase().includes(search)
      || event.description.toLowerCase().includes(search)
      || event.location.toLowerCase().includes(search);
    const matchesLocation = selectedLocation === "all" || event.location === selectedLocation;
    const matchesDate = !selectedDate || selectedDate === eventDate;
    return matchesSearch && matchesLocation && matchesDate;
  });
  currentPage = 1;
  renderEvents();
}

function renderEvents() {
  if (!filteredEvents.length) {
    setEmptyState("#events-results", "No events matched your search. Try another date or location.");
    $("#events-pagination").empty();
    return;
  }

  const totalPages = Math.ceil(filteredEvents.length / PAGE_SIZE);
  const start = (currentPage - 1) * PAGE_SIZE;
  const pageItems = filteredEvents.slice(start, start + PAGE_SIZE);
  $("#events-results").html(pageItems.map(eventCardMarkup).join(""));
  $("#events-pagination").html(buildPaginationMarkup(totalPages));
}

if (enforcePageAccess()) {
  await loadPublicShell("../../components", { activeNav: "events" });
  setLoadingState("#events-list", true);
  try {
    allEvents = getPublishedEvents();
    const locations = Array.from(new Set(allEvents.map((event) => event.location)));

    $("#events-list").html(`
      ${sectionHeader("Discover Events", "Find civic events near you.")}
      <section class="ce-card mb-6 grid gap-3 p-4 sm:grid-cols-4">
        <input id="events-search" type="search" aria-label="Search events" placeholder="Search events" class="ce-input sm:col-span-2" />
        <input id="events-date" type="date" aria-label="Filter by date" class="ce-input" />
        <select id="events-location" aria-label="Filter by location" class="ce-input">
          <option value="all">All locations</option>
          ${locations.map((location) => `<option value="${location}">${location}</option>`).join("")}
        </select>
      </section>
      <section id="events-results" class="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"></section>
      <section id="events-pagination"></section>
    `);

    filteredEvents = allEvents;
    renderEvents();
  } catch (error) {
    setErrorState("#events-list", error.message);
  }
}

$(document).on("input change", "#events-search, #events-date, #events-location", applyFilters);

$(document).on("click", ".event-register-btn", (event) => {
  const eventId = $(event.currentTarget).data("eventId");
  if (isUserRegisteredForEvent(eventId)) {
    cancelRegistration(eventId);
    showSuccess("Registration cancelled.");
  } else {
    registerForEvent(eventId);
    showSuccess("Registration submitted.");
  }
  renderEvents();
});

$(document).on("click", ".page-btn", (event) => {
  const page = Number($(event.currentTarget).data("page"));
  if (!Number.isFinite(page) || page < 1) return;
  const totalPages = Math.ceil(filteredEvents.length / PAGE_SIZE);
  if (page > totalPages) return;
  currentPage = page;
  renderEvents();
});
