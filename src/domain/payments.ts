import { BudgetItem } from "../domain";

export type PaymentStatus = "paid" | "due" | "overdue" | "unscheduled";

export function paymentStatus(item: BudgetItem, today: string): PaymentStatus {
  if (item.paid >= item.planned) return "paid";
  if (!item.dueAt) return "unscheduled";
  return item.dueAt < today ? "overdue" : "due";
}

export function paymentTotals(items: BudgetItem[]) {
  return items.reduce(
    (total, item) => {
      total.planned += item.planned;
      total.paid += item.paid;
      total.owed += Math.max(0, item.planned - item.paid);
      return total;
    },
    { planned: 0, paid: 0, owed: 0 },
  );
}

export function paymentReminderDate(dueAt?: string, now = new Date()) {
  if (!dueAt || !/^\d{4}-\d{2}-\d{2}$/.test(dueAt)) return null;
  const date = new Date(`${dueAt}T09:00:00`);
  return Number.isNaN(date.getTime()) || date <= now ? null : date;
}
