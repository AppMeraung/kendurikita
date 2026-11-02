import { describe, expect, it } from "vitest";
import { validRsvpPax, validRsvpToken } from "./rsvp";

describe("RSVP validation", () => {
  it("accepts UUID tokens", () =>
    expect(validRsvpToken("550e8400-e29b-41d4-a716-446655440000")).toBe(true));
  it("rejects malformed and injected values", () => {
    expect(validRsvpToken("nope")).toBe(false);
    expect(validRsvpToken("' or 1=1 --")).toBe(false);
  });
  it("accepts whole pax within the invitation limit", () => {
    expect(validRsvpPax("2", 2)).toBe(true);
    expect(validRsvpPax(1, 4)).toBe(true);
  });
  it("rejects zero, fractions and pax above the invitation limit", () => {
    expect(validRsvpPax(0, 2)).toBe(false);
    expect(validRsvpPax(1.5, 2)).toBe(false);
    expect(validRsvpPax(3, 2)).toBe(false);
  });
});
