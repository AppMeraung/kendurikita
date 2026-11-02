import { describe, expect, it } from "vitest";
import { validPortfolioVideo, validReview } from "./vendorMedia";

describe("vendor media and reviews", () => {
  it("accepts only supported HTTPS video links", () => {
    expect(validPortfolioVideo("https://youtu.be/abc")).toBe(true);
    expect(validPortfolioVideo("https://www.tiktok.com/@vendor/video/1")).toBe(
      true,
    );
    expect(validPortfolioVideo("http://youtube.com/a")).toBe(false);
    expect(validPortfolioVideo("https://evil.example/a")).toBe(false);
    expect(validPortfolioVideo("not-a-url")).toBe(false);
  });

  it("validates review rating and body", () => {
    expect(validReview(5, "Great")).toBe(true);
    expect(validReview(0, "Great")).toBe(false);
    expect(validReview(4.5, "Great")).toBe(false);
    expect(validReview(5, "x")).toBe(false);
    expect(validReview(5, "x".repeat(1001))).toBe(false);
  });
});
