import { request } from "./api.js";

export function getAdminDashboardStats() {
  return request({ method: "GET", endpoint: "/dashboard/admin" });
}

export function getUserDashboardStats() {
  return request({ method: "GET", endpoint: "/dashboard/me" });
}
