import { describe, expect, it } from "vitest";
import { paymentReminderDate, paymentStatus, paymentTotals } from "./payments";

const base = {
  id: "1",
  name: "Vendor",
  category: "Vendor",
  planned: 1000,
  paid: 400,
};
describe("vendor payments", () => {
  it("classifies paid, due, overdue and unscheduled balances", () => {
    expect(paymentStatus({ ...base, paid: 1000 }, "2026-11-02")).toBe("paid");
    expect(paymentStatus({ ...base, dueAt: "2026-11-03" }, "2026-11-02")).toBe(
      "due",
    );
    expect(paymentStatus({ ...base, dueAt: "2026-11-01" }, "2026-11-02")).toBe(
      "overdue",
    );
    expect(paymentStatus(base, "2026-11-02")).toBe("unscheduled");
  });
  it("sums balances without producing negative debt", () => {
    expect(
      paymentTotals([base, { ...base, id: "2", planned: 100, paid: 150 }]),
    ).toEqual({ planned: 1100, paid: 550, owed: 600 });
  });
  it("only creates future valid reminders", () => {
    const now = new Date("2026-11-02T08:00:00");
    expect(paymentReminderDate("2026-11-03", now)?.getHours()).toBe(9);
    expect(paymentReminderDate("2026-11-01", now)).toBeNull();
    expect(paymentReminderDate("bad", now)).toBeNull();
  });
});
