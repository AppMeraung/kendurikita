import { describe, expect, it } from "vitest";
import { MAX_DOCUMENT_BYTES, validEventDocument } from "./documents";

describe("event document validation", () => {
  it("accepts PDFs and images within 10 MB", () => {
    expect(validEventDocument("application/pdf", 1000)).toBe(true);
    expect(validEventDocument("image/jpeg", MAX_DOCUMENT_BYTES)).toBe(true);
  });
  it("rejects unsupported, empty and oversized files", () => {
    expect(validEventDocument("text/html", 100)).toBe(false);
    expect(validEventDocument("application/pdf", 0)).toBe(false);
    expect(validEventDocument("image/png", MAX_DOCUMENT_BYTES + 1)).toBe(false);
  });
});
