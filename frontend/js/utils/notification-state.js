import { withIdParam } from "./route.js";

const READ_STATE_KEY = "civicevents_notification_read_state";

function readState() {
  const raw = localStorage.getItem(READ_STATE_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveState(state) {
  localStorage.setItem(READ_STATE_KEY, JSON.stringify(state));
}

function formatCreatedLabel(createdAt) {
  if (!createdAt) return "Now";
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return "Now";
  return date.toLocaleDateString([], { day: "2-digit", month: "short" });
}

function resolveRelatedUrl(item) {
  const metadata = item.metadata || {};
  if (metadata.event_id) return withIdParam("/pages/user/event-details.html", metadata.event_id);
  if (metadata.announcement_id) return withIdParam("/pages/user/announcement-details.html", metadata.announcement_id);
  if (metadata.promo_id) return withIdParam("/pages/user/promo-details.html", metadata.promo_id);
  return "/pages/user/notifications.html";
}

export function normalizeNotification(item) {
  if (!item) return null;
  if (item.related_url) return item;
  return {
    id: item.id,
    type: item.type || "System",
    title: item.title,
    message: item.message,
    created_label: item.created_label || formatCreatedLabel(item.created_at),
    related_url: resolveRelatedUrl(item),
    read: Boolean(item.read)
  };
}

export function markNotificationReadLocal(id) {
  const state = readState();
  state[id] = true;
  saveState(state);
}

export function markAllNotificationsReadLocal(ids = []) {
  const state = readState();
  ids.forEach((id) => {
    state[id] = true;
  });
  saveState(state);
}

export function isNotificationRead(item) {
  const state = readState();
  if (!item?.id) return true;
  return Boolean(item.read || state[item.id]);
}
