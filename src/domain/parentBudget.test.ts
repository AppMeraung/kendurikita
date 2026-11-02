import { describe, expect, it } from "vitest";
import { BudgetItem } from "../domain";
import { parentBudgetSummary } from "./parentBudget";

const items: BudgetItem[] = [
  { id: "1", name: "A", category: "x", planned: 100, paid: 20, payer: "bride" },
  { id: "2", name: "B", category: "x", planned: 200, paid: 50, payer: "groom" },
  { id: "3", name: "C", category: "x", planned: 300, paid: 100 },
];

describe("shared parent budget", () => {
  it("splits planned totals and applies family contributions", () => {
    expect(parentBudgetSummary(items, [50, 30])).toEqual({
      planned: 600,
      paid: 170,
      owed: 350,
      familyContributions: 80,
      byPayer: { bride: 100, groom: 200, shared: 300 },
    });
  });

  it("does not allow negative balances or contributions", () => {
    expect(parentBudgetSummary(items, [1000, -10]).owed).toBe(0);
  });
});
