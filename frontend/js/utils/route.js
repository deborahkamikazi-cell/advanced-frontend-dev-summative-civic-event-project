export function withIdParam(path, id) {
  const encoded = encodeURIComponent(id);
  return `${path}?id=${encoded}#id=${encoded}`;
}

export function getLocationParam(name) {
  const queryValue = new URLSearchParams(window.location.search).get(name);
  if (queryValue) return queryValue;

  const hash = String(window.location.hash || "").replace(/^#/, "");
  if (!hash) return null;

  const hashParams = new URLSearchParams(hash);
  const hashValue = hashParams.get(name);
  if (hashValue) return hashValue;

  if (name === "id") return decodeURIComponent(hash);
  return null;
}

export function isPathPage(pageName) {
  const pathname = window.location.pathname;
  return pathname.endsWith(`/${pageName}`) || pathname.endsWith(`/${pageName}.html`);
}
