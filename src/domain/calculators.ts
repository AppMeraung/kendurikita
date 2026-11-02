export function monthlySavings(
  target: number,
  current: number,
  eventDate: Date,
  now = new Date(),
) {
  if (
    !Number.isFinite(target) ||
    !Number.isFinite(current) ||
    Number.isNaN(eventDate.getTime()) ||
    target < 0 ||
    current < 0
  )
    return 0;
  const remaining = Math.max(0, target - current);
  const months = Math.max(
    1,
    (eventDate.getFullYear() - now.getFullYear()) * 12 +
      eventDate.getMonth() -
      now.getMonth(),
  );
  return Math.ceil(remaining / months);
}

export function cateringQuantities(pax: number) {
  const safe = Number.isFinite(pax) ? Math.max(0, Math.floor(pax)) : 0;
  return {
    riceKg: Math.ceil(safe * 0.1),
    chickenKg: Math.ceil(safe * 0.12),
    beefKg: Math.ceil(safe * 0.08),
    vegetablesKg: Math.ceil(safe * 0.08),
    oilLitres: Math.ceil(safe * 0.02),
    plates: Math.ceil(safe * 1.1),
    cups: Math.ceil(safe * 1.2),
    tables: Math.ceil(safe / 10),
  };
}

export function savingsProgress(target: number, current: number) {
  if (target <= 0 || !Number.isFinite(target) || !Number.isFinite(current))
    return 0;
  return Math.min(100, Math.max(0, Math.round((current / target) * 100)));
}

export function referralReward(
  kind: "user" | "vendor",
  activeReferrals: number,
) {
  return kind === "user"
    ? activeReferrals >= 3
      ? "event_pro"
      : null
    : activeReferrals >= 1
      ? "vendor_month"
      : null;
}
