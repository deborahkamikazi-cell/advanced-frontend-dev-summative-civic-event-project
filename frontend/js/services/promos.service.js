import { request } from "./api.js";

export function listPromos(params = {}) {
  return request({ method: "GET", endpoint: "/promos", data: params });
}

export function getPromoById(id) {
  return request({ method: "GET", endpoint: `/promos/${id}` });
}

export function createPromo(formData) {
  return request({ method: "POST", endpoint: "/promos", data: formData });
}

export function updatePromo(id, formData) {
  return request({ method: "PUT", endpoint: `/promos/${id}`, data: formData });
}

export function publishPromo(id) {
  return request({ method: "PATCH", endpoint: `/promos/${id}/publish` });
}

export function unpublishPromo(id) {
  return request({ method: "PATCH", endpoint: `/promos/${id}/unpublish` });
}

export function deletePromo(id) {
  return request({ method: "DELETE", endpoint: `/promos/${id}` });
}
