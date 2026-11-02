import { describe, expect, it } from "vitest";
import { validHelpVideo } from "./help";

describe("help video", () => {
  it("accepts only HTTPS YouTube links", () => {
    expect(validHelpVideo("https://youtu.be/abc")).toBe(true);
    expect(validHelpVideo("https://www.youtube.com/watch?v=abc")).toBe(true);
    expect(validHelpVideo("http://youtube.com/watch?v=abc")).toBe(false);
    expect(validHelpVideo("https://example.com/video")).toBe(false);
    expect(validHelpVideo("")).toBe(false);
  });
});
