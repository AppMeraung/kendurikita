import { UserPlan } from "./entitlements";

export function planFromEntitlements(keys: string[]): UserPlan {
  const normalized = keys.map((key) => key.toLowerCase());
  if (normalized.some((key) => key.includes("premium"))) return "premium";
  if (normalized.some((key) => key.includes("pro"))) return "pro";
  return "basic";
}

export function planAllows(
  plan: UserPlan,
  required: "basic" | "pro" | "premium",
) {
  const rank = { basic: 0, pro: 1, premium: 2 };
  return rank[plan] >= rank[required];
}
