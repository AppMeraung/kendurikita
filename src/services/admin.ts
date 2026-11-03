import { supabase } from "./supabase";

export async function loadAdminDashboard() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Log masuk diperlukan.");
  const profile = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile.error || !["admin", "superadmin"].includes(profile.data?.role))
    throw new Error("Akses admin diperlukan.");
  const [vendors, reviews, portfolio, reports, subscriptions, categories, users, events, leads] =
    await Promise.all([
      supabase
        .from("vendors")
        .select(
          "id,company_name,verification_status,rejection_reason,badges,verification_documents,created_at",
        )
        .order("created_at", { ascending: false }),
      supabase
        .from("vendor_reviews")
        .select("id,rating,body,photo_paths,verified,created_at,vendors(company_name)")
        .order("created_at", { ascending: false }),
      supabase
        .from("vendor_portfolio")
        .select("id,media_url,media_type,caption,moderation_status,vendors(company_name)")
        .order("sort_order"),
      supabase
        .from("moderation_reports")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("subscriptions")
        .select("id,entitlement,provider,status,expires_at,updated_at")
        .order("updated_at", { ascending: false }),
      supabase.from("marketplace_categories").select("*").order("sort_order"),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("events").select("id", { count: "exact", head: true }),
      supabase.from("leads").select("id", { count: "exact", head: true }).eq("status", "confirmed"),
    ]);
  for (const result of [vendors, reviews, portfolio, reports, subscriptions, categories, leads])
    if (result.error) throw result.error;
  return {
    vendors: vendors.data || [],
    reviews: reviews.data || [],
    portfolio: portfolio.data || [],
    reports: reports.data || [],
    subscriptions: subscriptions.data || [],
    categories: categories.data || [],
    userCount: users.count || 0,
    eventCount: events.count || 0,
    confirmedBookingCount: leads.count || 0,
  };
}

export async function moderateVendor(
  id: string,
  decision: "approved" | "rejected",
  reason?: string,
) {
  const { error } = await supabase.rpc("moderate_vendor", {
    target: id,
    decision,
    reason: reason || null,
  });
  if (error) throw error;
}

export async function moderateReview(id: string, publish: boolean) {
  const { error } = await supabase.rpc("moderate_review", {
    target: id,
    publish,
  });
  if (error) throw error;
}

export async function moderatePortfolio(id: string, publish: boolean) {
  const { error } = await supabase.rpc("moderate_portfolio", { target: id, publish });
  if (error) throw error;
}

export async function setVendorBadges(id: string, badges: string[]) {
  if (badges.includes("halal")) {
    const vendor = await supabase
      .from("vendors")
      .select("verification_documents")
      .eq("id", id)
      .single();
    if (vendor.error) throw vendor.error;
    if (!vendor.data.verification_documents?.halal)
      throw new Error("halal_certificate_required");
  }
  const { error } = await supabase.rpc("set_vendor_badges", {
    target: id,
    values: badges,
  });
  if (error) throw error;
}

export async function openVendorVerificationDocument(path: string) {
  const result = await supabase.storage
    .from("vendor-verification")
    .createSignedUrl(path, 60);
  if (result.error) throw result.error;
  return result.data.signedUrl;
}

export async function saveCategory(key: string, label: string, active = true) {
  const { error } = await supabase.from("marketplace_categories").upsert({
    key: key
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, "_"),
    label: { ms: label.trim(), en: label.trim() },
    active,
  });
  if (error) throw error;
}

export async function setCategoryActive(key: string, active: boolean) {
  const { error } = await supabase.from("marketplace_categories").update({ active }).eq("key", key);
  if (error) throw error;
}

export async function updateSubscription(id: string, status: "active" | "grace" | "cancelled" | "expired", expiry?: string) {
  const { error } = await supabase.rpc("admin_update_subscription", {
    target: id,
    next_status: status,
    next_expiry: expiry || null,
  });
  if (error) throw error;
}

export async function resolveReport(
  id: string,
  status: "resolved" | "dismissed",
  resolution: string,
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Log masuk diperlukan.");
  const { error } = await supabase
    .from("moderation_reports")
    .update({
      status,
      resolution: resolution.trim(),
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", id);
  if (error) throw error;
}
