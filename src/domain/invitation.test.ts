import { describe, expect, it } from "vitest";
import { invitationShareText, invitationUrl, whatsappUrl } from "./invitation";

describe("digital invitation links", () => {
  it("builds an RSVP URL without duplicate slashes", () => {
    expect(invitationUrl("https://example.com/", "abc")).toBe(
      "https://example.com/rsvp/abc",
    );
  });
  it("encodes WhatsApp text and strips phone punctuation", () => {
    expect(whatsappUrl("+60 12-345 6789", "A & B")).toBe(
      "https://wa.me/60123456789?text=A%20%26%20B",
    );
  });
  it("includes the guest and unique link", () => {
    expect(
      invitationShareText("Jemput hadir", "Aminah", "https://x/rsvp/1"),
    ).toContain("Aminah\n\nhttps://x/rsvp/1");
  });
});
