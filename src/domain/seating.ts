import { Guest, SeatingTable } from "../domain";

export function tableOccupancy(tableId: string, guests: Guest[]) {
  return guests
    .filter((guest) => guest.tableId === tableId)
    .reduce((sum, guest) => sum + guest.pax, 0);
}
export function canAssignTable(
  table: SeatingTable,
  guest: Guest,
  guests: Guest[],
) {
  const occupiedWithoutGuest = guests
    .filter((item) => item.id !== guest.id && item.tableId === table.id)
    .reduce((sum, item) => sum + item.pax, 0);
  return occupiedWithoutGuest + guest.pax <= table.capacity;
}
export function clampTablePosition(
  x: number,
  y: number,
  width = 320,
  height = 460,
) {
  return {
    x: Math.max(0, Math.min(width - 100, Math.round(x))),
    y: Math.max(0, Math.min(height - 80, Math.round(y))),
  };
}
