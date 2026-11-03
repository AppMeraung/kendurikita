import { describe, expect, it } from "vitest";
import { supportEmail } from "./support";

describe("supportEmail", () => {
  it("defaults to the KenduriKita support inbox", () => {
    expect(supportEmail(undefined)).toBe("support@kendurikita.com");
    expect(supportEmail("  ")).toBe("support@kendurikita.com");
  });
  it("uses a configured address when provided", () => {
    expect(supportEmail(" help@example.com ")).toBe("help@example.com");
  });
});
