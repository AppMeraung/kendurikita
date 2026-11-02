import { describe, expect, it } from "vitest";
import { eventInviteUrl } from "./eventInvite";

describe("event member invites", () => {
  it("builds a stable join URL", () => {
    expect(eventInviteUrl("https://example.com/", "abc-123")).toBe("https://example.com/join/abc-123");
  });
  it("encodes an unsafe token defensively", () => {
    expect(eventInviteUrl("https://example.com", "a/b")).toContain("a%2Fb");
  });
});
