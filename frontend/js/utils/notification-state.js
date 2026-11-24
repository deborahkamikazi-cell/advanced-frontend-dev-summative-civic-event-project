import { withIdParam } from "./route.js";
import { getCurrentUser } from "./storage.js";

const READ_STATE_KEY = "civicevents_notification_read_state";
export const NOTIFICATIONS_READ_EVENT = "civicevents:notifications-read";

function readStateKey() {
  return `${READ_STATE_KEY}:${getCurrentUser()?.id || "guest"}`;
}

function readState() {
  try {
    const raw = localStorage.getItem(readStateKey());
    if (!raw) return {};
    const state = JSON.parse(raw);
    if (!state || typeof state !== "object" || Array.isArray(state)) {
      throw new Error("Invalid notification read state.");
    }
    return state;
  } catch (error) {
    console.warn("Unable to restore local notification read state.", error);
    return {};
  }
}

function saveState(state) {
  localStorage.setItem(readStateKey(), JSON.stringify(state));
  window.dispatchEvent(new Event(NOTIFICATIONS_READ_EVENT));
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
  const type = String(item.type || "system").toLowerCase();
  return {
    id: item.id,
    type: type.charAt(0).toUpperCase() + type.slice(1),
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
