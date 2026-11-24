import { request } from "./api.js";

export function signup(payload) {
  return request({
    method: "POST",
    endpoint: "/auth/signup",
    data: payload,
    requiresAuth: false
  });
}

export function login(payload) {
  return request({
    method: "POST",
    endpoint: "/auth/login",
    data: payload,
    requiresAuth: false
  });
}
