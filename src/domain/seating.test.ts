import { describe, expect, it } from "vitest";
import { canAssignTable, clampTablePosition, tableOccupancy } from "./seating";

const table = {
  id: "t1",
  name: "VIP",
  shape: "round" as const,
  capacity: 10,
  x: 0,
  y: 0,
};
const guests = [
  {
    id: "g1",
    name: "A",
    group: "",
    pax: 8,
    rsvp: "Hadir" as const,
    tableId: "t1",
  },
  { id: "g2", name: "B", group: "", pax: 3, rsvp: "Hadir" as const },
];
describe("seating plan", () => {
  it("counts occupancy by pax", () =>
    expect(tableOccupancy("t1", guests)).toBe(8));
  it("rejects over-capacity assignment and permits reassignment of the same guest", () => {
    expect(canAssignTable(table, guests[1], guests)).toBe(false);
    expect(canAssignTable(table, guests[0], guests)).toBe(true);
  });
  it("keeps dragged tables inside the plan", () => {
    expect(clampTablePosition(-20, 999)).toEqual({ x: 0, y: 380 });
    expect(clampTablePosition(50.4, 20.6)).toEqual({ x: 50, y: 21 });
  });
});
