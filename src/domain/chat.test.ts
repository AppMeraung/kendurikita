import { describe, expect, it } from "vitest";
import {
  MAX_CHAT_ATTACHMENT_BYTES,
  validChatAttachment,
  validChatMessage,
} from "./chat";
describe("vendor chat validation", () => {
  it("accepts text or an attachment", () => {
    expect(validChatMessage("Hello", false)).toBe(true);
    expect(validChatMessage("", true)).toBe(true);
  });
  it("rejects empty messages and unsafe attachments", () => {
    expect(validChatMessage(" ", false)).toBe(false);
    expect(validChatAttachment("text/html", 100)).toBe(false);
    expect(
      validChatAttachment("image/jpeg", MAX_CHAT_ATTACHMENT_BYTES + 1),
    ).toBe(false);
  });
  it("accepts images and PDFs within 10 MB", () => {
    expect(validChatAttachment("image/png", 100)).toBe(true);
    expect(
      validChatAttachment("application/pdf", MAX_CHAT_ATTACHMENT_BYTES),
    ).toBe(true);
  });
});
