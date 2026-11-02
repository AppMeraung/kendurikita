import { UserPlan, VendorPlan } from "../domain/entitlements";
import { planFromEntitlements } from "../domain/plans";
import { activeEntitlements, purchasesConfigured } from "./revenuecat";
import { cloudConfigured, supabase } from "./supabase";

export async function resolveUserPlan(eventId?: string): Promise<UserPlan> {
  const keys: string[] = [];
  if (purchasesConfigured) {
    const revenueCat = await activeEntitlements();
    keys.push(...Object.keys(revenueCat));
  }
  if (cloudConfigured) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      let query = supabase
        .from("subscriptions")
        .select("entitlement,expires_at")
        .eq("user_id", user.id)
        .in("status", ["active", "grace"]);
      if (eventId) query = query.or(`event_id.eq.${eventId},event_id.is.null`);
      const { data, error } = await query;
      if (error) throw error;
      const now = Date.now();
      keys.push(
        ...(data || [])
          .filter(
            (item) =>
              !item.expires_at || new Date(item.expires_at).getTime() > now,
          )
          .map((item) => item.entitlement),
      );
    }
  }
  return planFromEntitlements(keys);
}

export async function resolveVendorPlan(): Promise<VendorPlan> {
  if (!cloudConfigured) return "basic";
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return "basic";
  const vendor = await supabase
    .from("vendors")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (vendor.error) throw vendor.error;
  if (!vendor.data) return "basic";
  const { data, error } = await supabase
    .from("subscriptions")
    .select("entitlement,expires_at")
    .eq("vendor_id", vendor.data.id)
    .in("status", ["active", "grace"]);
  if (error) throw error;
  const now = Date.now();
  return planFromEntitlements(
    (data || [])
      .filter(
        (item) => !item.expires_at || new Date(item.expires_at).getTime() > now,
      )
      .map((item) => item.entitlement),
  );
}
