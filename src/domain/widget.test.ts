import { describe, expect, it } from "vitest";
import type { EventData } from "../state/AppState";
import { widgetSnapshot } from "./widget";

const event = {
  name: "Majlis Ali",
  date: "2026-11-12",
  checklist: [
    { id: "1", title: "Siap", due: "", done: true, priority: "Rendah" },
    {
      id: "2",
      title: "Tempah katering",
      due: "",
      done: false,
      priority: "Tinggi",
    },
  ],
} as EventData;

describe("event widget snapshot", () => {
  it("shows days left and the next unfinished task", () => {
    expect(widgetSnapshot(event, new Date("2026-11-02T12:00:00"))).toEqual({
      eventName: "Majlis Ali",
      daysLeft: 10,
      nextTask: "Tempah katering",
    });
  });
  it("handles missing events and past dates safely", () => {
    expect(widgetSnapshot(null).daysLeft).toBe(0);
    expect(
      widgetSnapshot({ ...event, date: "2020-01-01" }, new Date("2026-11-02"))
        .daysLeft,
    ).toBe(0);
  });
});
