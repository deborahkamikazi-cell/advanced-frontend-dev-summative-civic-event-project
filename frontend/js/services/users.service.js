import { request } from "./api.js";

export function listUsers(params = {}) {
  return request({ method: "GET", endpoint: "/users", data: params });
}

export function getUserById(id) {
  return request({ method: "GET", endpoint: `/users/${id}` });
}

export function enableUser(id) {
  return request({ method: "PATCH", endpoint: `/users/${id}/enable` });
}

export function disableUser(id) {
  return request({ method: "PATCH", endpoint: `/users/${id}/disable` });
}

export function getMyProfile() {
  return request({ method: "GET", endpoint: "/users/profile/me" });
}

export function updateMyProfile(payload) {
  return request({ method: "PATCH", endpoint: "/users/profile/me", data: payload });
}
