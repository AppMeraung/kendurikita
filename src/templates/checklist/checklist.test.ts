import { describe, expect, it } from "vitest";
import { createChecklistForEvent, createMalayWeddingChecklist } from ".";

describe("Malay wedding checklist template", () => {
  it("contains exactly 100 editable suggestions", () => {
    const tasks = createMalayWeddingChecklist(null);
    expect(tasks).toHaveLength(100);
    expect(new Set(tasks.map((task) => task.id)).size).toBe(100);
    expect(tasks.every((task) => !task.done)).toBe(true);
  });

  it("calculates due dates relative to the event date", () => {
    const tasks = createMalayWeddingChecklist("2027-12-31");
    expect(tasks[85].due).toBe("2027-12-31");
    expect(tasks[95].due).toBe("2028-01-07");
  });
});

describe("cultural event templates", () => {
  const types = [
    "Chinese wedding",
    "Indian wedding",
    "Indonesian wedding",
    "Pertunangan",
    "Aqiqah",
    "Majlis Hari Jadi",
    "Majlis Korporat",
  ];
  it.each(types)("%s has its own translated, dated suggestions", (type) => {
    const tasks = createChecklistForEvent(
      type,
      "2028-12-31",
      (key) => `translated:${key}`,
    );
    expect(tasks.length).toBeGreaterThanOrEqual(10);
    expect(tasks.every((task) => task.title.startsWith("translated:"))).toBe(
      true,
    );
    expect(tasks.every((task) => /^\d{4}-\d{2}-\d{2}$/.test(task.due))).toBe(
      true,
    );
    expect(new Set(tasks.map((task) => task.id)).size).toBe(tasks.length);
  });
  it("returns no unrelated template for an unknown type", () =>
    expect(createChecklistForEvent("Unknown", null)).toEqual([]));
});
