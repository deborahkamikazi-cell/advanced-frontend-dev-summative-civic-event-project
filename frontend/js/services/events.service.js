import { request } from "./api.js";

export function listEvents(params = {}) {
  return request({ method: "GET", endpoint: "/events", data: params });
}

export function getEventById(eventId) {
  return request({ method: "GET", endpoint: `/events/${eventId}` });
}

export function createEvent(formData) {
  return request({ method: "POST", endpoint: "/events", data: formData });
}

export function updateEvent(eventId, formData) {
  return request({ method: "PUT", endpoint: `/events/${eventId}`, data: formData });
}

export function deleteEvent(eventId) {
  return request({ method: "DELETE", endpoint: `/events/${eventId}` });
}

export function submitFeedback(payload) {
  return request({ method: "POST", endpoint: "/event-feedback", data: payload });
}

export function updateFeedback(feedbackId, payload) {
  return request({ method: "PUT", endpoint: `/event-feedback/${feedbackId}`, data: payload });
}

export function getMyFeedback() {
  return request({ method: "GET", endpoint: "/event-feedback/my-feedback" });
}

export function getEventFeedbackForAdmin(eventId) {
  return request({ method: "GET", endpoint: `/event-feedback/event/${eventId}` });
}
