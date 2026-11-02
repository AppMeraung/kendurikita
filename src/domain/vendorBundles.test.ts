import { describe, expect, it } from "vitest";
import { validBundle } from "./vendorBundles";

describe("vendor bundles", () => {
  const members = [
    { vendorId: "a", commission: 10 },
    { vendorId: "b", commission: 15 },
  ];
  it("accepts a multi-vendor bundle", () =>
    expect(validBundle("Pakej Lengkap", "5000", members)).toBe(true));
  it("rejects one vendor, duplicates and invalid commissions", () => {
    expect(validBundle("Pakej", "5000", members.slice(0, 1))).toBe(false);
    expect(
      validBundle("Pakej", "5000", [
        members[0],
        { vendorId: "a", commission: 10 },
      ]),
    ).toBe(false);
    expect(
      validBundle("Pakej", "5000", [
        members[0],
        { vendorId: "b", commission: 101 },
      ]),
    ).toBe(false);
  });
});
