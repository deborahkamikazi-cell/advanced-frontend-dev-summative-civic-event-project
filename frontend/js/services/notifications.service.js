import { request } from "./api.js";

export function listNotifications() {
  return request({ method: "GET", endpoint: "/notifications" });
}

export function getNotificationById(id) {
  return request({ method: "GET", endpoint: `/notifications/${id}` });
}

export function deleteNotification(id) {
  return request({ method: "DELETE", endpoint: `/notifications/${id}` });
}
