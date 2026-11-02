import { describe, expect, it } from "vitest";
import { quotationHtml, quotationTotal, validQuotationLine } from "./quotation";
describe("quotation workflow", () => {
  it("calculates line totals", () =>
    expect(
      quotationTotal([{ description: "A", quantity: 2, unitPrice: 500 }]),
    ).toBe(1000));
  it("rejects empty, fractional quantity and negative price", () => {
    expect(
      validQuotationLine({ description: "", quantity: 1, unitPrice: 1 }),
    ).toBe(false);
    expect(
      validQuotationLine({ description: "A", quantity: 1.5, unitPrice: 1 }),
    ).toBe(false);
    expect(
      validQuotationLine({ description: "A", quantity: 1, unitPrice: -1 }),
    ).toBe(false);
  });
  it("escapes quotation HTML", () =>
    expect(quotationHtml("Q1", "<Vendor>", [])).toContain("&lt;Vendor&gt;"));
});
