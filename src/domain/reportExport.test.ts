import { describe, expect, it } from "vitest";
import { eventReportHtml } from "./reportExport";

const event: any = {
  name: "<Majlis>",
  date: null,
  venue: "Dewan",
  country: "MY",
  totalBudget: 1000,
  budget: [],
  guests: [],
  checklist: [],
  inventory: [],
};
describe("event report export", () => {
  it("includes event summary sections", () => {
    const html = eventReportHtml(event);
    expect(html).toContain("Budget");
    expect(html).toContain("Guests");
    expect(html).toContain("Checklist");
  });
  it("escapes user supplied event text", () => {
    expect(eventReportHtml(event)).toContain("&lt;Majlis&gt;");
    expect(eventReportHtml(event)).not.toContain("<Majlis>");
  });
});
