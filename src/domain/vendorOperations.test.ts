import { describe, expect, it } from "vitest";
import { availabilityConflict, validVendorPackage } from "./vendorOperations";
describe("vendor packages and availability", () => {
  it("validates package numbers", () => {
    expect(validVendorPackage("Gold", "1000", "100", "50")).toBe(true);
    expect(validVendorPackage("", "100", "1", "0")).toBe(false);
    expect(validVendorPackage("A", "-1", "1", "0")).toBe(false);
  });
  it("detects overlapping tentative/booked slots", () => {
    const entries = [
      {
        id: "1",
        start: "2026-12-01T08:00:00",
        end: "2026-12-01T18:00:00",
        status: "booked" as const,
      },
    ];
    expect(
      availabilityConflict(
        {
          start: "2026-12-01T12:00:00",
          end: "2026-12-01T20:00:00",
          status: "tentative",
        },
        entries,
      ),
    ).toBe(true);
    expect(
      availabilityConflict(
        {
          start: "2026-12-02T08:00:00",
          end: "2026-12-02T18:00:00",
          status: "booked",
        },
        entries,
      ),
    ).toBe(false);
  });
  it("allows informational available slots to overlap", () =>
    expect(
      availabilityConflict(
        {
          start: "2026-12-01T08:00:00",
          end: "2026-12-01T18:00:00",
          status: "available",
        },
        [],
      ),
    ).toBe(false));
});
