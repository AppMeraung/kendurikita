import { describe, expect, it } from "vitest";
import { TimelineItem } from "../domain";
import { liveTimeline } from "./dayMode";

const items: TimelineItem[] = [
  {
    id: "2",
    title: "Makan",
    date: "2026-11-02",
    start: "12:00",
    end: "13:00",
  },
  {
    id: "1",
    title: "Ketibaan",
    date: "2026-11-02",
    start: "10:00",
    end: "11:00",
  },
];

describe("Hari Majlis timeline", () => {
  it("finds the current and next item in chronological order", () => {
    const result = liveTimeline(items, new Date("2026-11-02T10:30:00"));
    expect(result.current?.id).toBe("1");
    expect(result.next?.id).toBe("2");
  });

  it("returns no current item outside the schedule", () => {
    const result = liveTimeline(items, new Date("2026-11-03T10:30:00"));
    expect(result.current).toBeUndefined();
    expect(result.next).toBeUndefined();
  });
});
