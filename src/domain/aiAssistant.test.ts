import { describe, expect, it } from "vitest";
import { validAiPrompt } from "./aiAssistant";

describe("AI assistant input", () => {
  it("accepts useful prompts", () =>
    expect(validAiPrompt("Tulis pantun menyambut tetamu")).toBe(true));
  it("rejects empty and oversized prompts", () => {
    expect(validAiPrompt(" x ")).toBe(false);
    expect(validAiPrompt("x".repeat(2001))).toBe(false);
  });
});
