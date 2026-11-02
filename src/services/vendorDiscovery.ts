import { DiscoverableVendor } from "../domain/vendorDiscovery";
import { supabase } from "./supabase";

type VendorRow = {
  id: string;
  company_name: string;
  slug: string;
  coverage: unknown;
  languages: string[] | null;
  badges: string[] | null;
  policies: Record<string, unknown> | null;
  address: { latitude?: number; longitude?: number } | null;
  vendor_categories: { category: string }[] | null;
  vendor_packages: { price: number }[] | null;
  vendor_reviews: { rating: number }[] | null;
  vendor_availability: { starts_at: string; status: string }[] | null;
};

function stringList(value: unknown) {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (value && typeof value === "object") return Object.values(value).filter((item): item is string => typeof item === "string");
  return [];
}

export async function loadDiscoverableVendors(): Promise<DiscoverableVendor[]> {
  const { data, error } = await supabase.from("vendors").select("id,company_name,slug,coverage,languages,badges,policies,address,vendor_categories(category),vendor_packages(price),vendor_reviews(rating),vendor_availability(starts_at,status)").eq("verification_status", "approved").eq("vendor_packages.active", true).eq("vendor_reviews.verified", true);
  if (error) throw error;
  return ((data || []) as unknown as VendorRow[]).map((row) => {
    const ratings = (row.vendor_reviews || []).map((item) => Number(item.rating)).filter(Number.isFinite);
    const prices = (row.vendor_packages || []).map((item) => Number(item.price)).filter(Number.isFinite);
    return {
      id: row.id,
      companyName: row.company_name,
      slug: row.slug,
      categories: (row.vendor_categories || []).map((item) => item.category),
      coverage: stringList(row.coverage),
      languages: row.languages || [],
      badges: row.badges || [],
      rating: ratings.length ? ratings.reduce((sum, value) => sum + value, 0) / ratings.length : 0,
      reviewCount: ratings.length,
      minimumPrice: prices.length ? Math.min(...prices) : null,
      responseRate: Number(row.policies?.response_rate || 0),
      sponsored: (row.badges || []).some((badge) => badge.toLowerCase() === "premium"),
      unavailableDates: (row.vendor_availability || []).filter((item) => item.status === "booked").map((item) => item.starts_at.slice(0, 10)),
      latitude: Number.isFinite(row.address?.latitude) ? Number(row.address!.latitude) : undefined,
      longitude: Number.isFinite(row.address?.longitude) ? Number(row.address!.longitude) : undefined,
    };
  });
}
