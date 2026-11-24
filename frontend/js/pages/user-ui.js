export function formatDateLabel(value) {
  const date = new Date(value);
  return date.toLocaleString([], {
    weekday: "short",
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function formatShortDate(value) {
  return new Date(value).toLocaleDateString([], {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

export function starsMarkup(rating) {
  const full = Math.max(0, Math.min(5, Math.round(rating)));
  return `<span class="text-amber" aria-label="${full} out of 5 stars">${"★".repeat(full)}${"☆".repeat(5 - full)}</span>`;
}

export function coverGradient(theme = 210, classes = "h-40") {
  return `<div class="${classes} flex items-end p-3 text-3xl text-white" style="background:linear-gradient(135deg,hsl(${theme} 70% 30%),hsl(${theme + 35} 80% 55%))" role="img" aria-label="Event photo placeholder">🏛️</div>`;
}

export function sectionHeader(title, subtitle = "", extra = "") {
  return `
    <div class="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 class="text-2xl font-bold text-navy sm:text-3xl">${title}</h1>
        <p class="text-sm text-slate-500">${subtitle}</p>
      </div>
      ${extra}
    </div>
  `;
}
