import { request } from "./api.js";

export function listAnnouncements(params = {}) {
  return request({ method: "GET", endpoint: "/announcements", data: params });
}

export function getAnnouncementById(id) {
  return request({ method: "GET", endpoint: `/announcements/${id}` });
}

export function createAnnouncement(formData) {
  return request({ method: "POST", endpoint: "/announcements", data: formData });
}

export function updateAnnouncement(id, formData) {
  return request({ method: "PUT", endpoint: `/announcements/${id}`, data: formData });
}

export function publishAnnouncement(id) {
  return request({ method: "PATCH", endpoint: `/announcements/${id}/publish` });
}

export function unpublishAnnouncement(id) {
  return request({ method: "PATCH", endpoint: `/announcements/${id}/unpublish` });
}

export function deleteAnnouncement(id) {
  return request({ method: "DELETE", endpoint: `/announcements/${id}` });
}
