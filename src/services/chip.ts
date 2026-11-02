import { supabase } from "./supabase";

export type ChipVendorPlan = "vendor_pro" | "vendor_premium";
export type ChipPeriod = "month" | "year";
export const chipPaymentsEnabled = process.env.EXPO_PUBLIC_VENDOR_COMMISSION_ENABLED === "true";

export async function createChipVendorPurchase(plan: ChipVendorPlan, period: ChipPeriod) {
  if (!chipPaymentsEnabled) throw new Error("chip_payments_disabled");
  const { data, error } = await supabase.functions.invoke("create-chip-purchase", { body: { plan, period } });
  if (error) throw error;
  if (!data?.checkout_url || typeof data.checkout_url !== "string") throw new Error(data?.error || "invalid_chip_response");
  return data.checkout_url as string;
}
