import { describe, expect, it, vi } from "vitest";
import { checklistReminderDate, sortChecklist, validDate } from "./checklist";

const item = (
  id: string,
  due: string,
  priority: "Tinggi" | "Sederhana" | "Rendah",
  assignedTo?: string,
) => ({ id, title: id, due, priority, assignedTo, done: false });
describe("checklist editing rules", () => {
  it("rejects impossible and malformed dates", () => {
    expect(validDate("2027-02-29")).toBe(false);
    expect(validDate("2028-02-29")).toBe(true);
    expect(validDate("29/02/2028")).toBe(false);
  });
  it("sorts without mutating the original list", () => {
    const source = [
      item("low", "2028-03-01", "Rendah"),
      item("high", "2028-04-01", "Tinggi"),
    ];
    expect(sortChecklist(source, "priority").map((x) => x.id)).toEqual([
      "high",
      "low",
    ]);
    expect(source[0].id).toBe("low");
  });
  it("sorts unassigned members last", () => {
    expect(
      sortChecklist(
        [
          item("none", "2028-01-01", "Tinggi"),
          item("amy", "2028-01-01", "Tinggi", "Amy"),
        ],
        "assignee",
      ).map((x) => x.id),
    ).toEqual(["amy", "none"]);
  });
  it("does not schedule reminders in the past", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2028-01-02T10:00:00"));
    expect(checklistReminderDate("2028-01-01")).toBeNull();
    expect(checklistReminderDate("2028-01-03")?.getHours()).toBe(9);
    vi.useRealTimers();
  });
});
