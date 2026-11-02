import { describe, expect, it } from "vitest";
import {
  allocatedCategoryBudget,
  normalizeBudgetCategories,
  suggestedBudgetCategories,
} from "./budgetCategories";

describe("budget categories", () => {
  it("starts with all eight suggested categories", () => {
    expect(suggestedBudgetCategories()).toHaveLength(8);
  });

  it("keeps custom categories found in imported expenses", () => {
    const result = normalizeBudgetCategories(undefined, ["Katering", "Kanopi"]);
    expect(result.map((category) => category.name)).toContain("Kanopi");
    expect(result.filter((category) => category.name === "Katering")).toHaveLength(1);
  });

  it("uses an optional percentage allocation", () => {
    expect(allocatedCategoryBudget(20_000, { id: "food", name: "Food", percent: 35 }, 1_000)).toBe(7_000);
    expect(allocatedCategoryBudget(20_000, { id: "food", name: "Food" }, 1_000)).toBe(1_000);
  });
});
