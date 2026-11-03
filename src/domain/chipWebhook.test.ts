/// <reference types="node" />
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const source = readFileSync(resolve("supabase/functions/kendurikita-chip-webhook/index.ts"), "utf8");

describe("CHIP webhook renewals", () => {
  it("adds a renewal after the current plan ends instead of from today", () => {
    expect(source).toContain("Math.max(Date.now(), current.data?.expires_at");
    expect(source).toContain("startsFrom + (isYear ? 365 : 31) * 86_400_000");
  });
  it("ignores the same payment so a retried webhook does not extend twice", () => {
    expect(source).toContain("provider_customer_id.is.null,provider_customer_id.neq.${paymentId}");
    expect(source).toContain("nullsFirst: false");
    expect(source).toContain('onConflict: "provider,provider_customer_id"');
  });
});
