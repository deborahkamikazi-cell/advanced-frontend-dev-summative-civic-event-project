export function formatDateTime(value) {
  if (!value) return "-";
  return new Date(value).toLocaleString();
}

export function formatRole(role) {
  if (!role) return "-";
  return role.charAt(0).toUpperCase() + role.slice(1);
}
