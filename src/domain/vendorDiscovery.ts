export type DiscoverableVendor = {
  id: string;
  companyName: string;
  slug: string;
  categories: string[];
  coverage: string[];
  languages: string[];
  badges: string[];
  rating: number;
  reviewCount: number;
  minimumPrice: number | null;
  responseRate: number;
  sponsored: boolean;
  unavailableDates: string[];
  latitude?: number;
  longitude?: number;
};

export type VendorSort = "relevance" | "rating" | "price" | "nearest";

export type VendorFilters = {
  query?: string;
  category?: string;
  state?: string;
  date?: string;
  minimumPrice?: number;
  maximumPrice?: number;
  minimumRating?: number;
  halal?: boolean;
  language?: string;
  sort?: VendorSort;
  origin?: { latitude: number; longitude: number };
};

const contains = (values: string[], query?: string) =>
  !query || values.some((value) => value.toLowerCase().includes(query.toLowerCase()));

export function vendorDistanceKm(vendor: DiscoverableVendor, origin?: VendorFilters["origin"]) {
  if (!origin || !Number.isFinite(vendor.latitude) || !Number.isFinite(vendor.longitude)) return null;
  const radians = (value: number) => value * Math.PI / 180;
  const lat1 = radians(origin.latitude);
  const lat2 = radians(vendor.latitude!);
  const dLat = lat2 - lat1;
  const dLon = radians(vendor.longitude! - origin.longitude);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export function discoverVendors(vendors: DiscoverableVendor[], filters: VendorFilters) {
  const query = filters.query?.trim().toLowerCase();
  return vendors.filter((vendor) => {
    if (query && !`${vendor.companyName} ${vendor.categories.join(" ")}`.toLowerCase().includes(query)) return false;
    if (!contains(vendor.categories, filters.category)) return false;
    if (!contains(vendor.coverage, filters.state)) return false;
    if (filters.date && vendor.unavailableDates.includes(filters.date)) return false;
    if (filters.minimumPrice != null && (vendor.minimumPrice == null || vendor.minimumPrice < filters.minimumPrice)) return false;
    if (filters.maximumPrice != null && (vendor.minimumPrice == null || vendor.minimumPrice > filters.maximumPrice)) return false;
    if (filters.minimumRating != null && vendor.rating < filters.minimumRating) return false;
    if (filters.halal && !vendor.badges.some((badge) => badge.toLowerCase() === "halal")) return false;
    if (!contains(vendor.languages, filters.language)) return false;
    return true;
  }).sort((a, b) => {
    if (filters.sort === "rating") return b.rating - a.rating || b.reviewCount - a.reviewCount;
    if (filters.sort === "price") return (a.minimumPrice ?? Number.POSITIVE_INFINITY) - (b.minimumPrice ?? Number.POSITIVE_INFINITY) || b.rating - a.rating;
    if (filters.sort === "nearest") return (vendorDistanceKm(a, filters.origin) ?? Number.POSITIVE_INFINITY) - (vendorDistanceKm(b, filters.origin) ?? Number.POSITIVE_INFINITY) || b.rating - a.rating;
    return Number(b.sponsored) - Number(a.sponsored) || b.rating - a.rating || b.responseRate - a.responseRate || a.companyName.localeCompare(b.companyName);
  });
}

export function toggleVendorComparison(current: string[], id: string) {
  if (current.includes(id)) return current.filter((value) => value !== id);
  return current.length < 3 ? [...current, id] : current;
}
