import { BudgetItem } from "../domain";

export function parentBudgetSummary(
  items: BudgetItem[],
  contributions: number[],
) {
  const byPayer = { bride: 0, groom: 0, shared: 0 };
  let planned = 0;
  let paid = 0;
  for (const item of items) {
    planned += Math.max(0, item.planned || 0);
    paid += Math.max(0, item.paid || 0);
    byPayer[item.payer || "shared"] += Math.max(0, item.planned || 0);
  }
  const familyContributions = contributions.reduce(
    (sum, value) => sum + Math.max(0, value || 0),
    0,
  );
  return {
    planned,
    paid,
    owed: Math.max(0, planned - paid - familyContributions),
    familyContributions,
    byPayer,
  };
}
