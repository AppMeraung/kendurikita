/// <reference types="node" />
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const sql = readFileSync(
  resolve("supabase/migrations/202611020010_invoices_and_deposits.sql"),
  "utf8",
);

describe("invoice payment migration", () => {
  it("creates one invoice per accepted quotation", () => {
    expect(sql).toContain("quotation_id uuid unique");
    expect(sql).toContain("on conflict(quotation_id) do nothing");
    expect(sql).toContain("q.status = 'accepted'");
  });
  it("rejects invalid, unauthorised and excessive payments", () => {
    expect(sql).toContain("if payment_amount <= 0");
    expect(sql).toContain("kendurikita.can_edit_event(invoice_row.event_id)");
    expect(sql).toContain("amount_exceeds_balance");
  });
  it("records the first payment as deposit and closes a fully paid invoice", () => {
    expect(sql).toContain("when paid_total=0 then 'deposit'");
    expect(sql).toContain("then 'paid' else 'partial'");
  });
});
