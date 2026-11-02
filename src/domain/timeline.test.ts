import { describe, expect, it } from "vitest";
import {
  overlappingTimeline,
  sortTimeline,
  validTime,
  validTimelineRange,
} from "./timeline";

const item = {
  id: "1",
  title: "Akad",
  date: "2028-02-01",
  start: "10:00",
  end: "11:00",
};
describe("event timeline", () => {
  it("validates 24-hour times and increasing ranges", () => {
    expect(validTime("23:59")).toBe(true);
    expect(validTime("24:00")).toBe(false);
    expect(validTimelineRange("10:00", "09:00")).toBe(false);
    expect(validTimelineRange("10:00", "11:00")).toBe(true);
  });
  it("detects overlaps but permits adjacent slots", () => {
    expect(
      overlappingTimeline([item], {
        ...item,
        title: "Photos",
        start: "10:30",
        end: "11:30",
      }),
    ).toBe(true);
    expect(
      overlappingTimeline([item], {
        ...item,
        title: "Lunch",
        start: "11:00",
        end: "12:00",
      }),
    ).toBe(false);
  });
  it("sorts by date and time without mutating input", () => {
    const later = { ...item, id: "2", start: "12:00", end: "13:00" };
    const source = [later, item];
    expect(sortTimeline(source).map((x) => x.id)).toEqual(["1", "2"]);
    expect(source[0].id).toBe("2");
  });
});
