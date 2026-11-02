export type BudgetCategory = {
  id: string;
  name: string;
  percent?: number;
};

export const suggestedBudgetCategories = (): BudgetCategory[] => [
  { id: "hall", name: "Dewan" },
  { id: "catering", name: "Katering" },
  { id: "dais", name: "Pelamin" },
  { id: "attire", name: "Busana" },
  { id: "photo-video", name: "Foto & Video" },
  { id: "hantaran", name: "Hantaran" },
  { id: "door-gift", name: "Door gift" },
  { id: "other", name: "Lain-lain" },
];

export function normalizeBudgetCategories(
  categories: BudgetCategory[] | undefined,
  itemCategories: string[] = [],
) {
  const base = categories?.length ? categories : suggestedBudgetCategories();
  const names = new Set(base.map((category) => category.name.toLowerCase()));
  return [
    ...base,
    ...itemCategories
      .filter((name) => name.trim() && !names.has(name.trim().toLowerCase()))
      .map((name, index) => ({ id: `imported-${index}-${name}`, name })),
  ];
}

export function allocatedCategoryBudget(
  totalBudget: number,
  category: BudgetCategory,
  itemPlanned: number,
) {
  return category.percent === undefined
    ? itemPlanned
    : (totalBudget * category.percent) / 100;
}
