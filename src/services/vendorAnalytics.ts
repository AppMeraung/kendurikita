import { supabase } from "./supabase";

export type VendorAnalytics = {
  views: number;
  enquiries: number;
  bookings: number;
  conversion: number;
  averageResponseHours: number | null;
  monthlyRevenue: number;
  packages: { name: string; views: number }[];
  states: { name: string; customers: number }[];
};
export type CompetitorBenchmark = {
  peerCount: number;
  averageMonthlyViews: number;
  averageMonthlyLeads: number;
  averageRating: number | null;
  averageStartingPrice: number | null;
};

export async function loadVendorCompetitorBenchmark(): Promise<CompetitorBenchmark | null> {
  const result = await supabase.rpc("vendor_competitor_benchmark");
  if (result.error) throw result.error;
  const row = result.data?.[0];
  if (!row) return null;
  return {
    peerCount: Number(row.peer_count),
    averageMonthlyViews: Number(row.average_monthly_views || 0),
    averageMonthlyLeads: Number(row.average_monthly_leads || 0),
    averageRating: row.average_rating == null ? null : Number(row.average_rating),
    averageStartingPrice: row.average_starting_price == null ? null : Number(row.average_starting_price),
  };
}

export async function loadVendorAnalytics(): Promise<VendorAnalytics> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("sign_in_required");
  const vendor = await supabase.from("vendors").select("id").eq("owner_id", user.id).single();
  if (vendor.error) throw vendor.error;
  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const [views, leads, accepted, payments, packageRows] = await Promise.all([
    supabase.from("vendor_profile_views").select("id", { count: "exact", head: true }).eq("vendor_id", vendor.data.id),
    supabase.from("leads").select("id,created_at,status,events(venue)", { count: "exact" }).eq("vendor_id", vendor.data.id),
    supabase.from("quotations").select("id", { count: "exact", head: true }).eq("vendor_id", vendor.data.id).eq("status", "accepted"),
    supabase.from("payments").select("amount").eq("vendor_id", vendor.data.id).gte("paid_at", monthStart.toISOString()),
    supabase.from("vendor_packages").select("id,name,vendor_package_views(id)").eq("vendor_id", vendor.data.id),
  ]);
  for (const result of [views, leads, accepted, payments, packageRows]) if (result.error) throw result.error;
  const messages = await supabase.from("messages").select("lead_id,sender_id,created_at").in("lead_id", (leads.data || []).map((lead) => lead.id)).eq("sender_id", user.id).order("created_at");
  if (messages.error) throw messages.error;
  const firstResponse = new Map<string, string>();
  for (const message of messages.data || []) if (!firstResponse.has(message.lead_id)) firstResponse.set(message.lead_id, message.created_at);
  const responseHours = (leads.data || []).map((lead) => firstResponse.get(lead.id) ? (new Date(firstResponse.get(lead.id)!).getTime() - new Date(lead.created_at).getTime()) / 3600000 : null).filter((value): value is number => value != null && value >= 0);
  const stateCounts = new Map<string, number>();
  for (const lead of leads.data || []) {
    const event = Array.isArray(lead.events) ? lead.events[0] : lead.events;
    const place = event?.venue?.trim(); if (place) stateCounts.set(place, (stateCounts.get(place) || 0) + 1);
  }
  const enquiries = leads.count || 0; const bookings = accepted.count || 0;
  return {
    views: views.count || 0,
    enquiries,
    bookings,
    conversion: enquiries ? bookings / enquiries * 100 : 0,
    averageResponseHours: responseHours.length ? responseHours.reduce((sum, value) => sum + value, 0) / responseHours.length : null,
    monthlyRevenue: (payments.data || []).reduce((sum, row) => sum + Number(row.amount), 0),
    packages: ((packageRows.data || []) as unknown as { name: string; vendor_package_views: { id: number }[] }[]).map((row) => ({ name: row.name, views: row.vendor_package_views.length })).sort((a, b) => b.views - a.views),
    states: [...stateCounts].map(([name, customers]) => ({ name, customers })).sort((a, b) => b.customers - a.customers),
  };
}

export async function recordVendorViews(vendorId: string, packageIds: string[]) {
  const profile = await supabase.rpc("record_vendor_profile_view", { target: vendorId });
  if (profile.error) throw profile.error;
  if (packageIds.length) {
    const packages = await supabase.rpc("record_vendor_package_views", { target: vendorId, packages: packageIds });
    if (packages.error) throw packages.error;
  }
}
