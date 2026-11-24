import { request } from "./api.js";

export function registerForEvent(eventId) {
  return request({ method: "POST", endpoint: "/event-registrations/register", data: { event_id: eventId } });
}

export function cancelEventRegistration(eventId) {
  return request({ method: "POST", endpoint: "/event-registrations/cancel", data: { event_id: eventId } });
}

export function getMyRegistrations() {
  return request({ method: "GET", endpoint: "/event-registrations/my-registrations" });
}

export function getEventAttendees(eventId) {
  return request({ method: "GET", endpoint: `/event-registrations/event/${eventId}/attendees` });
}
