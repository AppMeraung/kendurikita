import { describe, expect, it } from "vitest";
import {
  normalizeReferralCode,
  referralProgress,
  validReferralCode,
} from "./referrals";

describe("referrals", () => {
  it("normalizes and validates fixed-length codes", () => {
    expect(normalizeReferralCode(" ab12-cd34ef ")).toBe("AB12CD34EF");
    expect(validReferralCode("ab12-cd34ef")).toBe(true);
    expect(validReferralCode("short")).toBe(false);
  });

  it("caps progress at the earned threshold", () => {
    expect(referralProgress("user", 4)).toEqual({ target: 3, active: 3 });
    expect(referralProgress("vendor", -1)).toEqual({ target: 1, active: 0 });
  });
});
