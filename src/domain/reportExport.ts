import {
  budgetSummary,
  checklistProgress,
  guestSummary,
  money,
} from "../domain";
import { EventData } from "../state/AppState";

const escape = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]!,
  );

export function eventReportHtml(event: EventData) {
  const budget = budgetSummary(event.budget, event.totalBudget);
  const guests = guestSummary(event.guests);
  return `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Arial;padding:32px;color:#33241f}h1{color:#7a2434}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.card{border:1px solid #ddd;border-radius:10px;padding:14px}table{width:100%;border-collapse:collapse}td,th{padding:8px;border-bottom:1px solid #ddd;text-align:left}</style></head><body><h1>${escape(event.name)}</h1><p>${escape(event.date || "")} · ${escape(event.venue)}</p><div class="grid"><div class="card"><b>Budget</b><p>${money(budget.paid, event.country)} / ${money(event.totalBudget, event.country)}</p><p>Outstanding: ${money(budget.owed, event.country)}</p></div><div class="card"><b>Guests</b><p>${guests.confirmed} confirmed / ${guests.total} invited</p><p>${guests.pending} pending</p></div><div class="card"><b>Checklist</b><p>${checklistProgress(event.checklist)}%</p></div><div class="card"><b>Inventory</b><p>${event.inventory.filter((item) => item.status === "ready" || item.status === "distributed").length} / ${event.inventory.length} ready</p></div></div><h2>Vendor payments</h2><table><tr><th>Vendor / Item</th><th>Planned</th><th>Paid</th><th>Due</th></tr>${event.budget.map((item) => `<tr><td>${escape(item.vendor || item.name)}</td><td>${money(item.planned, event.country)}</td><td>${money(item.paid, event.country)}</td><td>${escape(item.dueAt || "-")}</td></tr>`).join("")}</table></body></html>`;
}
