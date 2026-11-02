import { Guest, SeatingTable } from "../domain";
import { tableOccupancy } from "./seating";
const escape = (value: string | number) =>
  String(value).replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ]!,
  );
export function seatingHtml(
  eventName: string,
  tables: SeatingTable[],
  guests: Guest[],
) {
  const rows = tables
    .map(
      (table) =>
        `<section><h2>${escape(table.name)} · ${table.shape}</h2><p>${tableOccupancy(table.id, guests)}/${table.capacity}</p><ul>${guests
          .filter((guest) => guest.tableId === table.id)
          .map(
            (guest) =>
              `<li>${escape(guest.name)} (${guest.pax} pax)${guest.dietary ? ` — ${escape(guest.dietary)}` : ""}</li>`,
          )
          .join("")}</ul></section>`,
    )
    .join("");
  const unassigned = guests
    .filter((guest) => !guest.tableId)
    .map((guest) => `<li>${escape(guest.name)} (${guest.pax} pax)</li>`)
    .join("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Arial;padding:28px;color:#271A1E}h1,h2{color:#9C123C}section{border:1px solid #E9DADD;border-radius:12px;padding:12px;margin:12px 0}</style></head><body><h1>${escape(eventName)}</h1>${rows}<section><h2>Unassigned</h2><ul>${unassigned}</ul></section></body></html>`;
}
