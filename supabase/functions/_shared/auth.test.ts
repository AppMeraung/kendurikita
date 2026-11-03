import { describe, expect, it } from "vitest";
import { bearerMatches } from "./auth";

describe("bearerMatches", () => {
  it("accepts the configured secret", () => {
    expect(bearerMatches("Bearer s3cret", "s3cret")).toBe(true);
  });
  it("rejects a wrong or missing header", () => {
    expect(bearerMatches("Bearer nope", "s3cret")).toBe(false);
    expect(bearerMatches(null, "s3cret")).toBe(false);
  });
  it("rejects everything when the secret is not configured", () => {
    expect(bearerMatches("Bearer undefined", undefined)).toBe(false);
    expect(bearerMatches("Bearer ", "")).toBe(false);
  });
});
