import { describe, expect, it } from "vitest";
import { isoDay, monthCells } from "./calendar";

describe("monthCells", () => {
  it("starts November 2026 on a Sunday, so six blanks lead on a Monday-first grid", () => {
    const cells = monthCells(2026, 10);
    expect(cells.slice(0, 7)).toEqual([null, null, null, null, null, null, 1]);
    expect(cells.filter(Boolean)).toHaveLength(30);
    expect(cells.length % 7).toBe(0);
  });
  it("handles a leap February", () => expect(monthCells(2028, 1).filter(Boolean)).toHaveLength(29));
  it("needs no lead blanks when the month starts on Monday", () => expect(monthCells(2027, 1)[0]).toBe(1));
});

describe("isoDay", () => {
  it("pads month and day", () => expect(isoDay(2027, 0, 5)).toBe("2027-01-05"));
});
