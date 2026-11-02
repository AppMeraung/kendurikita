import { describe, expect, it } from "vitest";
import {
  validFoundedYear,
  validVendorUrl,
  vendorProfileCompleteness,
  VendorProfileDraft,
} from "./vendorProfile";
const empty = Object.fromEntries(
  [
    "company",
    "ssm",
    "businessType",
    "ownerName",
    "phone",
    "email",
    "address",
    "state",
    "coverage",
    "foundedYear",
    "languages",
    "description",
    "deposit",
    "cancellation",
    "rescheduling",
  ].map((key) => [key, ""]),
) as VendorProfileDraft;
describe("vendor profile", () => {
  it("starts empty and reaches 100% with requirements and documents", () => {
    expect(vendorProfileCompleteness(empty, 0, false, false)).toBe(0);
    const full = Object.fromEntries(
      Object.keys(empty).map((key) => [key, "x"]),
    ) as VendorProfileDraft;
    expect(vendorProfileCompleteness(full, 1, true, true)).toBe(100);
  });
  it("validates founded year", () => {
    expect(validFoundedYear("2020", 2026)).toBe(true);
    expect(validFoundedYear("1700", 2026)).toBe(false);
    expect(validFoundedYear("2030", 2026)).toBe(false);
  });
});

describe("vendor public links", () => {
  it("accepts empty or HTTPS links and rejects unsafe schemes", () => {
    expect(validVendorUrl("")).toBe(true);
    expect(validVendorUrl("https://instagram.com/vendor")).toBe(true);
    expect(validVendorUrl("http://example.com")).toBe(false);
    expect(validVendorUrl("javascript:alert(1)")).toBe(false);
  });
});
