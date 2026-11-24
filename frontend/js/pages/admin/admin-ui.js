import { formatDateLabel, sectionHeader } from "../user-ui.js";

export function adminPageHeader(title, subtitle = "", actionMarkup = "") {
  return sectionHeader(title, subtitle, actionMarkup);
}

export function statusBadge(text, variant = "green") {
  const classes = {
    green: "bg-green-100 text-green-700",
    red: "bg-red-100 text-red-700",
    amber: "bg-amber/20 text-amber-800"
  };
  return `<span class="rounded-full px-2 py-0.5 text-xs font-medium ${classes[variant] || classes.green}">${text}</span>`;
}

export function tableMarkup(headers, rowsHtml) {
  return `
    <div class="ce-card overflow-x-auto">
      <table class="w-full text-left text-sm">
        <thead class="bg-slate-50 text-slate-500">
          <tr>${headers.map((header) => `<th class="whitespace-nowrap px-4 py-3 font-medium">${header}</th>`).join("")}</tr>
        </thead>
        <tbody class="divide-y divide-slate-100">${rowsHtml}</tbody>
      </table>
    </div>
  `;
}

export function dataRow(cells) {
  return `<tr>${cells.map((cell) => `<td class="whitespace-nowrap px-4 py-3">${cell}</td>`).join("")}</tr>`;
}

export function formatDateTimeForInput(value) {
  if (!value) return "";
  const date = new Date(value);
  const pad = (num) => String(num).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export { formatDateLabel };
