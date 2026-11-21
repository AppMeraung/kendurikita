import { describe, expect, it } from "vitest";
import { DiscoverableVendor, discoverVendors, toggleVendorComparison, vendorDistanceKm, vendorCategoryNotice } from "./vendorDiscovery";

const vendor = (overrides: Partial<DiscoverableVendor> = {}): DiscoverableVendor => ({ id: "1", companyName: "Seri Catering", slug: "seri", categories: ["Catering"], coverage: ["Selangor"], languages: ["ms"], badges: ["Halal"], rating: 4.5, reviewCount: 10, minimumPrice: 1000, responseRate: 90, sponsored: false, unavailableDates: [], ...overrides });

describe("vendor discovery", () => {
  it("filters every supported discovery field", () => {
    const result = discoverVendors([vendor(), vendor({ id: "2", badges: [], coverage: ["Johor"] })], { query: "seri", category: "cater", state: "selang", date: "2026-12-01", maximumPrice: 1200, minimumRating: 4, halal: true, language: "ms" });
    expect(result.map((item) => item.id)).toEqual(["1"]);
  });
  it("excludes booked dates and ranks sponsored vendors first", () => {
    const result = discoverVendors([vendor({ id: "1", rating: 5, unavailableDates: ["2026-12-01"] }), vendor({ id: "2", sponsored: true, rating: 3 })], { date: "2026-12-01" });
    expect(result.map((item) => item.id)).toEqual(["2"]);
  });
  it("limits comparison to three vendors and supports removal", () => {
    expect(toggleVendorComparison(["1", "2", "3"], "4")).toEqual(["1", "2", "3"]);
    expect(toggleVendorComparison(["1", "2"], "1")).toEqual(["2"]);
  });
  it("sorts by rating, price and real coordinate distance", () => {
    const rows = [vendor({ id: "far", rating: 5, minimumPrice: 2000, latitude: 4, longitude: 102 }), vendor({ id: "near", rating: 4, minimumPrice: 500, latitude: 3.14, longitude: 101.69 })];
    expect(discoverVendors(rows, { sort: "rating" })[0].id).toBe("far");
    expect(discoverVendors(rows, { sort: "price" })[0].id).toBe("near");
    expect(discoverVendors(rows, { sort: "nearest", origin: { latitude: 3.139, longitude: 101.687 } })[0].id).toBe("near");
    expect(vendorDistanceKm(vendor(), undefined)).toBeNull();
  });
});

describe("vendor category screens", () => {
  it("uses an exact category key without changing free-text category filters", () => {
    const rows = [vendor({ id: "decor", categories: ["Decor"] }), vendor({ id: "other", categories: ["decor_supply"] })];
    expect(discoverVendors(rows, { categoryKey: "decor" }).map((item) => item.id)).toEqual(["decor"]);
    expect(discoverVendors(rows, { category: "decor" }).map((item) => item.id)).toEqual(["decor", "other"]);
  });

  it("distinguishes invalid, unconfigured, unavailable, loading and empty categories", () => {
    const idle = { knownCategory: true, configured: true, loading: false, unavailable: false, hasMatches: false };
    expect(vendorCategoryNotice({ ...idle, knownCategory: false })).toBe("invalidVendorCategory");
    expect(vendorCategoryNotice({ ...idle, configured: false })).toBe("cloudRequired");
    expect(vendorCategoryNotice({ ...idle, unavailable: true })).toBe("vendorLoadFailed");
    expect(vendorCategoryNotice({ ...idle, unavailable: true, hasMatches: true })).toBe("vendorLoadFailed");
    expect(vendorCategoryNotice({ ...idle, loading: true })).toBe("loading");
    expect(vendorCategoryNotice(idle)).toBe("emptyVendorCategory");
    expect(vendorCategoryNotice({ ...idle, hasMatches: true })).toBe(null);
  });
});
