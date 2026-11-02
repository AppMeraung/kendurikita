import { describe, expect, it } from "vitest";
import { planAllows, planFromEntitlements } from "./plans";

describe("package entitlement resolution", () => {
  it("defaults to basic and recognizes active package keys", () => {
    expect(planFromEntitlements([])).toBe("basic");
    expect(planFromEntitlements(["event_pro"])).toBe("pro");
    expect(planFromEntitlements(["user_premium"])).toBe("premium");
  });

  it("does not unlock a higher package", () => {
    expect(planAllows("basic", "pro")).toBe(false);
    expect(planAllows("pro", "premium")).toBe(false);
    expect(planAllows("premium", "pro")).toBe(true);
  });
});
