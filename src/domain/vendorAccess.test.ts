import { describe, expect, it } from "vitest";
import { vendorAccessAllowed } from "./vendorAccess";

describe("vendorAccessAllowed", () => {
  it("allows vendor tools on the website", () => {
    expect(vendorAccessAllowed("web")).toBe(true);
  });
  it("blocks vendor tools in the Android and iOS apps", () => {
    expect(vendorAccessAllowed("android")).toBe(false);
    expect(vendorAccessAllowed("ios")).toBe(false);
  });
});
