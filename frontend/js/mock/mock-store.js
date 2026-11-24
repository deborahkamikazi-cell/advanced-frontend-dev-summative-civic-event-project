import { APP_CONFIG } from "../config/config.js";
import { MOCK_USERS } from "./users.mock.js";
import { MOCK_EVENTS } from "./events.mock.js";
import { MOCK_ANNOUNCEMENTS } from "./announcements.mock.js";
import { MOCK_PROMOS } from "./promos.mock.js";
import { MOCK_NOTIFICATIONS } from "./notifications.mock.js";
import { MOCK_REGISTRATIONS } from "./registrations.mock.js";
import { MOCK_FEEDBACK } from "./feedback.mock.js";
import { MOCK_DASHBOARD } from "./dashboard.mock.js";

const DB_KEY = "civicevents_mock_db_v1";
const SESSION_USER_KEY = APP_CONFIG.SESSION_STORAGE_KEYS.USER;
const SESSION_TOKEN_KEY = APP_CONFIG.SESSION_STORAGE_KEYS.TOKEN;

function seedState() {
  return {
    users: MOCK_USERS,
    events: MOCK_EVENTS,
    announcements: MOCK_ANNOUNCEMENTS,
    promos: MOCK_PROMOS,
    notifications: MOCK_NOTIFICATIONS,
    registrations: MOCK_REGISTRATIONS,
    feedback: MOCK_FEEDBACK,
    dashboard: MOCK_DASHBOARD
  };
}

function readState() {
  const raw = localStorage.getItem(DB_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveState(state) {
  localStorage.setItem(DB_KEY, JSON.stringify(state));
  return state;
}

export function initMockStore() {
  const existing = readState();
  if (!existing) {
    saveState(seedState());
  }
}

export function getMockState() {
  initMockStore();
  return readState();
}

export function updateMockState(updater) {
  const current = getMockState();
  const next = updater(structuredClone(current));
  return saveState(next);
}

export function ensureDemoSession() {
  initMockStore();
}

export function getCurrentMockUser() {
  initMockStore();
  const raw = sessionStorage.getItem(SESSION_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function saveCurrentMockUser(user) {
  sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
}

export function saveSessionToken(token) {
  sessionStorage.setItem(SESSION_TOKEN_KEY, token);
}

export function clearMockSession() {
  sessionStorage.removeItem(SESSION_USER_KEY);
  sessionStorage.removeItem(SESSION_TOKEN_KEY);
}
