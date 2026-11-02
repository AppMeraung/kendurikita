import { describe, expect, it } from "vitest";
import {
  cateringQuantities,
  monthlySavings,
  referralReward,
  savingsProgress,
} from "./calculators";

describe("Phase 6 calculators", () => {
  it("calculates monthly savings without division by zero", () => {
    expect(
      monthlySavings(
        12000,
        2000,
        new Date("2027-11-01"),
        new Date("2026-11-01"),
      ),
    ).toBe(834);
    expect(
      monthlySavings(
        1000,
        1000,
        new Date("2026-11-01"),
        new Date("2026-11-01"),
      ),
    ).toBe(0);
  });

  it("rejects invalid savings inputs", () => {
    expect(monthlySavings(-1, 0, new Date("2027-01-01"))).toBe(0);
    expect(monthlySavings(100, 0, new Date("invalid"))).toBe(0);
    expect(savingsProgress(0, 50)).toBe(0);
    expect(savingsProgress(100, 150)).toBe(100);
  });

  it("rejects negative and non-finite pax", () => {
    expect(cateringQuantities(-2).riceKg).toBe(0);
    expect(cateringQuantities(Number.NaN).plates).toBe(0);
  });

  it("adds practical catering buffers", () => {
    expect(cateringQuantities(100)).toEqual({
      riceKg: 10,
      chickenKg: 12,
      beefKg: 8,
      vegetablesKg: 8,
      oilLitres: 2,
      plates: 111,
      cups: 120,
      tables: 10,
    });
  });

  it("requires earned referral thresholds", () => {
    expect(referralReward("user", 2)).toBeNull();
    expect(referralReward("user", 3)).toBe("event_pro");
    expect(referralReward("vendor", 1)).toBe("vendor_month");
  });
});
