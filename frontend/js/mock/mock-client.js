import { getCurrentMockUser, getMockState, saveCurrentMockUser, saveSessionToken, updateMockState } from "./mock-store.js";

export function getPublishedEvents() {
  return getMockState().events.filter((event) => event.published);
}

export function getEventById(eventId) {
  return getMockState().events.find((event) => event.id === eventId) || null;
}

export function getEventAverageRating(eventId) {
  const feedback = getMockState().feedback.filter((item) => item.event_id === eventId);
  if (!feedback.length) return { average: 0, total: 0 };
  const total = feedback.reduce((sum, item) => sum + item.rating, 0);
  return { average: total / feedback.length, total: feedback.length };
}

export function getEventFeedback(eventId) {
  const state = getMockState();
  return state.feedback
    .filter((item) => item.event_id === eventId)
    .map((item) => ({
      ...item,
      user: state.users.find((user) => user.id === item.user_id)
    }));
}

export function upsertFeedback(eventId, rating, comment) {
  const user = getCurrentMockUser();
  if (!user) return;
  updateMockState((state) => {
    const existing = state.feedback.find((item) => item.event_id === eventId && item.user_id === user.id);
    if (existing) {
      existing.rating = rating;
      existing.comment = comment;
      existing.created_at = new Date().toISOString();
      return state;
    }

    state.feedback.unshift({
      id: `f_${Date.now()}`,
      user_id: user.id,
      event_id: eventId,
      rating,
      comment,
      created_at: new Date().toISOString()
    });
    return state;
  });
}

export function isUserRegisteredForEvent(eventId) {
  const user = getCurrentMockUser();
  if (!user) return false;
  const state = getMockState();
  return state.registrations.some((item) => item.user_id === user.id && item.event_id === eventId && item.status === "registered");
}

export function registerForEvent(eventId) {
  const user = getCurrentMockUser();
  if (!user) return;
  updateMockState((state) => {
    const existing = state.registrations.find((item) => item.user_id === user.id && item.event_id === eventId);
    if (existing) {
      existing.status = "registered";
      existing.created_at = new Date().toISOString();
      return state;
    }

    state.registrations.push({
      id: `r_${Date.now()}`,
      user_id: user.id,
      event_id: eventId,
      status: "registered",
      created_at: new Date().toISOString()
    });
    return state;
  });
}

export function cancelRegistration(eventId) {
  const user = getCurrentMockUser();
  if (!user) return;
  updateMockState((state) => {
    const existing = state.registrations.find((item) => item.user_id === user.id && item.event_id === eventId);
    if (existing) {
      existing.status = "cancelled";
    }
    return state;
  });
}

export function getUserRegistrations() {
  const user = getCurrentMockUser();
  if (!user) return [];
  const state = getMockState();
  return state.registrations
    .filter((item) => item.user_id === user.id && item.status === "registered")
    .map((item) => ({
      ...item,
      event: state.events.find((event) => event.id === item.event_id)
    }))
    .filter((item) => Boolean(item.event));
}

export function getAnnouncements() {
  return getMockState().announcements;
}

export function getAnnouncementById(id) {
  return getMockState().announcements.find((item) => item.id === id) || null;
}

export function getPromos() {
  return getMockState().promos;
}

export function getPromoById(id) {
  return getMockState().promos.find((item) => item.id === id) || null;
}

export function getUserNotifications() {
  const user = getCurrentMockUser();
  if (!user) return [];
  return getMockState().notifications.filter((item) => item.user_id === user.id);
}

export function markNotificationRead(id) {
  updateMockState((state) => {
    const target = state.notifications.find((item) => item.id === id);
    if (target) target.read = true;
    return state;
  });
}

export function markAllNotificationsRead() {
  const user = getCurrentMockUser();
  if (!user) return;
  updateMockState((state) => {
    state.notifications
      .filter((item) => item.user_id === user.id)
      .forEach((item) => {
        item.read = true;
      });
    return state;
  });
}

export function getCurrentUserProfile() {
  return getCurrentMockUser();
}

export function updateCurrentUserProfile({ full_name, email }) {
  const current = getCurrentMockUser();
  if (!current) return null;

  const updated = { ...current, full_name, email };
  saveCurrentMockUser(updated);
  updateMockState((state) => {
    const target = state.users.find((item) => item.id === current.id);
    if (target) {
      target.full_name = full_name;
      target.email = email;
    }
    return state;
  });
  return updated;
}

// -----------------------------
// Auth (Mock)
// -----------------------------
export function getUserByEmail(email) {
  return getMockState().users.find((user) => user.email.toLowerCase() === String(email).toLowerCase()) || null;
}

export function loginWithMockCredentials({ email, password }) {
  const user = getUserByEmail(email);
  if (!user) {
    throw new Error("Invalid credentials.");
  }

  if (!user.is_active) {
    throw new Error("This account is disabled.");
  }

  if (user.password !== password) {
    throw new Error("Invalid credentials.");
  }

  saveSessionToken(`mock-token-${user.role}-${user.id}`);
  saveCurrentMockUser(user);
  return user;
}

export function createMockUser({ full_name, email, password, role = "user" }) {
  const existing = getUserByEmail(email);
  if (existing) {
    throw new Error("Email is already in use.");
  }

  const newUser = {
    id: createId("u"),
    full_name,
    email,
    role,
    is_active: true,
    password,
    created_at: new Date().toISOString().slice(0, 10)
  };

  updateMockState((state) => {
    state.users.unshift(newUser);
    return state;
  });

  return newUser;
}

function createId(prefix) {
  return `${prefix}_${Date.now()}`;
}

// -----------------------------
// Admin: Dashboard
// -----------------------------
export function getAdminDashboardData() {
  const state = getMockState();
  const total_events = state.events.length;
  const total_users = state.users.length;
  const total_registrations = state.registrations.filter((item) => item.status === "registered").length;
  const total_promos = state.promos.length;
  const unread_notifications = state.notifications.filter((item) => !item.read).length;

  const activity = [
    "Aline registered for Community Clean-Up Day",
    "New promo published",
    "User account status updated"
  ];

  return {
    total_events,
    total_users,
    total_registrations,
    total_promos,
    unread_notifications,
    monthly_event_registrations: [40, 55, 35, 70, 60, 85],
    recent_activity: activity,
    recent_events: state.events.slice(0, 3)
  };
}

// -----------------------------
// Admin: Events CRUD
// -----------------------------
export function getAllEvents() {
  return getMockState().events;
}

export function createAdminEvent(payload) {
  const event = {
    id: createId("e"),
    title: payload.title,
    description: payload.description || "",
    location: payload.location,
    starts_at: payload.starts_at,
    ends_at: payload.ends_at,
    published: payload.published ?? true,
    image_theme: payload.image_theme ?? 210
  };

  updateMockState((state) => {
    state.events.unshift(event);
    return state;
  });
  return event;
}

export function updateAdminEvent(id, payload) {
  let updated = null;
  updateMockState((state) => {
    const target = state.events.find((item) => item.id === id);
    if (!target) return state;
    Object.assign(target, payload);
    updated = target;
    return state;
  });
  return updated;
}

export function deleteAdminEvent(id) {
  updateMockState((state) => {
    state.events = state.events.filter((item) => item.id !== id);
    state.registrations = state.registrations.filter((item) => item.event_id !== id);
    state.feedback = state.feedback.filter((item) => item.event_id !== id);
    return state;
  });
}

export function setEventPublished(id, published) {
  return updateAdminEvent(id, { published: Boolean(published) });
}

// -----------------------------
// Admin: Announcements CRUD
// -----------------------------
export function getAllAnnouncements() {
  return getMockState().announcements;
}

export function createAdminAnnouncement(payload) {
  const created = {
    id: createId("an"),
    title: payload.title,
    created_at: new Date().toISOString(),
    duration: payload.duration || "2:00",
    audio_url: payload.audio_url || "",
    transcript: payload.transcript || "Transcript not available.",
    published: payload.published ?? true
  };
  updateMockState((state) => {
    state.announcements.unshift(created);
    return state;
  });
  return created;
}

export function updateAdminAnnouncement(id, payload) {
  let updated = null;
  updateMockState((state) => {
    const target = state.announcements.find((item) => item.id === id);
    if (!target) return state;
    Object.assign(target, payload);
    updated = target;
    return state;
  });
  return updated;
}

export function deleteAdminAnnouncement(id) {
  updateMockState((state) => {
    state.announcements = state.announcements.filter((item) => item.id !== id);
    return state;
  });
}

export function setAnnouncementPublished(id, published) {
  return updateAdminAnnouncement(id, { published: Boolean(published) });
}

// -----------------------------
// Admin: Promos CRUD
// -----------------------------
export function getAllPromos() {
  return getMockState().promos;
}

export function createAdminPromo(payload) {
  const created = {
    id: createId("p"),
    title: payload.title,
    description: payload.description,
    published_at: new Date().toISOString().slice(0, 10),
    video_url: payload.video_url || "",
    caption_text: payload.caption_text || "",
    transcript: payload.transcript || "",
    theme: payload.theme ?? 210,
    published: payload.published ?? true
  };
  updateMockState((state) => {
    state.promos.unshift(created);
    return state;
  });
  return created;
}

export function updateAdminPromo(id, payload) {
  let updated = null;
  updateMockState((state) => {
    const target = state.promos.find((item) => item.id === id);
    if (!target) return state;
    Object.assign(target, payload);
    updated = target;
    return state;
  });
  return updated;
}

export function deleteAdminPromo(id) {
  updateMockState((state) => {
    state.promos = state.promos.filter((item) => item.id !== id);
    return state;
  });
}

export function setPromoPublished(id, published) {
  return updateAdminPromo(id, { published: Boolean(published) });
}

// -----------------------------
// Admin: Users
// -----------------------------
export function getAllUsers() {
  return getMockState().users;
}

export function setUserActive(userId, is_active) {
  let updated = null;
  updateMockState((state) => {
    const user = state.users.find((item) => item.id === userId);
    if (!user) return state;
    user.is_active = Boolean(is_active);
    updated = user;
    return state;
  });

  const current = getCurrentMockUser();
  if (current && current.id === userId) {
    saveCurrentMockUser({ ...current, is_active: Boolean(is_active) });
  }
  return updated;
}

// -----------------------------
// Admin: Notifications
// -----------------------------
export function getAllNotifications() {
  return getMockState().notifications;
}

export function createAdminNotification(payload) {
  const created = {
    id: createId("n"),
    user_id: payload.user_id || "u1",
    type: payload.type || "System",
    title: payload.title,
    message: payload.message,
    created_label: payload.created_label || "Now",
    related_url: payload.related_url || "/pages/user/notifications.html",
    read: false
  };
  updateMockState((state) => {
    state.notifications.unshift(created);
    return state;
  });
  return created;
}

export function deleteAdminNotification(id) {
  updateMockState((state) => {
    state.notifications = state.notifications.filter((item) => item.id !== id);
    return state;
  });
}
