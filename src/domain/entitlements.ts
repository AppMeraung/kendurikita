export type UserPlan = "basic" | "pro" | "premium";
export type VendorPlan = "basic" | "pro" | "premium";

export const userLimits = {
  basic: { events: 1, guests: 100, members: 1, storageMb: 50 },
  pro: { events: 1, guests: 500, members: 5, storageMb: 1024 },
  premium: {
    events: 3,
    guests: Infinity,
    members: Infinity,
    storageMb: 5120,
  },
} as const;
export const vendorLimits = {
  basic: { categories: 1, states: 1, photos: 10, packages: 2, leads: 5 },
  pro: { categories: 3, states: 3, photos: 100, packages: 10, leads: Infinity },
  premium: {
    categories: Infinity,
    states: Infinity,
    photos: Infinity,
    packages: Infinity,
    leads: Infinity,
  },
} as const;

export function userCanAdd(
  plan: UserPlan,
  resource: keyof (typeof userLimits)["basic"],
  current: number,
  increment = 1,
) {
  return current + increment <= userLimits[plan][resource];
}

export function vendorCanAdd(
  plan: VendorPlan,
  resource: keyof (typeof vendorLimits)["basic"],
  current: number,
  increment = 1,
) {
  return current + increment <= vendorLimits[plan][resource];
}

export function userFeature(
  plan: UserPlan,
  feature:
    | "automatic_rsvp_reminders"
    | "qr"
    | "seating"
    | "guestbook"
    | "exports"
    | "gallery"
    | "custom_invitation"
    | "invitation_music"
    | "priority_support",
) {
  if (
    feature === "gallery" ||
    feature === "custom_invitation" ||
    feature === "invitation_music" ||
    feature === "priority_support"
  )
    return plan === "premium";
  return plan !== "basic";
}

export function vendorFeature(
  plan: VendorPlan,
  feature:
    | "video"
    | "quotations"
    | "invoices"
    | "full_analytics"
    | "competitor_analytics"
    | "premium_badge"
    | "featured",
) {
  if (
    feature === "video" ||
    feature === "competitor_analytics" ||
    feature === "premium_badge" ||
    feature === "featured"
  )
    return plan === "premium";
  return plan !== "basic";
}
